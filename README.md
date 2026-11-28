# 随说 SayFlow

面向澳洲 WHV 的英语练习网页：覆盖餐饮、农场工厂、物流配送、交通旅游、租房银行、办公室、收银、Sales 和日常沟通，并提供澳洲生活词库、口语重说、追问应对和间隔复习。

## 在线使用

电脑或手机可直接访问：

```text
https://jiopiii.github.io/sayflow-english/
```

带跨设备同步的 Cloudflare 版本：

```text
https://sayflow-english.sayflow-english.workers.dev/
```

Cloudflare 版使用 Worker + D1，学习数据同步到云端；API Key 和语音设置仍只保存在各设备。首次进入需要输入个人访问密码，登录状态保留 30 天。

手机可把该地址添加到主屏幕。GitHub Pages 版的表达卡、自定义词和复习记录只保存在当前设备；Cloudflare 版会同步这些学习数据，但 API Key、模型配置和语音设置仍留在各自设备。

## 当前版本

- 内容版本 `1.5.3`：过滤 `received / left / leave / ready` 等基础词和变形，并优先保留 `sort out / take over / hold on / get back to` 等口语动词短语。
- GitHub Pages 版本为纯静态网页；Cloudflare 版本使用 Worker、D1 和单一访问密码。
- 顶部提供快捷查词，支持按钮或 `Cmd/Ctrl + K` 打开；优先查询本地词库和自定义词，不调用 API。
- 本地查不到时可手动触发 AI 查询，结果会缓存在当前浏览器；AI 查询才会使用已配置的接口。
- 首页提供“咖啡厅 / 餐馆、农场 / 工厂、求职 / 工作、租房 / 生活、配送 / 跑腿、交通 / 租车、旅游 / 住宿、购物 / 办事、办公室工作、收银员、Sales / 店员、职场沟通”十二类任务，每行展示 3 个。
- 内置 56 个澳洲 WHV 高频任务，包括点单、small talk、配送、租车、公交、酒店、购物、农场、工厂、面试、工资单、租房、TFN、办公室、收银、退换货和 Sales。
- 每次刷新浏览器都会避开上一轮出现的基础任务，自动换一组默认任务，不调用 AI。
- 点击“换一组任务”时，会从当前场景的精简子情景池随机抽 3 个不同方向，再在原有单次 AI 请求里生成开口开启、应对追问、异议/确认三类任务；不额外调用 API。
- 任务描述、对方开场和追问保持 1-2 句；生成地道表达后，结果区按“对方先开口 → 你先这样回 → 对方接着问 → 没听清怎么说”展示对话演练。
- 结果区增加英语口语重说、卡点记录和任务完成记录；麦克风在练习区使用英语识别。
- 语音朗读和英语识别默认使用美音 `en-US`，可在设置中切换英音。
- 设置中可以选择浏览器或系统提供的美音语音、调整 0.82～1.00 倍语速，并直接试听。
- 整句朗读会拆成不超过约 120 字符的短段，段间留出停顿；播放时保留 utterance 引用并定时恢复，减少 Chrome 句尾被截断和长时间朗读卡住。
- 收藏的表达会进入 1、3、7、14、30 天的间隔复习队列，待复习数量会显示在首页和表达库；表达库卡片可直接朗读英文表达。
- 默认使用“不使用 API”方式：点击生成后打开设置，在设置里复制提示词、粘贴 ChatGPT / Claude 返回的 JSON。
- 也可以接入任意 OpenAI 兼容接口，实现一键生成。
- 表达卡、任务完成记录和复习状态都保存在当前浏览器的 `localStorage` 中。
- 支持文字输入、浏览器语音识别、朗读、表达库搜索和 JSON 导出。
- 润色句子优先使用常用词、短句和容易朗读的结构，不为了显得高级而故意使用复杂表达。
- CEFR 只作为难度标记，不再作为入选门槛；优先保留用户在国外马上能重复使用的完整语块、礼貌表达和救场表达。
- 结果区单独展示“能直接使用的语块”，覆盖整句表达、动词搭配、礼貌请求、确认信息、澄清和救场表达。
- 顶部新增“澳洲生活词库”，包含 594 个词条，11 个主题，每个主题至少 50 个词条。
- 词库支持中英文搜索、分类浏览、随机 10 个、分批显示、朗读、复制，以及按当前词包生成 3 个练习任务；每个英文例句也可以单独朗读。
- 可以自行新增英文、中文、分类和例句；自定义词条保存在 `sayflow.customLexicon.v1`，支持搜索、自动补词和两步确认删除。
- 本地高频词库会同时扫描用户原句和 AI 英文结果，自动补回 AI 漏掉的表达；已验证 `short-staffed`、`flat out`、`frustration`、`top up` 可以在 AI 不返回词卡时仍然补出。
- 生成结果限制为 1 个最自然地道版本、3 个语块、4-6 个高质量重点单词和最多 2 个重点词组；整句没有足够达标词时允许少于 4 个，不硬凑。主请求预留 2800 tokens，新任务生成使用独立小请求并预留 1400 tokens。
- 使用 DeepSeek 接口时，请求会显式关闭 thinking 模式并使用 JSON Output，避免等待推理过程和正文为空；其他 OpenAI 兼容接口保持标准请求格式。
- AI 提示词优先使用澳洲职场常见说法，如 takeaway、roster、smoko、TFN、super、bond、payslip、timesheet、PPE 和 induction。
- 涉及签证工时、税务或劳动法时，页面只练语言表达；具体规则应以澳洲内政部和 Fair Work 官方信息为准。
- 重点词采用质量优先：先过滤 `order / customer / product / item / job / manager / received / left / leave / ready` 等基础词及常见词形变化，再保留 4-6 个高价值单词；`sort out / take over / hold on / get back to / figure out / be deep in` 等口语动词短语可进入重点词组，最多 2 个。模型结果优先，本地词库只在空位中补充。
- 结果区将“重点单词”和“重点词组”分开，词组会列出常见变形、常见搭配、相关表达、反义表达或适用句型。
- 单词卡先展示音标和当前语境含义，再列出当代常见英语中的其他常用义项；每个义项标出词性、中文释义及对应例句。生僻、古旧和不匹配的释义不强行补充。
- 重点单词词性使用 `n. / v. / adj. / adv.` 等缩写；除拆词、词根和语义联想外，再提供一条简短的中文谐音联想，没有自然关联时不硬凑。
- 单词卡还展示名词/动词/形容词/副词/反义词/词根/派生词等真实词族关系，不展示第三人称单数、过去式、现在分词等语法屈折形式。
- 每个重点词必须附带一条贴近英文读音的中文谐音“邪修”记忆，同时保留拆词、词根或语义联想，两套记忆线索不互相替代。
- 没有达到标准的单词时返回空重点列表，不为了凑数量加入基础内容。
- 输入框会随机写入咖啡店、农场、工厂、求职、租房和同事沟通话题；点击“换一句”会直接替换当前文本框内容。

