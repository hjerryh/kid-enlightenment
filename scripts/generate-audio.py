#!/usr/bin/env python3
"""Generate bundled English or Mandarin narration from the curriculum.

Default: neural voices via edge-tts (network required during generation only).
Requires edge-tts, FFmpeg/ffprobe, and Node 22.18+. macOS say remains available
with --engine macos. All clips are staged and checked before publishing a set.
"""

import argparse
import asyncio
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
NEURAL_VOICES = {"en": "en-US-JennyNeural", "zh": "zh-CN-XiaoxiaoNeural"}
NEURAL_RATES = {"en": "-10%", "zh": "-8%"}
PROMPTS = {
    "welcome": "Hello, little explorer! Let us discover something new.",
    "well-done": "Wonderful! You did it.",
    "try-again": "Good try! Let us listen again.",
}
# Keep natural pitch and pauses; equalize perceived loudness without boosting peaks.
# Silence is trimmed only at either end, never between words in a sentence.
AUDIO_FILTER = (
    "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.04,"
    "areverse,"
    "silenceremove=start_periods=1:start_duration=0.02:start_threshold=-55dB:start_silence=0.08,"
    "areverse,loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.12"
)


def measure_loudness(path, ffmpeg):
    """Measure the encoded file, including short-word pauses and MP3 peaks."""
    result = subprocess.run([
        ffmpeg, "-nostdin", "-hide_banner", "-i", str(path),
        "-af", "loudnorm=I=-18:TP=-2:LRA=7:print_format=json",
        "-f", "null", "-",
    ], check=True, capture_output=True, text=True)
    start = result.stderr.rfind("{")
    if start < 0:
        raise RuntimeError(f"No loudness measurements for {path}")
    values, _ = json.JSONDecoder().raw_decode(result.stderr[start:])
    integrated, peak = float(values["input_i"]), float(values["input_tp"])
    if not math.isfinite(peak):
        raise RuntimeError(f"Silent or invalid narration: {path}")
    measurement = {"integratedLufs": integrated, "truePeakDbtp": peak}
    if not math.isfinite(integrated):
        # EBU integrated loudness needs a 400ms window. Very short words use
        # conservative RMS instead; do not amplify an undefined LUFS reading.
        result = subprocess.run([
            ffmpeg, "-nostdin", "-hide_banner", "-i", str(path),
            "-af", "volumedetect", "-f", "null", "-",
        ], check=True, capture_output=True, text=True)
        match = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?|-inf)\s*dB", result.stderr)
        rms = float(match.group(1)) if match else float("-inf")
        if not math.isfinite(rms):
            raise RuntimeError(f"Silent or invalid short narration: {path}")
        measurement["integratedLufs"] = None
        measurement["rmsDbfs"] = rms
    return measurement


def correct_loudness(source, target, ffmpeg):
    """Use fixed gain after measuring; preserve timing and natural pitch."""
    before = measure_loudness(source, ffmpeg)
    desired_gain = (
        -18 - before["integratedLufs"]
        if before["integratedLufs"] is not None
        else -21 - before["rmsDbfs"]
    )
    # Keep headroom for MP3 re-encoding. Peaks take precedence over loudness;
    # a naturally dynamic phrase may therefore finish below the -18 LUFS target.
    gain = min(desired_gain, -2.2 - before["truePeakDbtp"], 12)
    for attempt in range(3):
        subprocess.run([
            ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(source), "-af", f"volume={gain:.6f}dB",
            "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", "24000", "-ac", "1",
            str(target),
        ], check=True)
        after = measure_loudness(target, ffmpeg)
        if after["truePeakDbtp"] <= -2:
            return after
        # Always re-encode the same intermediate, not the last encoded result.
        gain -= after["truePeakDbtp"] + 2.2
    raise RuntimeError(f"Could not keep narration below -2 dBTP: {target}")


