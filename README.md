# Little World

面向 **3–8 岁**儿童的中英文认知启蒙网页 App，适配 iPad、iPhone、Android 手机及电脑。纯前端运行，可部署为 PWA，支持添加到主屏幕。

## 运行

需要 Node.js 22.18+ 和 npm。

```bash
npm install
npm run dev
```

打开终端给出的地址。同一 Wi-Fi 下的手机或 iPad 可以打开终端列出的局域网地址。局域网 HTTP 可以体验学习功能；完整 PWA 和离线缓存需要 HTTPS，或本机 localhost。`npm run dev` 是开发模式，不安装离线缓存。

生产预览：

```bash
npm run build
npm run preview
```

部署时把 `dist/` 上传到支持 HTTPS 的静态网站托管服务，放在站点根路径。请将 `/sw.js` 和 `/index.html` 配置为重新验证缓存，带哈希的 `/assets/` 可长期缓存。没有服务端、数据库或环境密钥。

## 已有功能

- 右上角“中文 / English”一键切换，家长专区也可设置；界面、卡片、题目、配对与朗读同步切换，重新打开后记住语言。中英文共用认知进度，切换不会清空记录。
- 六个主题：Fruits、Animals、Colors、Numbers、Shapes、Our world，共 **106 个概念**：动物 62 个、数字 20 个，其余四个主题各 6 个。
- 动物包含完整十二生肖及生肖以外的 50 种动物。可按十二生肖（12）、陆地动物（23）、鸟类朋友（10）、水中动物（9）、更多动物朋友（8）浏览和练习；龙明确标注为传说中的动物。
- 数字改为参考图中的毛绒立体风格，覆盖 **0–19**，每张卡片包含数字大图、当前语言的名称与数值。平板每行四张，手机每行两张，支持直接搜索阿拉伯数字。
- 概念图片全部随应用提供：动物及其他主题使用原创 SVG，数字使用原创 WebP，加上狐狸角色和主题场景；点击图卡播放当前语言的词语，支持前后切换。选定动物分组后，图卡的前后切换也保留在当前分组内。
- Listen & find：常规每轮六道随机题，错误后可再试；结束后显示练习结果，错题回顾只包含本轮答错过的概念。
- Perfect pairs：低龄阶段图图配对，其他阶段图词配对；点词可听发音。听音找图和配对均支持动物分组，错题回顾保留本轮分组。
- 搜索中英文主题或词语、分类浏览、发现记录、练习统计、最近七天记录和发现徽章。
- 家长入口的简单算术门槛，提供学习阶段、每日目标、声音与清除本机进度。它防止儿童误入，不是身份认证。
- 本地保存进度：不需要账号，没有广告、麦克风、追踪或第三方内容请求。
- **854 条**随应用提供的录音：英文和普通话各 427 条，每种语言含 106 条概念词音频、318 个分龄题干、3 条提示。默认生成声线为美式英文 Jenny 和普通话 Xiaoxiao 神经网络女声，保留自然音高，语速分别放慢 10% 和 8%，并统一响度。Orange 在中文中区分为“橙子”和“橙色”。正常学习播放本地 MP3；录音加载失败时会尝试对应语言的设备语音，两者都无法播放时显示错误提示。
- 构建时生成 Service Worker，首次安全连接访问完成缓存后可离线使用，包含图片、字体、音频和应用代码，支持音频 Range 请求。

## 分级与统计

首次默认 **5–6 岁**、每日 **6 个概念**、声音开启、英文模式；这些是实现时选择的默认值，可在 Parents’ corner 调整。

| 学习阶段 | 听音找图                       | 配对         |
| -------- | ------------------------------ | ------------ |
| 3–4 岁   | 简短名称提示、两张图片         | 三组图图配对 |
| 5–6 岁   | 外形/声音等描述、四张图片      | 四组图词配对 |
| 7–8 岁   | 属性、关联和数量推理、四张图片 | 四组图词配对 |

数字图卡展示数字字形。3–4 岁通过“找出数字……”识数字，5–6 岁通过名称与字形建立对应，7–8 岁通过简单加减法选出结果。每题干扰项来自同一主题；选定动物分组时，答案和干扰项均来自该分组，避免跨主题或跨分组混淆。

“Discovered”指打开过图卡，或对其做过练习作答的概念，包括答错；“practiced correctly”指在练习里答对过的概念，不把看过图片称为掌握。每日目标按浏览器本地日期统计当天答对的不同概念数，不因重复点击增加。只有完成整轮练习才增加完成会话数，提前离开仍保存已经完成的发现和答题。

进度使用本机浏览器 localStorage，不跨设备同步，清理浏览器数据会清除进度。首次离线缓存需在生产构建中联网完成；Parents’ corner 显示 “Ready for offline adventures” 后，该浏览器才已准备好离线使用。开发预览不会完成这一步；清除网站数据也会移除离线缓存。App Store 发布、原生安装包和云端账号不在当前交付中。

## 验证

```bash
npm test          # 课程、进度、音频与 Service Worker 行为
npm run typecheck # TypeScript
npm run test:e2e  # 构建后运行真实 Chrome 的桌面、手机与离线测试
npm run test:webkit # 构建后运行 WebKit 的桌面、手机与离线测试
```