## 本地打开

直接双击 `index.html` 可以先看页面和示例。语音识别在不同浏览器中可能要求 HTTPS 或 localhost，因此更推荐启动本地静态服务器：

```bash
cd "/Users/mjy/Documents/工作项目需要/AI搓原型/个人需求/随说英语"
python3 -m http.server 8787
```

然后访问：

```text
http://localhost:8787
```

## Cloudflare 免费部署

Cloudflare Worker 托管网页与 `/api/sync`，D1 保存表达卡、活动记录和自定义词。普通 UI、同步代码和 D1 表结构都在 GitHub 仓库中。

GitHub 自动部署已连接：

- 仓库：`jiopiii/sayflow-english`
- 生产分支：`main`
- 构建命令：`npm run cloudflare:build`
- 部署命令：`npx wrangler deploy`

推送到 `main` 后会同时触发 GitHub Pages 和 Cloudflare Worker 更新。

首次部署：

```bash
cd "/Users/mjy/Documents/工作项目需要/AI搓原型/个人需求/随说英语"
npm install
npx wrangler d1 migrations apply sayflow-sync --remote
npm run cloudflare:deploy
```

Worker 需要两个加密变量：

- `SAYFLOW_PASSWORD`：网站访问密码；
- `SAYFLOW_SESSION_SECRET`：登录 Cookie 的签名密钥。

更新变量：