def read_scripts(language, node):
    """Read exactly the words and prompts the application displays."""
    source = (
        "import { createQuestions } from './src/lib/learning.ts'; "
        "import { concepts } from './src/data/curriculum.ts'; "
        "import { localizeConcept } from './src/data/localization.ts'; "
        "const language = " + json.dumps(language) + "; "
        "console.log(JSON.stringify({"
        "words: Object.fromEntries(concepts.map(c => [c.id, localizeConcept(c, language).word])),"
        "questions: Object.fromEntries(['3-4','5-6','7-8'].flatMap(age => "
        "createQuestions('all', age, concepts.length, language).map(q => [q.id, q.audioText])))"
        "}));"
    )
    data = json.loads(subprocess.check_output(
        [node, "--input-type=module", "-e", source], cwd=ROOT, text=True,
    ))
    prompts = {
        "welcome": "欢迎，小小探险家！我们一起发现新事物吧。",
        "well-done": "太棒了！你做到了。",
        "try-again": "加油！我们再听一次。",
    } if language == "zh" else PROMPTS
    return {**data["words"], **prompts, **dict(sorted(data["questions"].items()))}


def probe(path, ffprobe, text):
    data = json.loads(subprocess.check_output([
        ffprobe, "-v", "error", "-show_entries", "format=duration,size", "-of", "json", str(path),
    ], text=True))["format"]
    duration, size = float(data["duration"]), int(data["size"])
    # Leave at least three seconds for loading before the app's 15s timeout.
    if not 0.2 <= duration <= 12 or size < 1000:
        raise RuntimeError(f"Invalid narration duration/size: {path} ({duration:.2f}s, {size} bytes)")
    return {
        "text": text, "duration": duration, "bytes": size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def atomic_text(path, text):
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(text)
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--language", choices=("en", "zh"), default="en")
    parser.add_argument("--engine", choices=("edge", "macos"), default="edge")
    parser.add_argument("--voice", help="Neural default: Jenny (English) / Xiaoxiao (Mandarin)")
    parser.add_argument("--rate", help="Neural: signed percentage, e.g. --rate=-10%%; macOS: words/minute")
    parser.add_argument("--force", action="store_true", help="Regenerate even when settings and text match")
    parser.add_argument("--jobs", type=int, default=2, help="Concurrent generation workers (1–4)")
    args = parser.parse_args()
    args.voice = args.voice or (NEURAL_VOICES[args.language] if args.engine == "edge" else (
        "Tingting" if args.language == "zh" else "Samantha"
    ))
    args.rate = args.rate or (NEURAL_RATES[args.language] if args.engine == "edge" else "145")
    if args.engine == "edge" and not re.fullmatch(r"[+-]\d+%", args.rate):
        parser.error("Neural rate must be a signed percentage, e.g. --rate=-10%")
    if args.engine == "macos" and not re.fullmatch(r"[1-9]\d*", args.rate):
        parser.error("macOS rate must be a positive number of words per minute")
    ffmpeg, ffprobe, node = (shutil.which(name) for name in ("ffmpeg", "ffprobe", "node"))
    if not all((ffmpeg, ffprobe, node)):
        parser.error("FFmpeg, ffprobe and Node 22.18+ must be on PATH")
    say = shutil.which("say")
    if args.engine == "macos" and not say:
        parser.error("The macos engine requires macOS say")
    if args.engine == "edge":
        try:
            import edge_tts
        except ImportError:
            parser.error("Install edge-tts: python3 -m pip install -r scripts/requirements-audio.txt")

    destination = ROOT / "public" / "audio"
    if args.language == "zh":
        destination /= "zh"
    destination.mkdir(parents=True, exist_ok=True)
    scripts = read_scripts(args.language, node)
    profile = {
        "engine": args.engine, "voice": args.voice, "rate": args.rate,
        "pitch": "+0Hz", "processing": AUDIO_FILTER, "sampleRate": 24000, "bitrate": "96k",
        "loudnessCorrection": "measured-gain-v1",
    }
    profile_id = hashlib.sha256(json.dumps(profile, sort_keys=True).encode()).hexdigest()[:16]
    stage = ROOT / ".audio-cache" / args.language / profile_id
    stage.mkdir(parents=True, exist_ok=True)
    # The preceding neural generation is already downloaded and processed.
    # Its exact profile can be reused as an intermediate without network calls.
    intermediate_profile = {key: value for key, value in profile.items() if key != "loudnessCorrection"}
    intermediate_id = hashlib.sha256(json.dumps(intermediate_profile, sort_keys=True).encode()).hexdigest()[:16]
    intermediate_stage = ROOT / ".audio-cache" / args.language / intermediate_id
    manifest_path = destination / "manifest.json"
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest = {
        "language": "zh-CN" if args.language == "zh" else "en-US",
        **profile, "profile": profile_id, "clips": {},
    }

    def generate_clip(item):
        clip_id, text = item
        current = destination / f"{clip_id}.mp3"
        old_clip = previous.get("clips", {}).get(clip_id, {})
        if not args.force and previous.get("profile") == profile_id and old_clip.get("text") == text and current.exists():
            try:
                metadata = probe(current, ffprobe, text)
                if metadata["sha256"] == old_clip.get("sha256"):
                    return clip_id, metadata, current
            except (RuntimeError, subprocess.CalledProcessError, ValueError, KeyError, OSError):
                # Recover a damaged published file from staging or synthesis.
                pass
        # Cache by both text and complete voice/processing profile so interrupted
        # generation resumes without publishing a partly old, partly new voice set.
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
        ready = stage / f"{clip_id}-{text_hash}.mp3"
        if not args.force and ready.exists():
            try:
                return clip_id, probe(ready, ffprobe, text), ready
            except (RuntimeError, subprocess.CalledProcessError, ValueError, KeyError, OSError):
                ready.unlink(missing_ok=True)
        with tempfile.TemporaryDirectory(prefix=f"{clip_id}-", dir=stage) as temporary:
            intermediate = intermediate_stage / ready.name
            reuse_intermediate = not args.force and intermediate.exists()
            if reuse_intermediate:
                try:
                    probe(intermediate, ffprobe, text)
                except (RuntimeError, subprocess.CalledProcessError, ValueError, KeyError, OSError):
                    reuse_intermediate = False
            if not reuse_intermediate:
                source = Path(temporary) / ("source.mp3" if args.engine == "edge" else "source.aiff")
                if args.engine == "edge":
                    async def request_voice():
                        await edge_tts.Communicate(
                            text, args.voice, rate=args.rate, pitch="+0Hz",
                            connect_timeout=15, receive_timeout=30,
                        ).save(str(source))
                    for attempt in range(3):
                        try:
                            asyncio.run(request_voice())
                            break
                        except Exception:
                            if attempt == 2:
                                raise
                            time.sleep(2 ** attempt)
                else:
                    subprocess.run([say, "-v", args.voice, "-r", args.rate, "-o", str(source), text], check=True)
                intermediate = Path(temporary) / "processed.mp3"
                subprocess.run([
                    ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                    "-af", AUDIO_FILTER, "-codec:a", "libmp3lame", "-b:a", "96k",
                    "-ar", "24000", "-ac", "1", str(intermediate),
                ], check=True)
            corrected = Path(temporary) / "corrected.mp3"
            correct_loudness(intermediate, corrected, ffmpeg)
            metadata = probe(corrected, ffprobe, text)
            corrected.replace(ready)
        return clip_id, metadata, ready

    results = []
    with ThreadPoolExecutor(max_workers=min(4, max(1, args.jobs))) as executor:
        try:
            for index, result in enumerate(executor.map(generate_clip, scripts.items()), 1):
                results.append(result)
                clip_id, clip, _ = result
                print(f"{index}/{len(scripts)} {clip_id}: {clip['duration']:.2f}s / {clip['bytes']} bytes", flush=True)
        except BaseException:
            # Stop queued requests on an outage; only current workers may finish.
            executor.shutdown(wait=False, cancel_futures=True)
            raise
    # All requests and probes have succeeded. Only now replace published clips.
    # Each MP3 replacement is atomic, and the complete manifest is published last.
    for clip_id, metadata, source in results:
        target = destination / f"{clip_id}.mp3"
        if source != target:
            temporary = target.with_suffix(".mp3.tmp")
            shutil.copyfile(source, temporary)
            temporary.replace(target)
        manifest["clips"][clip_id] = metadata
    atomic_text(manifest_path, json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    module = ROOT / "src" / "lib" / ("audio-manifest-zh.ts" if args.language == "zh" else "audio-manifest.ts")
    atomic_text(module,
        "// Generated by scripts/generate-audio.py. Keep narration and clips in sync.\n"
        + "export const " + ("recordedSpeechZh" if args.language == "zh" else "recordedSpeech")
        + ": Readonly<Record<string, string>> = "
        + json.dumps(scripts, indent=2, ensure_ascii=False) + ";\n",
    )
    print(f"Verified and published {len(scripts)} {args.language} clips: {args.voice} ({args.rate}).", flush=True)


if __name__ == "__main__":
    main()