Chrome 测试使用系统 Google Chrome。没有 Chrome 时先安装 Chrome，或将 `playwright.config.ts` 中 Chrome 项目的 `channel` 设置改为使用 Playwright Chromium，并运行 `npx playwright install chromium`。首次运行 WebKit 测试前执行 `npx playwright install webkit`。测试会启动或复用 4173 和 4174 端口上的开发/生产预览服务。

一次验证两个浏览器：`npm run build && npx playwright test`。手机测试使用浏览器的移动视口和触摸模拟；WebKit 测试用于验证 Safari 引擎行为，不代表已在实体 iPad 或 iPhone 上验收。

## 资源与维护

- `src/data/curriculum.ts`：六个主题及全部 106 个概念的统一入口。
- `src/data/animals.ts`：62 种动物的分组、中英文名称和分龄提示。
- `src/data/numbers.ts`：0–19 的数字值、中英文名称、识数提示与加减法题干。
- `src/data/localization.ts`：中文内容整合、主题翻译与语言转换。
- `src/lib/i18n.tsx`、`src/lib/language.ts`：语言切换、记忆和界面翻译。
- `src/lib/learning.ts`：随机题目和配对逻辑。
- `src/lib/progress.ts`：进度校验、储存模型和按本地日期统计。
- `src/lib/audio.ts`：单音频播放器、本地录音优先及对应语言的设备语音兜底。
- `src/components/`：探索、游戏、练习、进度和家长界面。
- `public/art/`、`public/audio/`：全部本地学习素材。
- `scripts/build-service-worker.mjs`：自动预缓存和音频 Range 支持。

基础插画和新增动物均使用 Python 3 标准库生成：

```bash
python3 scripts/generate-art.py
python3 scripts/generate-animals.py
```

`generate-animals.py` 生成 56 张新增动物 SVG，与原有六张动物图组成完整的 62 种动物。

毛绒数字生成器需要 Pillow、NumPy、SciPy、fontTools 及 Brotli（解码 WOFF2 字体）。先完成 `npm install`，脚本会读取项目中 `@fontsource/nunito` 提供的字体；无需下载外部图片或调用生成服务。可在独立 Python 环境中运行：

```bash
python3 -m venv .venv-art
.venv-art/bin/python -m pip install pillow numpy scipy fonttools brotli
.venv-art/bin/python scripts/generate-numbers.py
```

输出为 `public/art/numbers/` 下的 20 张 512×512 WebP，以及 `docs/screenshots/number-art-contact.jpg` 总览。

重新生成英文和普通话录音需要 Python 3、FFmpeg（`ffmpeg` 和 `ffprobe`）及 PATH 中的 Node.js 22.18+。建议在独立 Python 环境安装已固定版本的 `edge-tts`，不修改系统 Python：

```bash
python3 -m venv .venv-audio
.venv-audio/bin/python -m pip install -r scripts/requirements-audio.txt
.venv-audio/bin/python scripts/generate-audio.py
.venv-audio/bin/python scripts/generate-audio.py --language zh
npm run build
```

默认引擎为 `edge`，使用 `edge-tts==7.3.1` 调用 Edge 语音服务。**仅维护人员生成素材时**需要联网，并将公开课程词语、题干和提示文案发送给该服务；生成后的 MP3 随应用提供，儿童学习时不向该服务发送请求，完成缓存后仍可离线播放。

英文默认 `en-US-JennyNeural`、`--rate=-10%`，中文默认 `zh-CN-XiaoxiaoNeural`、`--rate=-8%`。两者保留自然音高；处理裁剪首尾静音、保留句内停顿，并在编码后测量响度、校正短词音量。响度目标为 -18 LUFS，真峰值上限为 -2 dBTP；有些录音受峰值约束会略轻，极短词使用保守的 RMS 测量。输出为 24 kHz、96 kbps、单声道 MP3。可用 `--voice`、`--rate` 调整声线与语速，`--jobs` 设置 1–4 个并发任务。

生成器把声线、引擎、语速和音频处理参数纳入配置指纹，并校验文案与文件哈希。已生成的素材暂存于 `.audio-cache/`；某种语言的全部录音生成并检查成功后，才替换该语言的发布素材与清单。联网生成失败会保留原有发布资源，下次运行可复用有效暂存结果。每条录音限制在 0.2–12 秒，为播放器的加载与超时处理留出余量。

需要离线维护生成时，可显式选择旧的 macOS `say` 引擎；它需要系统已安装相应声线，默认仍为 Samantha／Tingting：

```bash
.venv-audio/bin/python scripts/generate-audio.py --engine macos --language en --rate 145
.venv-audio/bin/python scripts/generate-audio.py --engine macos --language zh --rate 145
```

任何声线或课程文案更新后，都应重新生成对应语言的录音并构建。Service Worker 的版本包含音频文件内容，生产站点联网更新完成后会使用新声音。生成与浏览器验证结果记录于 `docs/verification.md`。

参考照片用于理解功能、数字造型与排版，没有复制照片中的素材。动物采用原创绘本风格，数字采用本地程序绘制的毛绒立体风格；学习分类纠正了参考图中动物和食物的分类问题。原始分析见 `docs/research/2026-10-22-reference-notes.md`。