```bash
npx wrangler secret put SAYFLOW_PASSWORD
npx wrangler secret put SAYFLOW_SESSION_SECRET
```

同步范围只包括表达卡、活动记录和自定义词，不包含 API Base URL、API Key、模型名称、音色和语速。GitHub Pages 与 Workers 是两个不同站点，首次切换到 Cloudflare 时，应先在原站点设置中“导出完整数据”，再在新站点“导入备份”。

该 Worker 采用自建密码会话，以避免 Cloudflare Access 免费层开通时要求绑定支付方式。页面和同步接口都需要先登录。

## 免费部署到手机

这个项目是纯静态网页，不需要 Node 服务或数据库，可以直接免费部署：

### 最简单：Netlify Drop

1. 浏览器打开 `https://app.netlify.com/drop`；
2. 把整个“随说英语”文件夹拖进去；
3. 部署完成后会得到一个 HTTPS 网址；
4. 在手机浏览器打开该网址，可添加到主屏幕。

### Cloudflare Pages

在 Cloudflare Pages 控制台创建项目并上传当前文件夹，或者使用：

```bash
npx wrangler pages deploy "/Users/mjy/Documents/工作项目需要/AI搓原型/个人需求/随说英语"
```

### GitHub Pages

把 `index.html`、`app.js`、`styles.css`、`manifest.webmanifest`、两个 `lexicon*.js` 和图标文件推到 GitHub 仓库，在仓库 Settings → Pages 中选择从分支根目录部署。

部署后的页面是公开静态文件，不要把 API Key 写进代码。API Key、自定义词、表达卡和复习记录都保存在各自浏览器的 `localStorage`，电脑和手机不会自动同步；手机首次使用时需要单独配置接口或使用“不使用 API”模式。

## 两种使用方式

### 1. 不使用 API

1. 输入你今天真正想说的话。
2. 点击“生成地道表达”，页面会打开设置。
3. 在设置里点击“复制提示词”，粘贴给现有 ChatGPT 或 Claude。
4. 把 AI 返回的 JSON 粘贴回设置里的“AI 返回结果”。
5. 点击“生成学习卡”。

### 2. 可选 AI 接口

点击页面右上角设置，填写：

- API Base URL，例如 `https://api.openai.com/v1`
- API Key
- 模型名称

网页会调用 `<Base URL>/chat/completions`。本地模型可填写 `http://localhost:11434/v1`，并在模型服务允许 CORS 时留空 API Key。

## 数据与隐私

- 所有表达卡和接口配置只保存在当前浏览器。
- 页面没有服务器，不会把数据上传到额外服务。
- 直接使用 API 模式时，请求会从浏览器发送到你填写的接口。
- 不要把这个页面公开分享给他人使用你的 API Key。

## 当前边界

- 当前已经有本地间隔复习和任务完成记录，但还没有账号、云同步和原生 App。
- 词库、自定义词和接口配置按浏览器保存，部署后不会在电脑与手机之间自动同步。
- 浏览器语音识别对中英混合、专有名词和口音的识别并不稳定，转写后可以手动修改。
- 朗读质量取决于当前设备安装的系统语音。系统语音仍不自然时，需要后续接入 OpenAI TTS、ElevenLabs 或本地 TTS，而不是浏览器插件本身。
- 免费替代方案优先使用 Microsoft Edge 自带的在线自然语音；本机 `say`、Piper 等本地 TTS 也可用，但需要额外安装或本地服务。
- 音标、词形和例句由 AI 生成，重要内容仍应核对词典。

## 性能基线

- 本地页面刷新（浏览器缓存命中）：约 150～180 ms。
- 打开快捷查词并搜索常用词：约 0.2～0.4 s。
- 打开 594 条生活词库：约 0.25～0.5 s，首屏只渲染 60 条，之后按 60 条追加。
- AI 生成 3 个新任务和主表达仍取决于所接模型；每次生成完后浏览器控制台会输出 `[SayFlow] 地道表达 …ms`，可直接区分模型请求耗时和页面渲染耗时。
- 主表达不再要求多个版本、全部词义和 4-6 个重点词，DeepSeek 请求继续关闭 thinking 模式，降低输出长度是当前首要提速手段。
