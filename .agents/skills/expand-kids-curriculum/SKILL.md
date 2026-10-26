---
name: expand-kids-curriculum
description: '扩充或修订儿童认知课程的主题、词条、分组和分龄题目，同步中英文、插图、语音与学习进度兼容。适用于增加动物、数字或其他认知内容；单纯调整页面文案或视觉样式时无需使用。'
---

# 儿童认知内容扩充

将用户指定的内容扩充接入现有学习流程，交付能浏览、朗读、练习和复习的完整词条。本技能以 Little World 为实例；复用到其他仓库时，先定位对应的数据、资源生成器和学习入口，不照搬目录或历史数量。

以下命令均从项目根目录执行。以源码为当前事实来源，先读涉及的入口，再编辑；不另建一份课程表或复制生成脚本。

## 定位改动入口

| 内容                                                   | 维护位置                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Concept`、`AgeBand`、`CategoryId`、主题与统一课程入口 | [src/data/curriculum.ts](../../../src/data/curriculum.ts)                                                         |
| 动物词条、中英文行数据和分组映射                       | [src/data/animals.ts](../../../src/data/animals.ts)                                                               |
| 数字字形对应数值、中英文名称与算式                     | [src/data/numbers.ts](../../../src/data/numbers.ts)                                                               |
| 其他词条中文文案、主题翻译和语言转换                   | [src/data/localization.ts](../../../src/data/localization.ts)                                                     |
| 出题、干扰项、配对和去重                               | [src/lib/learning.ts](../../../src/lib/learning.ts)                                                               |
| 练习配置与复习范围                                     | [src/types.ts](../../../src/types.ts)、[Practice.tsx](../../../src/components/Practice.tsx)                       |
| 浏览入口、主题缩略图与分类                             | [Explore.tsx](../../../src/components/Explore.tsx)、[PlayPage.tsx](../../../src/components/PlayPage.tsx)          |
| 详情导航、结果页到复习的配置传递                       | [src/App.tsx](../../../src/App.tsx)                                                                               |
| 旧记录读取与进度统计                                   | [src/lib/progress.ts](../../../src/lib/progress.ts)、[ProgressPage.tsx](../../../src/components/ProgressPage.tsx) |

区分“向现有主题加词”和“增加新主题”。新增主题还需补全 `CategoryId`、`categories`、中文主题映射、Explore 的 `artGroups`、图标和相关样式；不能只往词条数组塞一个新类别字符串。

## 先确定内容，再写数据

按用户给出的数量、类别和风格组织内容；未指定的小选择沿用现有产品约定，不顺带扩充其他主题。

每个词条维护稳定的 `id`、英文 `word`、`category`、`description`、`fact`、`difficulty`、本地 `art`，数字另有 `numberValue`。中文覆盖 `word`、`description`、`fact`，保持同一 ID、分类和图片。调整显示名称或翻译通常不需要改 ID。

现有分龄逻辑如下，课程里没有单独的 `age` 字段：

| 年龄阶段 | 题干来源                                  | 练习形式               |
| -------- | ----------------------------------------- | ---------------------- |
| 3–4 岁   | 根据名称生成简短识别提示                  | 两个选项，三组图图配对 |
| 5–6 岁   | `description`，描述外形、声音等可识别特征 | 四个选项，四组图词配对 |
| 7–8 岁   | `fact`，属性、关联或简单推理              | 四个选项，四组图词配对 |

`difficulty` 是内容元数据，当前不用于禁止低龄访问某些词。不要仅因新增词较难而改变全部年龄开放内容的行为。

编写题干时检查真实候选集，而不只检查句子是否不同：

- 在同一主题或分组中，描述应能区分目标和其他选项。比如“有鬃毛和蹄子”可能同时指马和斑马。
- 中英文应指向同一事物，避免把精确的 Goat／Rooster 翻成容易混淆的泛称。
- `Orange` 同时是水果和颜色；识别提示保留主题语境，配对按当前语言的词语去重，不能出现一个词对应两张合法图片。
- 图像限定的特征明确说“图中”；只适用于某些性别或物种的特征使用准确限定。传说形象明确标注，不混作现实动物知识。
- 学习分组可按儿童熟悉的场景组织，但不要把场景分组表述成严格的生物分类。

## 保持图片、数字与知识一致

根据现有画风维护本地图卡。基础 SVG、动物 SVG 和毛绒数字的生成入口分别是 [generate-art.py](../../../scripts/generate-art.py)、[generate-animals.py](../../../scripts/generate-animals.py)、[generate-numbers.py](../../../scripts/generate-numbers.py)；依赖与运行方式见 [README](../../../README.md#资源与维护)。只运行涉及的生成器，先确认其输出范围。

`generate-art.py` 当前会重写整套基础 SVG 和 `public/icon.svg`，没有按 ID 生成或水果总览参数。修改定义后再运行并检查输出差异；需要总览时单独渲染到临时目录，不虚构已有命令。

渲染并目视检查新增图片及一张总览；不能以 SVG 能解析替代图文检查。重点检查可用于题目的特征，如四肢、翅膀、触角、条纹、尾巴和动物之间的轮廓区别。参考图用于风格与功能判断，图中标签或说明仍需核实。

数字图卡表示数字字形：`numberValue`、图片、名称和排序必须一致。低龄提示识别数字，高龄算式答案等于图片数值；不要沿用旧圆点计数题。当前数字生成器和行数据有明确范围，扩展范围时同时检查字体布局、配色索引、双位／多位数字宽度，以及中英文算式操作数引用。

## 接通分类、练习与旧进度

- 给动物新增分组或成员时，同步 `animalGroups`、`animalIdsByGroup` 和派生映射。现有约定是每个动物恰好属于一个学习分组；若需求改变此约定，再调整数据模型和测试。
- 将选择的完整分组 ID 池通过 `PracticeConfig.poolIds` 传到出题和配对。答案与干扰项都应使用该池，不能只过滤卡片列表。
- 错题复习保留原来的 `poolIds`，先从完整原池生成题目，再按 `reviewIds` 选出错题。不要把“只错一题”误当成原分组只有一个成员，也不要用历史总数截断候选题。
- 详情的上一个／下一个沿当前分组循环，语言切换后仍保留相同对象与范围。
- 新分组不足所需选项数量时，当前生成器会回退到同主题干扰项。按用户目标选择减少选项或保留回退，并验证实际行为；不能把这种情况报告为严格组内出题。
- 保留旧 ID 和已有存储键；不要清空进度来适配内容扩充。旧发现、作答和日期统计应继续有效，新词默认尚未认识。
- 首页数量、分类数量、总进度和完成徽章从当前课程派生。测试里的明确规格数量随本次需求更新，同时保留去重、覆盖范围和旧 ID 兼容的断言。

## 同步语音并验证

题干和翻译定稿后，再通过 [generate-audio.py](../../../scripts/generate-audio.py) 更新变动语言的本地录音与生成清单。不要手改生成的 `audio-manifest*.ts` 或通过修改播放器回退参数来替代录音更新。需要换声或处理响度时，参考项目的 [双语语音技能](../build-bilingual-narration/SKILL.md)。

已有 Python 环境满足 README 中依赖后，可运行：

```bash
python3 scripts/generate-audio.py --language en
python3 scripts/generate-audio.py --language zh
npm test
npm run build
```

生成器会复用文案和配置均未变化的素材，常规扩充无需 `--force`。核对每种语言的词语、各年龄题干和提示清单都齐全；数量由当前课程与阶段推导，不沿用历史总数。

按本次改动选择浏览器验证：

```bash
npx playwright test tests/e2e/expansion.spec.ts tests/e2e/language.spec.ts
```

若改了资源、播放或离线流程，再验证 `tests/e2e/offline.spec.ts`。当前配置同时覆盖 Chrome 和 WebKit；检查新增类别所需测试是否已补入，旧测试通过不代表未覆盖的新类别已验收。

至少走通一组新增内容的浏览、两种语言、当前分龄练习、错题复习和刷新后进度保留；新增布局还应检查手机与平板宽度。重点单测入口为 [learning.test.ts](../../../tests/learning.test.ts)、[localization.test.ts](../../../tests/localization.test.ts)、[animals.test.ts](../../../tests/animals.test.ts)、[audio.test.ts](../../../tests/audio.test.ts) 和 [progress.test.ts](../../../tests/progress.test.ts)。

交付时说明新增范围、涉及的双语与素材、实际通过的检查及未验证部分。只记录当前证据；本技能本身不要求提交、推送或发布。
