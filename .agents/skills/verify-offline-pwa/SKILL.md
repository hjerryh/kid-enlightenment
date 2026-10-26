---
name: verify-offline-pwa
description: 验收本项目的响应式 PWA、双语音频和离线缓存；用于声音或素材更新后的离线回归、缓存更新排查，以及手机和平板学习流程检查。按实际改动选用现有测试，并区分浏览器模拟、旧版本升级和实体设备验证。
---

# PWA 离线验收

用当前构建和真实发布素材证明选定流程可用。复用仓库内测试，报告本次实际执行的范围；验收本身不包括重新生成课程音频、发布站点或清除用户数据。

## 确定环境与范围

以下命令从项目根目录运行。先定位 [package.json](../../../package.json)、[Playwright 配置](../../../playwright.config.ts) 和本次改动。将 skill 用到其他仓库时，先找到对应的构建、缓存和测试入口，再调整命令，不能沿用这里的端口或文件名作为假定。

本项目的运行区别：

- `4173` 为 Vite 开发服务；[main.tsx](../../../src/main.tsx) 仅在生产模式注册 Service Worker。开发页面正常不能证明离线可用。
- `4174` 为生产预览，离线测试使用 `http://127.0.0.1:4174`。先构建，后测试；服务已启动也可能仍在提供旧 `dist/`。
- Playwright 启用 `reuseExistingServer`。复用端口前检查进程工作目录和返回的 HTML／资源是否属于当前项目；HTTP 200 不是充分证据。遇到别的项目占用端口时，不终止其进程，改用明确的测试端口并同步测试配置。
- `localhost`、`127.0.0.1`、局域网地址是不同源，缓存和 localStorage 不共享。更新前后保持同源；普通局域网 HTTP 不具备生产离线测试所需的安全上下文。
- 检查依赖和浏览器运行环境，按 [README](../../../README.md) 安装缺少的依赖。使用独立测试上下文，不借验收删除用户的缓存或学习进度。

## 按改动选择检查

| 改动／问题                           | 优先复用的检查                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 录音、双语内容、语言切换             | `tests/audio.test.ts`、`tests/localization.test.ts`；`tests/e2e/language.spec.ts` 和 `tests/e2e/offline.spec.ts`        |
| Service Worker、缓存、构建资源       | `tests/service-worker.test.ts`；`tests/e2e/offline.spec.ts`；更新问题另做旧版本升级检查                                 |
| 课程数量、分组、新图片、手机布局     | `tests/learning.test.ts`、相关课程测试；`tests/e2e/expansion.spec.ts`；新增离线资源再选 `offline.spec.ts`               |
| 发现记录、答题、配对、复习或退出保存 | `tests/progress.test.ts`、`tests/learning.test.ts`；`tests/e2e/learning.spec.ts`；涉及语言状态时再选 `language.spec.ts` |

例如双语音频更新，可执行：

```bash
npx tsx --test tests/audio.test.ts tests/localization.test.ts
npm run build
npx playwright test tests/e2e/language.spec.ts tests/e2e/offline.spec.ts
```

未指定 `--project` 时运行配置中的 Chrome 和 WebKit；要验证完整产品流程时才扩大到：

```bash
npm test
npm run build
npx playwright test
```

构建和生成素材的步骤有依赖，不能并行读写同一套发布资源。大量语音生成结束后再跑浏览器检查，避免资源竞争导致假超时。选定检查通过后停止；只有新改动、失败或尚未解决的问题才扩大或重跑。

## 核对当前离线包

缓存实现以 [build-service-worker.mjs](../../../scripts/build-service-worker.mjs) 为准，不手改生成的 `dist/sw.js`。

1. 记录本次构建输出的缓存名、资源数和包大小。缓存名由 worker 逻辑、资源路径与文件字节共同计算，录音改了但文件名没变也应得到新版本。
2. 首次联网访问生产页面，等待 worker 安装完成、激活并控制该页面，再断网。页面显示“离线探索已准备好”或 `serviceWorker.ready` 已解决，只能说明有可用 worker，不能单独证明新包已经安装。
3. 使用当前课程数据和两种语言的 `public/audio/**/manifest.json` 计算期望资源。检查完整 MP3、概念图、字体、脚本和页面壳；数量不要写成历史常量。
4. 对新装场景，复用 [offline.spec.ts](../../../tests/e2e/offline.spec.ts) 的全量音频／概念图缓存状态和字节数检查。
5. 对“旧页面还在用旧声音”等升级问题，另外确认活动缓存名对应本次构建，并对更新过的录音比较缓存文件 SHA-256 与当前 manifest。声线／profile 元数据用于辅助识别。只比较文件大小或只在全新上下文通过测试，不足以证明旧版本已升级。
6. 升级验证保留已有发现、答题记录和语言选择；新缓存激活后可以淘汰本应用旧缓存，但不能清除其他应用的缓存或 localStorage。

仓库目前没有浏览器旧版本升级的独立用例。需要这种证据时，在独立旧版本上下文补充检查，或使用允许操作的已有旧页面；不要虚构 `upgrade.spec.ts`。拿不到旧版本或旧上下文时，明确升级流程尚未验证。

## 断网与真实音频

使用 [offline.spec.ts](../../../tests/e2e/offline.spec.ts) 已有流程：在线缓存 → 断网刷新 → 英文播放 → 中文切换并刷新、播放 → 恢复联网。检查脚本、样式、字体和图片正常加载，没有新的页面错误或离线资源失败。

音频必须经过原生 `Audio` 解码，观察 `loadedmetadata`、有效时长和 `playing`；只检查 HTTP 200、播放器函数调用或模拟播放器不算成功。确认响起的请求属于当前语言的本地 MP3，不能把设备语音兜底当作已验证离线录音。怀疑截断或长句超时时，再检查相应录音的 `ended` 和实测时长。

自动化验证播放事件不等于人工试听。听感、发音和句子完整性只在实际听过后描述；声音换版不以“文件存在”推断听感合格。

## Safari／WebKit 的 Range 响应

参考 [learning.spec.ts](../../../tests/e2e/learning.spec.ts) 的真实音频请求，以及 [service-worker.test.ts](../../../tests/service-worker.test.ts) 的字节范围检查。

- WebKit 可能先请求 MP3 头两个字节；正确的 `206 Partial Content` 是预期行为，不要求每次请求都返回整个文件。
- 校验 `Content-Range` 的起止位置、完整长度、响应体实际字节与本地文件切片一致；同时检查 `Content-Length`。
- 离线覆盖普通范围、后缀范围和越界范围；越界应返回 `416`，不能用一个空的成功响应掩盖问题。
- 缓存中保存完整 `200` 文件，按请求切出 `206`。网络部分响应不能覆盖完整缓存；带查询参数的已知素材仍应找到正确的完整文件。

## 手机、平板与进度

复用 [language.spec.ts](../../../tests/e2e/language.spec.ts) 的窄屏触摸切换、[expansion.spec.ts](../../../tests/e2e/expansion.spec.ts) 的数字卡布局和 [learning.spec.ts](../../../tests/e2e/learning.spec.ts) 的手机学习流程。

按改动检查手机竖屏、平板尺寸、横向溢出、图卡加载、触屏导航和弹窗关闭。双语切换与刷新应保留发现和设置，不能通过重置进度让测试通过。需要覆盖浏览器禁止写入 localStorage 时，复用已有异常存储用例。

浏览器视口、触摸模拟和 WebKit 引擎结果只支持对应的模拟结论。实体 iPad／手机验收需另记设备、系统、浏览器及实际操作；“可以添加到主屏幕”“应用商店已上架”也不能由这些测试推断。

## 结果与停止条件

在任务需要验收留档时更新 [docs/verification.md](../../../docs/verification.md)，写明本次版本／构建、执行命令、浏览器、通过或失败数量及真实设备范围，不复制旧报告的结果当作新证据。

失败时先保留 trace、截图和响应信息，区分应用问题、旧构建／错误服务、缺少浏览器和环境限制。只重试能由具体修复解决的失败；不能为了得到绿灯而移除断网、音频或进度断言。

无法运行浏览器、自动控制被禁用或真机不在场时，完成仍可执行的静态／单元／构建检查，并明确哪些检查未做。实际未运行的步骤不得写成通过，也不为绕过限制开启其他自动控制路径。
