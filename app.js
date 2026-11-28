(() => {
  "use strict";

  const PACK_SOURCE = window.SAYFLOW_PACK || null;
  const PACK_SCHEMA_VERSION = 4;
  const LEGACY_PACK_ID = "en-AU-whv";
  const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const PACK = PACK_SOURCE || {
    id: "en-AU-whv",
    label: "澳洲 WHV",
    targetLanguage: "English",
    sourceLanguage: "zh-CN",
    locale: "en-AU",
    speechLanguage: "en-US",
    schemaVersion: PACK_SCHEMA_VERSION,
    contentVersion: "1.4.0",
    expected: { scenes: 12, tasks: 56, lexiconCategories: 11, lexiconMinPerCategory: 50 }
  };

  const STORAGE_KEYS = {
    settings: "sayflow.settings.v1",
    entries: "sayflow.entries.v1",
    activities: "sayflow.activities.v1",
    customLexicon: "sayflow.customLexicon.v1",
    lookupCache: "sayflow.lookupCache.v1",
    syncQueue: "sayflow.syncQueue.v1",
    syncMeta: "sayflow.syncMeta.v1"
  };
  const SYNC_COLLECTIONS = ["entries", "activities", "customLexicon"];

  const LEXICON_META = window.SAYFLOW_LEXICON_META || {};
  const BUILTIN_LEXICON = [
    ...(Array.isArray(window.SAYFLOW_LEXICON) ? window.SAYFLOW_LEXICON : []),
    ...(Array.isArray(window.SAYFLOW_LEXICON_EXTRA) ? window.SAYFLOW_LEXICON_EXTRA : [])
  ].map(withLexiconMetadata);
  let customLexicon = loadJson(STORAGE_KEYS.customLexicon, []);
  let LEXICON = [...BUILTIN_LEXICON, ...customLexicon];
  const LEXICON_CATEGORY_LABELS = {
    cafe: "咖啡饮品",
    restaurant: "餐厅菜单",
    shopping: "购物超市",
    transport: "交通出行",
    housing: "租房住宿",
    banking: "银行支付",
    work: "工作职场",
    office: "办公室",
    retail: "收银零售",
    places: "城市地名",
    daily: "生活口语"
  };
  const LEXICON_SCENE_MAP = {
    cafe: "hospitality",
    restaurant: "hospitality",
    shopping: "shopping",
    transport: "transport",
    housing: "life",
    banking: "life",
    work: "farm",
    office: "office",
    retail: "retail",
    places: "life",
    daily: "life"
  };

  const DEFAULT_SETTINGS = {
    endpoint: "",
    apiKey: "",
    model: "",
    accent: PACK.speechLanguage === "en-GB" ? "uk" : "us",
    accentVersion: 3,
    voiceURI: "",
    speechRate: "0.95"
  };

  const TYPE_LABELS = {
    phrase: "重点词组",
    word: "重点单词",
    collocation: "常用搭配",
    grammar: "句式",
    pattern: "表达模式",
    idiom: "习惯表达"
  };

  const POS_ABBREVIATIONS = {
    n: "n.",
    noun: "n.",
    nouns: "n.",
    名词: "n.",
    v: "v.",
    verb: "v.",
    verbs: "v.",
    动词: "v.",
    adj: "adj.",
    adjective: "adj.",
    adjectives: "adj.",
    形容词: "adj.",
    adv: "adv.",
    adverb: "adv.",
    adverbs: "adv.",
    副词: "adv.",
    prep: "prep.",
    preposition: "prep.",
    介词: "prep.",
    conj: "conj.",
    conjunction: "conj.",
    连词: "conj.",
    pron: "pron.",
    pronoun: "pron.",
    代词: "pron.",
    interj: "interj.",
    interjection: "interj.",
    感叹词: "interj.",
    叹词: "interj.",
    num: "num.",
    numeral: "num.",
    数词: "num.",
    art: "art.",
    article: "art.",
    冠词: "art.",
    aux: "aux.",
    auxiliary: "aux.",
    助动词: "aux.",
    modal: "modal v.",
    情态动词: "modal v.",
    phr: "phr.",
    phrase: "phr.",
    词组: "phr.",
    短语: "phr.",
    动词短语: "phr. v.",
    名词短语: "phr. n.",
    形容词短语: "phr. adj."
  };

  const STYLE_LABELS = {
    natural: "自然口语",
    work: "工作表达",
    concise: "简洁表达",
    formal: "正式表达",
    polite: "礼貌表达"
  };

  const TONE_LABELS = {
    natural: "自然口语",
    work: "工作沟通",
    concise: "简洁直接"
  };

  const MEMORY_METHOD_LABELS = {
    split: "拆词记",
    sound: "谐音记",
    pun: "玩梗记",
    association: "联想记"
  };

  const SCENE_LABELS = {
    hospitality: "咖啡厅 / 餐馆",
    farm: "农场 / 工厂",
    job: "求职 / 工作",
    life: "租房 / 生活",
    delivery: "配送 / 跑腿",
    transport: "交通 / 租车",
    travel: "旅游 / 住宿",
    shopping: "购物 / 办事",
    office: "办公室工作",
    cashier: "收银员",
    retail: "Sales / 店员",
    social: "职场沟通",
    work: "工作沟通"
  };

  const SCENE_ORDER = ["hospitality", "farm", "job", "life", "delivery", "transport", "travel", "shopping", "office", "cashier", "retail", "social"];
  const SCENE_GENERATION_BRIEF = {
    hospitality: "咖啡厅和餐厅服务：点单、顾客沟通、过敏原、订单错误、试工、繁忙时段",
    farm: "农场和工厂：采摘包装、入职、工时、工资、设备、安全、主管沟通",
    job: "WHV 求职入职：找工电话、面试、casual 排班、工资单、请假、换班",
    life: "租房和生活：看房、share house、bond、TFN、银行、GP、账单、维修",
    delivery: "配送跑腿：取餐、门禁、联系客人、放餐位置、地址错误、平台客服",
    transport: "交通和租车：公交、交通卡、租车、保险、停车、还车、坐过站",
    travel: "旅游住宿：酒店、背包客栈、一日游、游客中心、行李、失物招领",
    shopping: "购物办事：超市、退货、尺码、手机套餐、药店、自助结账",
    office: "办公室工作：早会、任务确认、进度同步、延期、请假、交接和同事沟通",
    cashier: "收银员：现金刷卡、EFTPOS、找零、小票、分单、价格核验和退款审批",
    retail: "Sales 店员：接待、推荐、尺码库存、试衣间、换货、收据和追加销售",
    social: "职场沟通：small talk、没听清、请假、换班、分歧、澄清"
  };

  const GAP_LABELS = {
    words: "词不够",
    listening: "听不懂",
    grammar: "语法卡住",
    confidence: "不敢开口"
  };

  const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
  const TASK_CONTEXTS = [
    { id: "busy", label: "快节奏", lead: "现场比较忙，对方说话也很快。" },
    { id: "first-time", label: "第一次处理", lead: "这是你第一次独立处理这个场景。" },
    { id: "misunderstood", label: "没被听懂", lead: "你刚说了一遍，但对方没有完全理解。" },
    { id: "changed", label: "临时变化", lead: "原计划临时发生变化，你需要重新确认。" },
    { id: "phone", label: "电话沟通", lead: "你需要在电话里说明情况，看不到对方表情。" },
    { id: "confirm", label: "确认细节", lead: "对方要求你确认时间、数量或具体安排。" },
    { id: "noisy", label: "嘈杂环境", lead: "周围很吵，你需要请对方重复关键信息。" },
    { id: "urgent", label: "时间紧迫", lead: "时间很紧，你需要在短时间内说清重点。" },
    { id: "upset", label: "对方不满", lead: "对方已经有些不耐烦，你需要先安抚再解释。" },
    { id: "rule", label: "涉及规则", lead: "对方提到一项你不太熟悉的规则，你需要确认具体要求。" },
    { id: "handover", label: "同事接手", lead: "这件事需要转交给另一位同事，你必须交代清楚。" },
    { id: "closing", label: "临近下班", lead: "临近下班，对方希望尽快确认下一步。" }
  ];
  const NOVELTY_VOICES = new Set([
    "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
    "Good News", "Jester", "Organ", "Superstar", "Trinoids", "Whisper", "Wobble", "Zarvox"
  ]);
  const PREFERRED_VOICES = {
    "en-US": ["Samantha", "Ava", "Allison", "Susan", "Tom", "Zoe", "Nicky", "Alex", "Google US English", "Microsoft Aria Online (Natural)", "Microsoft Jenny Online (Natural)", "Microsoft Guy Online (Natural)"],
    "en-GB": ["Serena", "Daniel", "Kate", "Google UK English Female", "Microsoft Libby Online (Natural)"]
  };

  const TASKS = [
    {
      id: "hospitality-order",
      scene: "hospitality",
      title: "咖啡店点单及确认忌口",
      prompt: "我想点一杯外带的 flat white，并确认这款食物里有没有坚果。我对坚果过敏。",
      followUp: "No worries. Just to confirm, are you allergic to all nuts or only peanuts?",
      followUpZh: "店员可能会确认你是对所有坚果过敏，还是只对花生过敏。",
      repair: "Sorry, could you explain which ingredients it contains?"
    },
    {
      id: "hospitality-trial",
      scene: "hospitality",
      title: "确认咖啡店试工安排",
      prompt: "咖啡店约我试工，我想确认时间、着装、需要带什么证件，以及试工是否有工资。",
      followUp: "Can you start at seven on Saturday? Wear a black shirt and bring your ID.",
      followUpZh: "对方可能会确认周六七点开始、着装要求及随身证件。",
      repair: "Could you repeat the start time and what I need to bring?"
    },
    {
      id: "hospitality-complaint",
      scene: "hospitality",
      title: "处理客人上错菜",
      prompt: "客人说上的菜不是他点的。我想先道歉、核对订单，并说明会马上更换。",
      followUp: "I ordered the chicken salad, not the Caesar salad. How long will the correct one take?",
      followUpZh: "客人可能会说明正确菜品，并追问更换需要多久。",
      repair: "My apologies. Let me check your order and fix that for you."
    },
    {
      id: "hospitality-allergy",
      scene: "hospitality",
      title: "餐厅确认过敏原",
      prompt: "客人问这道菜能不能做成无麸质，并说对乳制品过敏。我想确认成分，不擅自保证。",
      followUp: "Can you check whether the sauce contains dairy or gluten before I order?",
      followUpZh: "客人可能会要求你先确认酱汁是否含乳制品或麸质。",
      repair: "I'll check with the kitchen before I confirm that for you."
    },
    {
      id: "hospitality-take-order",
      scene: "hospitality",
      title: "给客人桌边点单",
      prompt: "客人准备点单，我想确认饮品、主菜、是否有忌口，以及食物是一起上还是稍后上。",
      followUp: "Could I get the burger without onions, and can the fries come later?",
      followUpZh: "客人可能会要求不加洋葱，并把薯条稍后再上。",
      repair: "Let me repeat your order to make sure I have it right."
    },
    {
      id: "hospitality-guest-smalltalk",
      scene: "hospitality",
      title: "和咖啡店熟客 small talk",
      prompt: "客人说今天很热，我想自然接一句，问他要不要加冰，再简单聊一句天气，不影响点单。",
      followUp: "It's meant to be even hotter tomorrow. Are you working all week?",
      followUpZh: "客人可能会继续聊天气，并问你这一周是否都上班。",
      repair: "Sorry, I didn't catch the last part. Are you asking about my shifts?"
    },
    {
      id: "farm-induction",
      scene: "farm",
      title: "农场入职安全说明",
      prompt: "我想确认农场入职当天几点开始、在哪里集合、需要穿什么，以及会提供哪些 PPE。",
      followUp: "We start at six at the packing shed. Bring boots and a hat; we'll supply gloves.",
      followUpZh: "对方可能会说明集合地点、开始时间、自备物品和现场提供的防护用品。",
      repair: "Could you say where the packing shed is?"
    },
    {
      id: "farm-timesheet",
      scene: "farm",
      title: "确认农场工时和工资",
      prompt: "我想确认这周工时怎么记录、什么时候发工资、有没有工资单，以及这份工作是时薪还是计件。",
      followUp: "You'll fill in a timesheet each day. Your payslip comes every Thursday.",
      followUpZh: "对方可能会说明工时表、发薪频率和工资单。",
      repair: "Sorry, could you explain how the timesheet works?"
    },
    {
      id: "factory-task",
      scene: "farm",
      title: "工厂班前确认任务",
      prompt: "主管让我负责今天的包装线。我想确认生产目标、检查标准、出现问题时该找谁。",
      followUp: "Your target is two hundred boxes. If the label printer jams, call the line supervisor.",
      followUpZh: "主管可能会说明目标数量，以及设备故障时联系谁。",
      repair: "Let me repeat that back to make sure I understand."
    },
    {
      id: "factory-safety",
      scene: "farm",
      title: "工厂发现安全隐患",
      prompt: "我发现机器旁边地面有水，容易滑倒。我想提醒主管，并问在清理前是否需要暂停这条线。",
      followUp: "Thanks for flagging that. Can you put up a wet-floor sign while I call maintenance?",
      followUpZh: "主管可能会让你放置防滑提示牌，并联系维修。",
      repair: "I don't want anyone to slip. Should we stop the line for now?"
    },
    {
      id: "job-intro",
      scene: "job",
      title: "服务业试工面试介绍",
      prompt: "我去咖啡店面试，想简短介绍自己的服务经验、可上班时间和学习能力。",
      followUp: "Have you used an espresso machine before? And how many days can you work each week?",
      followUpZh: "面试官可能会问咖啡机经验，以及每周可工作的天数。",
      repair: "I haven't used that model before, but I learn quickly."
    },
    {
      id: "job-availability",
      scene: "job",
      title: "说明可上班时间",
      prompt: "我想接受这份 casual 工作，同时说明哪些天能上班、能否做早班或周末班。",
      followUp: "We mainly need someone for Saturday mornings and the occasional split shift.",
      followUpZh: "对方可能会说明主要需要周末早班，偶尔有 split shift。",
      repair: "Could you explain what a split shift means here?"
    },
    {
      id: "job-call",
      scene: "job",
      title: "电话跟进求职申请",
      prompt: "我前几天投了餐厅服务员岗位，想打电话确认他们有没有收到申请，以及什么时候会安排面试。",
      followUp: "Which position did you apply for, and what name did you use on the application?",
      followUpZh: "对方可能会确认你申请的岗位及申请时使用的姓名。",
      repair: "Sorry, I may have used a different spelling. Let me clarify."
    },
    {
      id: "job-payslip",
      scene: "job",
      title: "核对工资单和工时",
      prompt: "我觉得这次工资少了几个小时。我想礼貌询问工资单上的工时怎么计算，并请对方核对。",
      followUp: "Which shifts do you think are missing, and do you have your own record of the hours?",
      followUpZh: "对方可能会问你认为哪几个班次漏记，以及你有没有自己的工时记录。",
      repair: "Can we go through the hours on the payslip together?"
    },
    {
      id: "life-inspection",
      scene: "life",
      title: "预约看房并询问费用",
      prompt: "我想预约看一间出租房，并确认周租、bond、是否包含水电网络，以及最短租期。",
      followUp: "The rent is three hundred a week. The bond is four weeks, and bills aren't included.",
      followUpZh: "房东可能会说明周租、四周押金及账单是否包含。",
      repair: "Could you confirm how much the bond is?"
    },
    {
      id: "life-sharehouse",
      scene: "life",
      title: "询问 share house 入住条件",
      prompt: "我想住进一个 share house，想确认房间是否带家具、公共区域怎么打扫、能不能做饭，以及入住前要付什么。",
      followUp: "The room is furnished, and everyone takes turns cleaning. Is a four-week bond okay?",
      followUpZh: "对方可能会说明家具、轮值打扫和四周押金。",
      repair: "Could you tell me how the cleaning roster works?"
    },
    {
      id: "life-tfn-bank",
      scene: "life",
      title: "办理 TFN 和银行账户",
      prompt: "我想开一个澳洲银行账户，也正在申请 TFN。我想确认需要哪些身份和地址材料，以及账户能不能用于工资入账。",
      followUp: "Do you already have your TFN, and can you provide an Australian address?",
      followUpZh: "银行可能会询问 TFN 状态和澳洲地址证明。",
      repair: "I'm still waiting for my TFN. What can I use in the meantime?"
    },
    {
      id: "life-doctor",
      scene: "life",
      title: "预约全科医生",
      prompt: "我喉咙痛、发烧两天了。我想预约今天看 GP，并问是否需要提前登记、费用大概多少。",
      followUp: "Are you a new patient here, and do you have Medicare or overseas visitor cover?",
      followUpZh: "诊所可能会问是否新病人，以及是否有 Medicare 或海外访客保险。",
      repair: "I'm not sure which cover applies. Could you explain what I need to bring?"
    },
    {
      id: "delivery-pickup",
      scene: "delivery",
      title: "到餐厅取外卖订单",
      prompt: "我到餐厅取配送订单，想确认订单号码、客人姓名、餐品数量，以及还需要等多久。",
      followUp: "What's the order number? It should be ready in about five minutes.",
      followUpZh: "店员可能会先问订单号，并说明还需要等多久。",
      repair: "Sorry, I didn't catch the order number. Could you repeat it?"
    },
    {
      id: "delivery-apartment",
      scene: "delivery",
      title: "送餐到公寓门口",
      prompt: "我到了公寓，但找不到门禁密码和具体单元号。我想联系客人确认入口，并问能不能放在门口。",
      followUp: "Use the intercom and press 204. Please leave it at the door if I don't answer.",
      followUpZh: "客人可能会告诉你门禁方式，并同意无人应答时放门口。",
      repair: "Could you confirm the unit number and where to leave it?"
    },
    {
      id: "delivery-unavailable",
      scene: "delivery",
      title: "客人没有接电话",
      prompt: "我到送餐地址了，但客人没有接电话。我想发消息说明已经到达，并询问是否可以放在安全位置。",
      followUp: "Sorry, I'm stuck at work. Can you leave it near the side gate?",
      followUpZh: "客人可能会说明暂时回不来，并要求放到侧门附近。",
      repair: "Just to confirm, you want me to leave it near the side gate?"
    },
    {
      id: "delivery-support",
      scene: "delivery",
      title: "联系平台处理地址错误",
      prompt: "配送地址的定位和实际门牌不一致。我想联系平台客服说明情况，并确认是否会补偿额外路程。",
      followUp: "Can you send us a screenshot of the map and tell us how far you've travelled?",
      followUpZh: "客服可能会要求地图截图，并询问你多走了多远。",
      repair: "Could you confirm where you want me to send the screenshot?"
    },
    {
      id: "transport-rental",
      scene: "transport",
      title: "租车确认保险和还车规则",
      prompt: "我想租三天车，想确认我的驾照能不能用、保险包括什么、还车时要加满油吗，以及异地还车费用。",
      followUp: "Do you have a full licence and a credit card for the bond? The excess is eight hundred dollars.",
      followUpZh: "租车公司可能会问正式驾照和信用卡押金，并说明保险自付额。",
      repair: "Could you explain what the excess covers?"
    },
    {
      id: "transport-route",
      scene: "transport",
      title: "问公共交通路线和票卡",
      prompt: "我想坐火车和公交去一个地方，想确认需要什么交通卡、在哪里充值、要换乘几次，以及大概多久。",
      followUp: "Get an Opal card at the station, tap on at the gate, and change at Central.",
      followUpZh: "对方可能会说明交通卡购买地点、刷卡方式和换乘站。",
      repair: "Let me repeat that: I tap on at the gate and change at Central?"
    },
    {
      id: "transport-missed-stop",
      scene: "transport",
      title: "公交坐过站或确认下车地点",
      prompt: "我不确定公交到了哪一站，担心坐过站。我想问下一站是什么，以及在哪里下车离目的地最近。",
      followUp: "The next stop is King Street. You can get off there and walk about five minutes.",
      followUpZh: "司机或乘客可能会告诉下一站名称，并说明步行距离。",
      repair: "Sorry, could you repeat the name of the next stop?"
    },
    {
      id: "transport-parking",
      scene: "transport",
      title: "确认停车规则",
      prompt: "我想在路边停车，想确认收费时间、最多能停多久、哪里买票，以及这个位置能不能停。",
      followUp: "It's two-hour parking until six, and you need to buy a ticket at the machine.",
      followUpZh: "对方可能会说明限时停车时间，以及需要购买停车票。",
      repair: "Could you confirm how much the parking ticket costs?"
    },
    {
      id: "travel-hotel-checkin",
      scene: "travel",
      title: "酒店提前入住和寄存行李",
      prompt: "我到酒店太早了。我想确认现在能不能 check in，如果不行，是否可以先寄存行李。",
      followUp: "Your room won't be ready until two, but we can store your bags at reception.",
      followUpZh: "前台可能会说明房间尚未准备好，但可以寄存行李。",
      repair: "Could you tell me when I can come back to check in?"
    },
    {
      id: "travel-tour",
      scene: "travel",
      title: "报名一日游并问天气取消规则",
      prompt: "我想报名明天的一日游，想确认集合时间和价格，并问如果天气不好取消会不会退款。",
      followUp: "Pickup is at seven outside your hotel. If we cancel the tour, you'll get a full refund.",
      followUpZh: "对方可能会说明接送时间和天气取消退款规则。",
      repair: "Could you confirm the pickup location and time?"
    },
    {
      id: "travel-lost-item",
      scene: "travel",
      title: "遗失物品后询问失物招领",
      prompt: "我可能把水杯落在公交上了。我想说明乘车时间、路线和物品特征，并问有没有失物招领。",
      followUp: "Which route were you on, and what does the bottle look like?",
      followUpZh: "对方可能会问公交路线以及物品外观。",
      repair: "It's a blue bottle with a black lid. Let me show you a photo."
    },
    {
      id: "travel-info",
      scene: "travel",
      title: "咨询游客中心和行程安排",
      prompt: "我想问游客中心附近有哪些值得去的地方，怎么坐公共交通，以及一日交通票是否划算。",
      followUp: "How much time do you have, and are you more interested in beaches or museums?",
      followUpZh: "工作人员可能会问你有多少时间，以及更喜欢海滩还是博物馆。",
      repair: "Could you recommend something that's easy to reach by train?"
    },
    {
      id: "shopping-supermarket",
      scene: "shopping",
      title: "超市找商品和自助结账",
      prompt: "我在超市找不到无麸质面包和洗衣液。我想问店员商品在哪一排，并确认自助结账能不能用现金。",
      followUp: "The gluten-free bread is in aisle six, and self-checkout is card only.",
      followUpZh: "店员可能会告诉你商品货架，并说明自助结账只能刷卡。",
      repair: "Could you show me which aisle that is?"
    },
    {
      id: "shopping-return",
      scene: "shopping",
      title: "退货或换尺码",
      prompt: "我买的鞋码数不合适，标签还在。我想问能不能换大一码，或者没有库存时能不能退款。",
      followUp: "Do you have the receipt? We can exchange them if they haven't been worn outside.",
      followUpZh: "店员可能会要求收据，并确认鞋子没有在户外穿过。",
      repair: "Could you check whether the larger size is in stock?"
    },
    {
      id: "shopping-sim",
      scene: "shopping",
      title: "购买手机预付费套餐",
      prompt: "我想买一个适合澳洲使用的预付费手机套餐，想确认流量、有效期、能不能保留现有手机号，以及如何激活。",
      followUp: "Do you want to keep your current number, and what kind of phone do you have?",
      followUpZh: "店员可能会问是否保留号码，以及你使用的手机类型。",
      repair: "Could you explain how activation works step by step?"
    },
    {
      id: "shopping-pharmacy",
      scene: "shopping",
      title: "药店购买感冒药",
      prompt: "我鼻塞、咳嗽，想知道哪种非处方药适合我。我还需要开车，所以想问吃完会不会犯困。",
      followUp: "This one may make you drowsy. Are you taking any other medication?",
      followUpZh: "药师可能会提醒药物可能让人犯困，并询问你是否在服用其他药。",
      repair: "Is there a non-drowsy option?"
    },
    {
      id: "office-standup",
      scene: "office",
      title: "早会同步工作进度",
      prompt: "早会上你要用一分钟说明昨天完成了什么、今天准备做什么，以及目前有没有卡点。",
      followUp: "What support do you need to get the report finished today?",
      followUpZh: "对方可能会追问你需要什么支持才能今天完成报告。",
      repair: "Let me recap what I need before I continue."
    },
    {
      id: "office-action-items",
      scene: "office",
      title: "确认会议待办事项",
      prompt: "会议结束时你没完全听清自己的任务。你要确认 action item、负责人和截止时间。",
      followUp: "You're doing the draft, and I'll review it by Thursday. Does that make sense?",
      followUpZh: "同事可能会确认你负责草稿、他在周四前审核，并问你是否理解。",
      repair: "Let me repeat that back to make sure I've got it."
    },
    {
      id: "office-short-staffed",
      scene: "office",
      title: "人手不足时调整优先级",
      prompt: "团队今天 short-staffed，大家都 flat out。你需要向经理说明 frustration，并请求调整今天的工作优先级。",
      followUp: "I understand. Which two tasks are absolutely essential today?",
      followUpZh: "经理可能会理解情况，并让你选出今天最关键的两项任务。",
      repair: "Can I walk you through what's essential right now?"
    },
    {
      id: "office-handover",
      scene: "office",
      title: "下班前做工作交接",
      prompt: "你要把未完成任务交接给同事，说明进度、下一步、联系人和可能的风险。",
      followUp: "Has the customer already been told about the delay?",
      followUpZh: "接手的同事可能会问客户是否已经知道延期。",
      repair: "Let me check that and get back to you."
    },
    {
      id: "office-catchup",
      scene: "office",
      title: "约同事快速沟通",
      prompt: "你想约同事 catch-up，讨论项目进度，并请他把另一个 stakeholder loop in。",
      followUp: "I'm free for fifteen minutes after lunch. What do you want to cover?",
      followUpZh: "同事可能会说午饭后有十五分钟，并问你需要讨论什么。",
      repair: "Could we do a quick fifteen-minute catch-up?"
    },
    {
      id: "office-leave",
      scene: "office",
      title: "申请 annual leave",
      prompt: "你想申请几天 annual leave，需要说明日期、交接安排，并确认工作是否能按时完成。",
      followUp: "Have you arranged a handover for the work due while you're away?",
      followUpZh: "经理可能会问你是否已经安排好离开期间工作的交接。",
      repair: "Could you confirm which dates need coverage?"
    },
    {
      id: "cashier-payment",
      scene: "cashier",
      title: "询问现金还是刷卡",
      prompt: "顾客准备结账。你要询问现金还是 card，是否要袋子，并说明可以 tap and go。",
      followUp: "Card, please. Is there a surcharge on tap and go?",
      followUpZh: "顾客可能会选择刷卡，并询问感应支付是否有附加费。",
      repair: "Sorry, let me confirm the surcharge for you."
    },
    {
      id: "cashier-declined",
      scene: "cashier",
      title: "EFTPOS 支付失败",
      prompt: "顾客的 EFTPOS 支付没有成功。你要礼貌说明，建议换一张卡或使用另一种支付方式。",
      followUp: "It says declined. Can I try another card or pay by phone?",
      followUpZh: "顾客可能会说明支付被拒，并询问能否换卡或手机支付。",
      repair: "Let's try that again and I'll check the terminal."
    },
    {
      id: "cashier-split-bill",
      scene: "cashier",
      title: "帮顾客分单付款",
      prompt: "两位顾客想 split the bill。你要确认各自付哪些商品、怎么分，并分别打印 receipt。",
      followUp: "We're paying separately. Can we also apply the voucher to my half?",
      followUpZh: "顾客可能会要求分开付款，并把优惠券用在其中一人的部分。",
      repair: "Let me confirm which items go on each bill."
    },
    {
      id: "cashier-refund",
      scene: "cashier",
      title: "退款需要经理批准",
      prompt: "顾客要求退款，但金额较高。你要检查 receipt、说明需要 manager approval，并请顾客稍等。",
      followUp: "How long will the manager take? I don't have a receipt but I have a photo of it.",
      followUpZh: "顾客可能会问经理要多久，并说明只有收据照片。",
      repair: "Let me check whether a photo is acceptable."
    },
    {
      id: "cashier-price-check",
      scene: "cashier",
      title: "商品价格与标签不一致",
      prompt: "收银机价格和 shelf price 不一致。你要先做 price check，并向顾客说明处理方式。",
      followUp: "The shelf said fifteen dollars, but it scanned as twenty. Can you check?",
      followUpZh: "顾客可能会指出货架价格较低，并请你核价。",
      repair: "Could you show me where the price tag was?"
    },
    {
      id: "cashier-minimum-spend",
      scene: "cashier",
      title: "最低刷卡金额与现金提取",
      prompt: "顾客买的东西不到 minimum spend，还想 cash out。你要解释规则，并给出可选方案。",
      followUp: "I don't have cash. Can I add something small so I can use my card?",
      followUpZh: "顾客可能没有现金，并问能否加买小商品达到刷卡金额。",
      repair: "I can show you a few small items that would get you over the minimum."
    },
    {
      id: "retail-greet",
      scene: "retail",
      title: "接待只想随便看看的顾客",
      prompt: "顾客走进店里说只是 browse。你要回应对方，同时说明需要帮助时可以找你。",
      followUp: "No worries. If I need a different size, do I ask you or look in the back?",
      followUpZh: "顾客可能会说先自己看，并问需要其他尺码时是否找你。",
      repair: "Of course. Just let me know if you'd like me to check."
    },
    {
      id: "retail-size",
      scene: "retail",
      title: "询问尺码并查库存",
      prompt: "顾客想找一件衣服的另一个 size。你要确认颜色、尺码，并检查 in stock 或另一家店库存。",
      followUp: "Do you have it in medium, and can you check another store?",
      followUpZh: "顾客可能会问中码是否有货，并请你查另一家店。",
      repair: "Let me check the stock system and confirm the store."
    },
    {
      id: "retail-fitting-room",
      scene: "retail",
      title: "指引试衣间",
      prompt: "顾客想 try on 几件衣服。你要指引 fitting room，说明试穿数量限制和不能带食品进入。",
      followUp: "Can I take all five items in, and is there a limit?",
      followUpZh: "顾客可能会问能带几件进去，以及有没有数量限制。",
      repair: "Let me confirm the fitting-room limit for you."
    },
    {
      id: "retail-refund-policy",
      scene: "retail",
      title: "解释退换货政策",
      prompt: "顾客想退回已经穿过的商品。你要检查 receipt 和 tags，解释 return policy，并说明可以换货还是只能给 store credit。",
      followUp: "I wore it once but didn't wash it. Can I still exchange it?",
      followUpZh: "顾客可能会说只穿过一次、没有洗过，并问能否换货。",
      repair: "Let me check the condition against our return policy."
    },
    {
      id: "retail-recommend",
      scene: "retail",
      title: "推荐配件但不强推",
      prompt: "顾客买了一件上衣。你想推荐搭配的 accessory，但要先询问对方是否需要，不要让对方觉得被 hard sell。",
      followUp: "That sounds nice. Do you have it in a neutral colour?",
      followUpZh: "顾客可能感兴趣，并询问有没有中性色。",
      repair: "Would you like me to show you a couple of options?"
    },
    {
      id: "retail-other-store",
      scene: "retail",
      title: "本店缺货并查询其他门店",
      prompt: "顾客想要的款式 out of stock。你要说明缺货，询问是否要查其他门店、调货或留联系方式。",
      followUp: "Could you check the city store? I'd rather pick it up there.",
      followUpZh: "顾客可能会请你查询市中心门店，并希望到店自取。",
      repair: "Could I take your name and number in case it comes back in stock?"
    },
    {
      id: "social-smoko",
      scene: "social",
      title: "休息时间和同事闲聊",
      prompt: "休息时同事问我在澳洲待多久。我想简单回答，并问一句他们平时周末做什么。",
      followUp: "Fair enough. Are you planning to travel around after your farm work?",
      followUpZh: "同事可能会继续问你农场工作结束后是否打算旅行。",
      repair: "Sorry, I didn't quite catch that. What did you ask?"
    },
    {
      id: "social-clarify",
      scene: "social",
      title: "同事说得太快",
      prompt: "同事交代任务时说得太快，我没听清。我想请他说慢一点，并复述关键步骤确认。",
      followUp: "I said the orders go in the blue trays, and the stock goes back in the cool room.",
      followUpZh: "同事可能会重复蓝托盘放订单、库存放回冷库的步骤。",
      repair: "Could you say that again a bit more slowly?"
    },
    {
      id: "social-sick",
      scene: "social",
      title: "向上司请假",
      prompt: "我明天可能不能上班，想尽早通知主管，说明身体不舒服，并确认需要提供什么证明。",
      followUp: "Thanks for letting me know. Can you text me if you're still unwell tomorrow morning?",
      followUpZh: "主管可能会要求你第二天早上再发短信说明情况。",
      repair: "Of course. What time should I message you?"
    },
    {
      id: "social-swap",
      scene: "social",
      title: "请求同事换班",
      prompt: "我想和同事换一个班次，因为周六有安排。我想礼貌询问、说明可以换哪一天，并确认要不要先问主管。",
      followUp: "I can take your Saturday shift if you cover my Sunday morning. Shall we ask the manager first?",
      followUpZh: "同事可能会提出互换条件，并问是否先征求主管同意。",
      repair: "That works for me. Let's confirm it with the manager."
    }
  ];

  const RANDOM_PROMPTS = [
    "我想点一杯外带的 long black，再要一份不含坚果的早餐。",
    "请问今天可以安排试工吗？我想确认开始时间、着装要求和需要带的证件。",
    "客人说这份订单少了一杯饮料，我想核对订单并马上补做。",
    "这道菜里有乳制品吗？客人对乳制品过敏，我需要先和厨房确认。",
    "明天农场几点集合？我需要自己准备靴子和帽子吗？",
    "我想确认这周的工时表怎么填写，以及工资和 payslip 什么时候发。",
    "主管说明天从早上六点开始，我想确认集合地点和午休时间。",
    "我发现机器旁边地面有水，想请主管安排清理，并提醒同事注意安全。",
    "我投了咖啡店的 casual 岗位，想确认他们有没有收到申请，以及什么时候会面试。",
    "我周六有安排，想问同事能不能换班，并确认是否需要先问主管。",
    "我想预约看一间房，想确认周租、bond、账单和最短租期。",
    "我正在申请 TFN，想开银行账户接收工资，需要准备哪些材料？",
    "我身体不舒服，明天可能不能上班，想尽早通知主管并问需要什么证明。",
    "同事说得太快，我没听清任务步骤，想请他慢一点再说一遍。",
    "我到餐厅取配送订单了，想确认订单号还要等多久。",
    "我找不到客人的公寓入口，想确认门禁和放餐位置。",
    "我想租三天车，想确认驾照、保险、押金和还车时是否要加满油。",
    "我想坐火车去市中心，想确认交通卡、充值和换乘方式。",
    "我到酒店太早了，想确认能不能提前入住或者先寄存行李。",
    "我想报名明天的一日游，想确认接送时间和天气不好时怎么退款。",
    "我在超市找不到商品，想问货架位置和自助结账方式。",
    "我买的衣服尺码不合适，想换一个尺码或者退款。",
    "我鼻塞咳嗽，想买不会让人犯困的感冒药。",
    "客人说饮料做错了，我想道歉、核对订单并马上更换。",
    "客人问我今天天气怎么样，我想在点单时自然回应一句。"
  ];

  const COMMON_HIGH_VALUE_WORDS = new Set([
    "proposal",
    "implementation",
    "reservation",
    "itinerary",
    "appointment",
    "feedback",
    "deadline",
    "budget",
    "refund",
    "allergy",
    "confirm",
    "layover",
    "check in",
    "check out",
    "check-in",
    "check-out",
    "checkin",
    "checkout",
    "receipt",
    "recommendation",
    "roster",
    "shift",
    "induction",
    "payslip",
    "superannuation",
    "bond",
    "lease",
    "takeaway",
    "ingredient",
    "timesheet",
    "supervisor"
  ]);

  const BASIC_LEARNING_WORDS = new Set([
    "ask", "buy", "call", "car", "check", "city", "coffee", "customer",
    "day", "drink", "find", "food", "get", "give", "go", "good", "have",
    "help", "home", "house", "item", "job", "know", "make", "manager",
    "money", "need", "office", "order", "pay", "people", "person", "phone",
    "place", "price", "problem", "product", "room", "say", "service", "shop",
    "speak", "staff", "store", "take", "talk", "thing", "think", "time",
    "train", "want", "week", "work"
  ]);

  const HIGH_VALUE_WHV_TERMS = new Set([
    "allergen", "bond", "carpet", "condition report", "deduction", "dispute",
    "dietary requirement", "entry report", "exit report", "fair wear",
    "fair wear and tear", "final inspection", "finalise", "induction",
    "penalty rate", "payslip", "photo evidence", "professional clean",
    "rent in advance", "short-staffed", "stain", "stocktake", "timesheet",
    "tribunal", "wear and tear"
  ]);

  const BASIC_LEARNING_PHRASES = new Set([
    "by the way", "catch you later", "get on", "get off", "give someone a hand",
    "go out", "have a look", "hold on", "let me know", "make sense",
    "no idea", "no worries", "not a problem", "on the way", "pop in",
    "sounds good", "stay in", "that works"
  ]);

  const TASK_SKILLS = ["open", "follow_up", "clarify"];
  const TASK_SKILL_LABELS = {
    open: "开口开启",
    follow_up: "应对追问",
    clarify: "异议 / 确认"
  };
  const TASK_TWISTS = [
    "快节奏",
    "第一次处理",
    "没被听懂",
    "临时变化",
    "电话沟通",
    "确认细节",
    "嘈杂环境",
    "时间紧迫",
    "对方不满",
    "涉及规则",
    "同事接手",
    "临近下班"
  ];
  const DEFAULT_REPAIR = "Sorry, I didn't catch that. Could you say it again?";
  const DEFAULT_CONFIRM = "Let me check on that and get back to you.";

  const SYSTEM_PROMPT = `
你是一名克制、准确、懂中文母语者困难的澳洲 WHV 生活与工作英语教练。用户计划去澳洲打工度假，工作场景以咖啡厅、餐馆、农场和工厂为主，同时需要处理租房、银行、就医和同事沟通。目标不是参加雅思、托福等考试。

用户会输入中文、英文或中英混合的一句话。请先理解真实意图，再在不改人物、时间、数量、事实、态度和专有名词的前提下，写成自然、好开口、适合朗读的澳洲口语。

必须遵守：
- 使用澳洲工作场景常见表达，如 takeaway、roster、smoko、TFN、super、bond、payslip、PPE。
- 不编造签证、工时或劳动法规则；相关话题只练表达，并提醒以官方信息为准。
- 不补写事实，不改变原意；优先短句、常用词和容易开口的说法。
- natural_versions 只给 1 个最自然的版本。
- useful_chunks 正好给 3 个，类型要区分，不要重复整句；每个只配一句短例句。
- key_words 给 0-2 个，宁缺毋滥；必须真实出现在 natural_versions 中，并且值得单独学。
- 不要拿 order、customer、product、item、job、manager、staff、coffee 等基础词凑数。优先 B2/C1、熟词僻义、澳洲 WHV 专用词或容易记混的搭配。
- key_phrases 给 0-1 个；不能把整句当词组，也不能与重点单词重复。
- practice_prompts 只给 1 条，必须是能让用户马上重说一遍的中文任务。
- 语块要能在其他场景重复使用；词组不要把整句当词组，也不要重复语块。
- 音标不确定时写“暂无”；按用户偏好给 US 或 UK 音标。
- word_family 只保留真实、可复用的派生关系，不列第三人称单数、过去式、复数等屈折形式。
- memory_trick 和 homophone_trick 只在确有帮助时写，不自然就留空。
- 单词和义项词性只写 n./v./adj./adv. 等缩写，不写中文词性。
- 每个重点单词只列 1-2 个义项：当前语境义项必列；最多再加 1 个真正常见且不同的义项。每项配一句短例句。
- 当前语境义项必须标记 in_context: true，且只能标记一个。
- 不输出 Markdown，不输出解释文字，只输出一个合法 JSON 对象。

JSON 必须严格使用以下结构：
{
  "original": "用户原句",
  "intent": "一句话概括用户真正想表达的意思",
  "natural_versions": [
    {
      "style": "natural | work | concise | formal | polite",
      "text": "地道英文表达"
    }
  ],
  "useful_chunks": [
    {
      "type": "整句表达 | 动词搭配 | 礼貌请求 | 确认信息 | 澄清表达 | 救场表达",
      "chunk": "可直接复用的语块，不要只给一个普通单词",
      "meaning": "这个语块什么时候用",
      "example": "用这个语块造一个当前场景相关的英文例句"
    }
  ],
  "key_words": [
    {
      "word": "重点单词",
      "level": "B1 | B2 | C1 | C2",
      "ipa_us": "美音音标或暂无",
      "ipa_uk": "英音音标或暂无",
      "meaning": "当前语境下的中文含义",
      "senses": [
        {
          "pos": "n. | v. | adj. | adv. | prep. | conj. | pron. | interj.",
          "zh": "该词性的一个常用中文释义",
          "example": { "en": "体现这个义项的英文例句", "zh": "例句中文翻译" },
          "in_context": true
        }
      ],
      "homophone_trick": "中文谐音→词义；无则空",
      "memory_trick": "拆词、词根或语义联想",
      "word_family": [
        { "label": "v.", "value": "implement" },
        { "label": "n.", "value": "implementation" }
      ]
    }
  ],
  "key_phrases": [
    {
      "phrase": "check with the kitchen",
      "level": "B1 | B2 | C1 | C2",
      "ipa": "词组音标或暂无",
      "meaning": "当前语境下的中文含义",
      "memory_method": "split | sound | pun | association",
      "memory_trick": "一条能拆到拼写或读音的记忆法",
      "phrase_variations": [
        { "label": "常见变形", "value": "check with the kitchen before ordering" },
        { "label": "相关表达", "value": "confirm the ingredients" }
      ],
      "examples": [
        { "en": "英文例句", "zh": "中文意思" }
      ]
    }
  ],
  "practice_prompts": [
    "让用户马上重说一遍的具体中文任务"
  ]
}
`.trim();

  const TASK_GENERATOR_PROMPT = `
你是澳洲 WHV 英语口语教练，擅长把日常场景加上“突发变量”变成真正会发生的对话任务。用户当期场景见 user 消息。
生成 3 个具体、可练、难度递进的任务，分别对应：
1. skill="open" 开口开启：你主动说明来意，目标说清楚；
2. skill="follow_up" 应对追问：对方有 follow-up，你要接住；
3. skill="clarify" 异议/确认：围绕价格、时间、规则或职责确认细节。
每个任务从以下变量选 1 个，3 个不能重复：快节奏、第一次处理、没被听懂、临时变化、电话沟通、确认细节、嘈杂环境、时间紧迫、对方不满、涉及规则、同事接手、临近下班。
任务必须像 WHV 真实生活：点单卡壳、房东发消息、工头现场派活、药剂师问症状、客人投诉、同事交接。
不要教科书题，不要在任务卡里直接给完整答案。
title 中文 ≤15 字；prompt 中文 ≤50 字，写明你在哪、对方是谁、这一轮要办什么。
counterpart 是对方开口或先回应你的 1 句自然英语，必须符合人物和情绪。followUp 是你说完后对方可能接着问的 1 句英语，要带忙、不耐烦、关心、怀疑等真实语气。repair 是没听懂时能说的短句。
只输出 JSON：
{"tasks":[{"title":"中文标题","prompt":"中文场景与目标","skill":"open|follow_up|clarify","twist":"突发变量","counterpart":"English opening line","counterpartZh":"中文解释","followUp":"English follow-up","followUpZh":"中文解释","repair":"English repair"}]}
`.trim();

  const LOOKUP_SYSTEM_PROMPT = `
你是澳洲生活英语词典。根据用户输入，返回一个最匹配的英语单词、词组或澳洲常用表达。
优先给澳洲生活、工作、交通、租房、银行、餐饮和零售中的用法。
只输出 JSON：{"term":"英文表达","zh":"中文含义","ipa_us":"美音音标或暂无","example":"英文例句","example_zh":"中文意思","category":"cafe|restaurant|shopping|transport|housing|banking|work|office|retail|places|daily"}
`.trim();

  const DEMO_RESULT = {
    original: "我想点一杯外带的 flat white，再问一下这份早餐里有没有坚果。",
    intent: "点一杯外带咖啡，并向店员确认早餐是否含坚果。",
    naturalVersions: [
      {
        style: "natural",
        text: "Could I get a flat white to take away? And does the breakfast contain any nuts?"
      }
    ],
    expressionChunks: [
      {
        type: "整句表达",
        text: "Could I get ... to take away?",
        meaning: "点单时礼貌说明要外带，后面可以替换成任意饮品或餐点。",
        example: "Could I get a long black to take away?"
      },
      {
        type: "确认信息",
        text: "Does it contain any ...?",
        meaning: "确认食物里是否含有某种成分，特别适合过敏原和忌口。",
        example: "Does it contain any dairy?"
      },
      {
        type: "礼貌请求",
        text: "Would it be possible to ...?",
        meaning: "比直接说 Can you 更礼貌，适合向店员、房东、雇主或工作人员提出请求。",
        example: "Would it be possible to get it without butter?"
      },
      {
        type: "澄清表达",
        text: "Sorry, I didn't catch that.",
        meaning: "没听清时请对方再说一次，对话不会直接卡住。",
        example: "Sorry, I didn't catch that. Which size did you want?"
      }
    ],
    learningItems: [
      {
        type: "phrase",
        text: "to take away",
        level: "A2",
        ipa: "/tə teɪk əˈweɪ/",
        meaning: "外带；澳洲咖啡店常用说法，美国英语中常说 to go。",
        memoryMethod: "association",
        memoryTrick: "take away 就是把食物从店里带到外面。",
        forms: [
          { label: "相关表达", value: "takeaway (n.)" },
          { label: "替换表达", value: "to go（美式）" }
        ],
        examples: [
          {
            en: "Just one coffee to take away, please.",
            zh: "请给我一杯外带咖啡。"
          }
        ]
      },
      {
        type: "phrase",
        text: "contain any nuts",
        level: "A2",
        ipa: "/kənˈteɪn ˈeni nʌts/",
        meaning: "含不含坚果；用于询问食物成分和确认过敏原。",
        memoryMethod: "association",
        memoryTrick: "contain 是“包含”，nuts 是“坚果”；any 用在疑问句里表示“有没有”。",
        forms: [
          { label: "常见变形", value: "Does it contain nuts?" },
          { label: "相关表达", value: "I'm allergic to nuts." }
        ],
        examples: [
          {
            en: "Does this sauce contain any nuts?",
            zh: "这个酱汁含坚果吗？"
          }
        ]
      },
      {
        type: "word",
        text: "contain",
        level: "B1",
        ipaUs: "/kənˈteɪn/",
        ipaUk: "/kənˈteɪn/",
        meaning: "含有；包含某种成分",
        memoryMethod: "split",
        memoryTrick: "con- 有“一起”的感觉，-tain 来自 hold，像把东西一起装在里面。",
        homophoneTrick: "谐音“肯填”：盒子肯不肯填得下，就是能不能 contain（容纳、包含）。",
        forms: [
          { label: "n.", value: "container" }
        ],
        senses: [
          {
            pos: "v.",
            zh: "含有；包含某种成分",
            examples: [
              {
                en: "Does this breakfast contain any nuts?",
                zh: "这份早餐含坚果吗？"
              }
            ],
            inContext: true
          },
          {
            pos: "v.",
            zh: "容纳；装得下",
            examples: [
              {
                en: "This box can contain up to twenty cups.",
                zh: "这个箱子最多能装二十个杯子。"
              }
            ],
            inContext: false
          },
          {
            pos: "v.",
            zh: "控制；抑制情绪",
            examples: [
              {
                en: "She could hardly contain her excitement.",
                zh: "她几乎控制不住自己的兴奋。"
              }
            ],
            inContext: false
          }
        ],
        examples: []
      }
    ],
    practicePrompts: [
      "不看答案，点一杯外带咖啡。",
      "用自己的话确认一种食物是否含坚果，并说明过敏情况。"
    ]
  };

  const elements = {
    sceneTabs: document.querySelector("#sceneTabs"),
    taskGrid: document.querySelector("#taskGrid"),
    shuffleTasksButton: document.querySelector("#shuffleTasksButton"),
    todayCompletedStat: document.querySelector("#todayCompletedStat"),
    weekCompletedStat: document.querySelector("#weekCompletedStat"),
    dueReviewStat: document.querySelector("#dueReviewStat"),
    gapSummary: document.querySelector("#gapSummary"),
    activeTaskKicker: document.querySelector("#activeTaskKicker"),
    composerTitle: document.querySelector("#composerTitle"),
    clearTaskButton: document.querySelector("#clearTaskButton"),
    sourceInput: document.querySelector("#sourceInput"),
    clearInputButton: document.querySelector("#clearInputButton"),
    promptRefreshButton: document.querySelector("#promptRefreshButton"),
    charCount: document.querySelector("#charCount"),
    micButton: document.querySelector("#micButton"),
    micLabel: document.querySelector("#micLabel"),
    generateButton: document.querySelector("#generateButton"),
    toneOptions: document.querySelector("#toneOptions"),
    resultContent: document.querySelector("#resultContent"),
    emptyResult: document.querySelector("#emptyResult"),
    loadingResult: document.querySelector("#loadingResult"),
    errorResult: document.querySelector("#errorResult"),
    errorMessage: document.querySelector("#errorMessage"),
    demoButton: document.querySelector("#demoButton"),
    errorDemoButton: document.querySelector("#errorDemoButton"),
    errorSettingsButton: document.querySelector("#errorSettingsButton"),
    openSettingsButton: document.querySelector("#openSettingsButton"),
    openLookupButton: document.querySelector("#openLookupButton"),
    lookupDialog: document.querySelector("#lookupDialog"),
    closeLookupButton: document.querySelector("#closeLookupButton"),
    lookupInput: document.querySelector("#lookupInput"),
    lookupMeta: document.querySelector("#lookupMeta"),
    lookupResults: document.querySelector("#lookupResults"),
    lookupAiButton: document.querySelector("#lookupAiButton"),
    lookupAiStatus: document.querySelector("#lookupAiStatus"),
    settingsDialog: document.querySelector("#settingsDialog"),
    settingsForm: document.querySelector("#settingsForm"),
    settingsManual: document.querySelector("#settingsManual"),
    settingsPrompt: document.querySelector("#settingsPrompt"),
    settingsResult: document.querySelector("#settingsResult"),
    copyPromptButton: document.querySelector("#copyPromptButton"),
    openChatGPTButton: document.querySelector("#openChatGPTButton"),
    parseManualButton: document.querySelector("#parseManualButton"),
    closeSettingsButton: document.querySelector("#closeSettingsButton"),
    clearSettingsButton: document.querySelector("#clearSettingsButton"),
    endpointInput: document.querySelector("#endpointInput"),
    apiKeyInput: document.querySelector("#apiKeyInput"),
    modelInput: document.querySelector("#modelInput"),
    voiceSelect: document.querySelector("#voiceSelect"),
    speechRateInput: document.querySelector("#speechRateInput"),
    testVoiceButton: document.querySelector("#testVoiceButton"),
    refreshVoicesButton: document.querySelector("#refreshVoicesButton"),
    packInfo: document.querySelector("#packInfo"),
    syncStatus: document.querySelector("#syncStatus"),
    syncNowButton: document.querySelector("#syncNowButton"),
    exportAllButton: document.querySelector("#exportAllButton"),
    importBackupButton: document.querySelector("#importBackupButton"),
    importBackupInput: document.querySelector("#importBackupInput"),
    libraryStorageStatus: document.querySelector("#libraryStorageStatus"),
    openLexiconButton: document.querySelector("#openLexiconButton"),
    closeLexiconButton: document.querySelector("#closeLexiconButton"),
    lexiconDrawer: document.querySelector("#lexiconDrawer"),
    lexiconSearch: document.querySelector("#lexiconSearch"),
    lexiconCategories: document.querySelector("#lexiconCategories"),
    randomLexiconButton: document.querySelector("#randomLexiconButton"),
    practiceLexiconButton: document.querySelector("#practiceLexiconButton"),
    toggleCustomLexiconButton: document.querySelector("#toggleCustomLexiconButton"),
    customLexiconForm: document.querySelector("#customLexiconForm"),
    customLexiconTerm: document.querySelector("#customLexiconTerm"),
    customLexiconZh: document.querySelector("#customLexiconZh"),
    customLexiconCategory: document.querySelector("#customLexiconCategory"),
    customLexiconExample: document.querySelector("#customLexiconExample"),
    customLexiconStatus: document.querySelector("#customLexiconStatus"),
    lexiconList: document.querySelector("#lexiconList"),
    lexiconCount: document.querySelector("#lexiconCount"),
    openLibraryButton: document.querySelector("#openLibraryButton"),
    closeLibraryButton: document.querySelector("#closeLibraryButton"),
    libraryDrawer: document.querySelector("#libraryDrawer"),
    drawerBackdrop: document.querySelector("#drawerBackdrop"),
    libraryList: document.querySelector("#libraryList"),
    librarySearch: document.querySelector("#librarySearch"),
    reviewSummary: document.querySelector("#reviewSummary"),
    exportLibraryButton: document.querySelector("#exportLibraryButton"),
    toast: document.querySelector("#toast")
  };

  let settings = loadJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  let entries = loadJson(STORAGE_KEYS.entries, []);
  let activities = loadJson(STORAGE_KEYS.activities, []);
  let syncQueue = loadJson(STORAGE_KEYS.syncQueue, []);
  let syncMeta = loadJson(STORAGE_KEYS.syncMeta, {
    lastSyncedAt: "",
    mode: "unknown"
  });
  let syncTimer = null;
  let syncInFlight = false;
  let syncInitialized = false;
  let suppressSyncQueue = false;
  let activeTone = "natural";
  let activeScene = "hospitality";
  let activeTask = null;
  let currentResult = null;
  let currentInput = "";
  let currentEntryId = "";
  let currentGaps = new Set();
  let taskSets = {};
  let taskGenerating = false;
  let activeLexiconCategory = "all";
  let randomLexiconIds = new Set();
  let lexiconRenderLimit = 60;
  let lookupCache = loadJson(STORAGE_KEYS.lookupCache, []);
  let currentLookupAiEntry = null;
  let recognition = null;
  let listening = false;
  let speechBaseText = "";
  let practiceRecognition = null;
  let practiceListening = false;
  let practiceBaseText = "";
  let speechRunId = 0;
  let speechWatchdog = null;
  let activeSpeechUtterances = [];
  let toastTimer = null;
  let promptIndex = -1;
  let manualPromptInput = "";

  init();

  function init() {
    migrateSettings();
    migrateCustomLexicon();
    migrateStoredEntries();
    migrateActivities();
    migrateLookupCache();
    elements.endpointInput.value = settings.endpoint || "";
    elements.apiKeyInput.value = settings.apiKey || "";
    elements.modelInput.value = settings.model || "";
    const accentInput = document.querySelector(`input[name="accent"][value="${settings.accent || "us"}"]`);
    if (accentInput) accentInput.checked = true;

    bindTaskHub();
    bindComposer();
    bindSettings();
    bindLookup();
    bindLexicon();
    bindLibrary();
    bindDrawer();
    setupSpeechRecognition();
    setupVoiceOptions();
    buildTaskSets();
    const packIssues = validateActivePack();
    elements.packInfo.textContent =
      `当前学习包：${PACK.label} · 内容 v${PACK.contentVersion} · 结构 v${PACK.schemaVersion}` +
      (packIssues.length ? ` · ${packIssues.length} 项校验警告` : " · 校验通过");
    elements.packInfo.title = packIssues.length
      ? packIssues.join("\n")
      : "学习包字段、场景、任务和词库校验通过";
    elements.packInfo.dataset.valid = String(packIssues.length === 0);
    document.documentElement.dataset.packValidation = packIssues.length
      ? packIssues.join(" | ")
      : "ok";
    window.SAYFLOW_RUNTIME = {
      packId: PACK.id,
      contentVersion: PACK.contentVersion,
      schemaVersion: PACK.schemaVersion,
      packSourceLoaded: Boolean(PACK_SOURCE),
      issues: packIssues,
      isHighValueLexiconEntry,
      isBasicLearningWord,
      normalizeGeneratedTasks,
      normalizeModelData,
      findLexiconMatches
    };
    if (packIssues.length) console.warn("SayFlow pack validation:", packIssues);
    renderTasks();
    refreshPrompt();
    updateCharacterCount();
    renderLibrary();
    updateDashboard();
    setupCloudSync();

    window.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        generateFromInput();
      }
      if (event.key === "Escape") {
        closeAllDrawers();
        closeLookup();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openLookup();
      }
    });
  }

  function migrateSettings() {
    if (settings.accentVersion === 3) return;
    settings = {
      ...DEFAULT_SETTINGS,
      ...settings,
      accent: "us",
      accentVersion: 3
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }

  function validateActivePack() {
    const issues = [];
    const expected = PACK.expected || {};
    if (!PACK_SOURCE) {
      issues.push("pack.js 未加载，正在使用内置学习包元数据");
    }
    const requiredMeta = {
      id: "学习包 ID",
      label: "学习包名称",
      targetLanguage: "目标语言",
      sourceLanguage: "来源语言",
      locale: "内容地区",
      speechLanguage: "语音地区",
      schemaVersion: "结构版本",
      contentVersion: "内容版本"
    };
    Object.entries(requiredMeta).forEach(([key, label]) => {
      if (!PACK[key]) issues.push(`${label}缺失`);
    });
    if (!/^[a-z]{2,3}-[A-Z]{2}(?:-[a-z0-9-]+)?$/.test(cleanText(PACK.id))) {
      issues.push(`学习包 ID 格式异常：${PACK.id || "空"}`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(cleanText(PACK.contentVersion))) {
      issues.push(`内容版本不是 x.y.z：${PACK.contentVersion || "空"}`);
    }
    if (PACK.schemaVersion !== PACK_SCHEMA_VERSION) {
      issues.push(
        `学习包结构 v${PACK.schemaVersion || "空"} 与当前引擎 v${PACK_SCHEMA_VERSION} 不兼容`
      );
    }
    if (expected.scenes && SCENE_ORDER.length !== expected.scenes) {
      issues.push(`场景数 ${SCENE_ORDER.length}，声明为 ${expected.scenes}`);
    }
    if (expected.tasks && TASKS.length !== expected.tasks) {
      issues.push(`任务数 ${TASKS.length}，声明为 ${expected.tasks}`);
    }
    const taskIds = new Set();
    for (const task of TASKS) {
      if (!SCENE_ORDER.includes(task.scene)) issues.push(`任务 ${task.id} 的场景未注册`);
      if (!task.title || !task.prompt || !task.followUp || !task.repair) {
        issues.push(`任务 ${task.id || "未命名"} 字段不完整`);
      }
      if (taskIds.has(task.id)) issues.push(`任务 ID 重复：${task.id}`);
      taskIds.add(task.id);
    }
    const counts = {};
    for (const entry of BUILTIN_LEXICON) {
      if (!LEXICON_CATEGORY_LABELS[entry.category]) {
        issues.push(`词条 ${entry.term} 的分类未注册`);
      }
      if (!entry.term || !entry.zh || !entry.example) {
        issues.push(`词条 ${entry.term || "未命名"} 字段不完整`);
      }
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    }
    if (expected.lexiconCategories && Object.keys(counts).length !== expected.lexiconCategories) {
      issues.push(`词库分类数 ${Object.keys(counts).length}，声明为 ${expected.lexiconCategories}`);
    }
    if (expected.lexiconMinPerCategory) {
      Object.entries(LEXICON_CATEGORY_LABELS).forEach(([category, label]) => {
        if ((counts[category] || 0) < expected.lexiconMinPerCategory) {
          issues.push(`${label} 只有 ${counts[category] || 0} 条`);
        }
      });
    }
    return [...new Set(issues)];
  }

  function isActivePackItem(item) {
    return item?.packId === PACK.id;
  }

  function getActivePackEntries() {
    return entries.filter(isActivePackItem);
  }

  function getActivePackActivities() {
    return activities.filter(isActivePackItem);
  }

  function limitActivePackItems(items, limit) {
    let activeCount = 0;
    return items.filter((item) => {
      if (!isActivePackItem(item)) return true;
      activeCount += 1;
      return activeCount <= limit;
    });
  }

  function bindTaskHub() {
    elements.sceneTabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-scene]");
      if (!tab) return;
      setActiveScene(tab.dataset.scene);
      renderTasks();
    });

    elements.shuffleTasksButton.addEventListener("click", () => {
      if (taskGenerating) return;
      generateTaskSet(activeScene);
    });

    elements.taskGrid.addEventListener("click", (event) => {
      const taskButton = event.target.closest("[data-task-id]");
      if (!taskButton) return;
      const task = getTaskById(taskButton.dataset.taskId);
      if (task) startTask(task);
    });
  }

  function bindComposer() {
    elements.sourceInput.addEventListener("input", updateCharacterCount);
    if (elements.clearInputButton) {
      elements.clearInputButton.addEventListener("click", clearSourceInput);
    }
    elements.promptRefreshButton.addEventListener("click", refreshPrompt);
    elements.clearTaskButton.addEventListener("click", () => {
      clearActiveTask();
      showToast("已退出任务，改为自由输入");
    });

    elements.generateButton.addEventListener("click", generateFromInput);
    elements.demoButton.addEventListener("click", showDemo);
    elements.errorDemoButton.addEventListener("click", showDemo);

    elements.toneOptions.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-tone]");
      if (!chip) return;
      activeTone = chip.dataset.tone;
      elements.toneOptions.querySelectorAll("[data-tone]").forEach((button) => {
        button.classList.toggle("active", button === chip);
      });
    });

    document.querySelectorAll("[data-sample]").forEach((button) => {
      button.addEventListener("click", () => {
        elements.sourceInput.value = button.dataset.sample;
        updateCharacterCount();
        elements.sourceInput.focus();
      });
    });

    elements.resultContent.addEventListener("click", handleResultClick);
    elements.micButton.addEventListener("click", toggleSpeechRecognition);
    elements.errorSettingsButton.addEventListener("click", openSettings);
  }

  function bindSettings() {
    elements.openSettingsButton.addEventListener("click", openSettings);
    elements.closeSettingsButton.addEventListener("click", closeSettings);
    elements.copyPromptButton.addEventListener("click", () => {
      if (elements.settingsPrompt.value) copyText(elements.settingsPrompt.value);
    });
    elements.openChatGPTButton.addEventListener("click", () => {
      window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    });
    elements.parseManualButton.addEventListener("click", parseManualResult);
    elements.testVoiceButton.addEventListener("click", () => {
      speakText("Could I get a flat white to take away, please?", {
        accent: elements.settingsForm.querySelector('input[name="accent"]:checked')?.value || "us",
        voiceURI: elements.voiceSelect.value,
        rate: elements.speechRateInput.value
      });
    });
    elements.refreshVoicesButton.addEventListener("click", () => {
      populateVoiceOptions();
      showToast("已重新检测系统语音");
    });
    elements.syncNowButton.addEventListener("click", () => {
      syncNow({ manual: true });
    });
    elements.exportAllButton.addEventListener("click", exportAllData);
    elements.importBackupButton.addEventListener("click", () => {
      elements.importBackupInput.click();
    });
    elements.importBackupInput.addEventListener("change", async () => {
      const file = elements.importBackupInput.files?.[0];
      elements.importBackupInput.value = "";
      if (file) await importBackupFile(file);
    });

    elements.settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(elements.settingsForm);
      settings = {
        endpoint: elements.endpointInput.value.trim().replace(/\/+$/, ""),
        apiKey: elements.apiKeyInput.value.trim(),
        model: elements.modelInput.value.trim(),
        accent: String(formData.get("accent") || "us"),
        accentVersion: 3,
        voiceURI: String(formData.get("voiceURI") || ""),
        speechRate: String(formData.get("speechRate") || "0.95")
      };
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      closeSettings();
      showToast(isApiReady() ? "API 设置已保存" : "设置已保存");
    });

    elements.clearSettingsButton.addEventListener("click", () => {
      if (!window.confirm("清除当前浏览器中的接口配置？")) return;
      settings = { ...DEFAULT_SETTINGS };
      localStorage.removeItem(STORAGE_KEYS.settings);
      elements.endpointInput.value = "";
      elements.apiKeyInput.value = "";
      elements.modelInput.value = "";
      elements.voiceSelect.value = "";
      elements.speechRateInput.value = "0.95";
      const usAccent = document.querySelector('input[name="accent"][value="us"]');
      if (usAccent) usAccent.checked = true;
      showToast("API 配置已清除");
    });

    elements.settingsDialog.addEventListener("click", (event) => {
      if (event.target === elements.settingsDialog) closeSettings();
    });
  }

  function bindLookup() {
    elements.openLookupButton.addEventListener("click", openLookup);
    elements.closeLookupButton.addEventListener("click", closeLookup);
    elements.lookupInput.addEventListener("input", renderLookupResults);
    elements.lookupAiButton.addEventListener("click", lookupWithAi);
    elements.lookupDialog.addEventListener("click", (event) => {
      if (event.target === elements.lookupDialog) closeLookup();
    });
    elements.lookupResults.addEventListener("click", (event) => {
      const exampleSpeakButton = event.target.closest("[data-lookup-example-speak]");
      if (exampleSpeakButton) {
        speakText(exampleSpeakButton.dataset.lookupExampleSpeak);
        return;
      }
      const speakButton = event.target.closest("[data-lookup-speak]");
      if (speakButton) {
        speakText(speakButton.dataset.lookupSpeak);
        return;
      }
      const copyButton = event.target.closest("[data-lookup-copy]");
      if (copyButton) {
        copyText(copyButton.dataset.lookupCopy);
        return;
      }
      if (event.target.closest("[data-lookup-save]") && currentLookupAiEntry) {
        saveLookupEntryToLexicon(currentLookupAiEntry);
      }
    });
  }

  function openLookup() {
    closeAllDrawers();
    currentLookupAiEntry = null;
    elements.lookupInput.value = "";
    elements.lookupAiButton.classList.add("hidden");
    elements.lookupAiStatus.textContent = "本地查询不消耗 API";
    renderLookupResults();
    if (typeof elements.lookupDialog.showModal === "function") {
      elements.lookupDialog.showModal();
    } else {
      elements.lookupDialog.setAttribute("open", "");
    }
    window.requestAnimationFrame(() => elements.lookupInput.focus());
  }

  function closeLookup() {
    if (!elements.lookupDialog.open) return;
    if (typeof elements.lookupDialog.close === "function") {
      elements.lookupDialog.close();
    } else {
      elements.lookupDialog.removeAttribute("open");
    }
  }

  function renderLookupResults() {
    const query = elements.lookupInput.value.trim();
    currentLookupAiEntry = null;
    elements.lookupAiButton.classList.add("hidden");
    elements.lookupAiStatus.textContent = "本地查询不消耗 API";
    if (query.length < 2) {
      elements.lookupMeta.textContent = "输入英文或中文，优先查本地词库";
      elements.lookupResults.innerHTML = "";
      return;
    }

    const localResults = searchLexiconForLookup(query);
    const cached = lookupCache.find((item) =>
      isActivePackItem(item) &&
      String(item.query).trim().toLowerCase() === query.toLowerCase()
    );
    const results = cached && !localResults.some((entry) =>
      normalizeMatchText(entry.term) === normalizeMatchText(cached.entry.term)
    )
      ? [cached.entry, ...localResults]
      : localResults;

    elements.lookupMeta.textContent = results.length
      ? `找到 ${results.length} 个结果`
      : "本地词库未找到";
    elements.lookupResults.innerHTML = results
      .slice(0, 12)
      .map((entry) => renderLookupCard(entry, Boolean(entry.aiLookup)))
      .join("");

    if (!localResults.length) {
      if (isApiReady()) {
        elements.lookupAiButton.classList.remove("hidden");
        elements.lookupAiButton.disabled = false;
      } else {
        elements.lookupAiStatus.textContent = "本地未收录；配置 API 后可进行 AI 查询";
      }
    }
  }

  function searchLexiconForLookup(query) {
    const raw = query.toLowerCase();
    const normalized = normalizeMatchText(query);
    const hasEnglishQuery = Boolean(normalized);
    return LEXICON
      .map((entry) => {
        const term = entry.term.toLowerCase();
        const normalizedTerm = normalizeMatchText(entry.term);
        const aliasHit = (entry.aliases || []).some((alias) =>
          hasEnglishQuery && normalizeMatchText(alias).includes(normalized)
        );
        let score = 99;
        if (term === raw || (hasEnglishQuery && normalizedTerm === normalized)) score = 0;
        else if (term.startsWith(raw) || (hasEnglishQuery && normalizedTerm.startsWith(normalized))) score = 1;
        else if (term.includes(raw) || (hasEnglishQuery && normalizedTerm.includes(normalized))) score = 2;
        else if (entry.zh.includes(query)) score = 3;
        else if (aliasHit) score = 4;
        else if (entry.example.toLowerCase().includes(raw)) score = 5;
        return { entry, score };
      })
      .filter((item) => item.score < 99)
      .sort((left, right) => left.score - right.score || left.entry.term.localeCompare(right.entry.term))
      .slice(0, 20)
      .map((item) => item.entry);
  }

  function renderLookupCard(entry, isAi = false) {
    return `
      <article class="lookup-result">
        <div class="lookup-result-top">
          <h3 class="lookup-result-term">${escapeHtml(entry.term)}</h3>
          <span class="lookup-result-category">
            ${isAi ? "AI · " : ""}${escapeHtml(LEXICON_CATEGORY_LABELS[entry.category] || entry.category)}
          </span>
        </div>
        <p class="lookup-result-zh">${escapeHtml(entry.zh)}</p>
        ${entry.example ? `
          <div class="lookup-result-example-row">
            <p class="lookup-result-example">${escapeHtml(entry.example)}</p>
            <button class="mini-action example-speak" type="button" data-lookup-example-speak="${escapeAttribute(entry.example)}" aria-label="朗读例句" title="朗读例句">
              ${speakerIcon()}
            </button>
          </div>
        ` : ""}
        <div class="lookup-result-actions">
          <button class="lexicon-action" type="button" data-lookup-speak="${escapeAttribute(entry.term)}">朗读</button>
          <button class="lexicon-action" type="button" data-lookup-copy="${escapeAttribute(entry.term)}">复制</button>
          ${isAi ? '<button class="lexicon-action" type="button" data-lookup-save>加入词库</button>' : ""}
        </div>
      </article>
    `;
  }

  async function lookupWithAi() {
    const query = elements.lookupInput.value.trim();
    if (query.length < 2 || !isApiReady()) return;
    elements.lookupAiButton.disabled = true;
    elements.lookupAiButton.textContent = "查询中…";
    elements.lookupAiStatus.textContent = "正在调用已配置的 AI 接口";
    try {
      const content = await requestChatCompletion([
        { role: "system", content: LOOKUP_SYSTEM_PROMPT },
        { role: "user", content: query }
      ], { temperature: 0.3, maxTokens: 600, timeoutMs: 20000 });
      const data = parseModelJson(content);
      const entry = {
        aiLookup: true,
        term: cleanText(data.term),
        category: LEXICON_CATEGORY_LABELS[data.category] ? data.category : "daily",
        kind: /\s|-/.test(cleanText(data.term)) ? "phrase" : "word",
        zh: cleanText(data.zh),
        example: cleanText(data.example),
        exampleZh: cleanText(data.example_zh),
        ipaUs: cleanText(data.ipa_us)
      };
      if (!entry.term || !entry.zh) throw new Error("AI 没有返回有效词条");
      const nextCacheItem = {
        packId: PACK.id,
        query,
        entry,
        createdAt: new Date().toISOString()
      };
      lookupCache = limitActivePackItems([
        nextCacheItem,
        ...lookupCache.filter((item) =>
          !isActivePackItem(item) ||
          String(item.query).trim().toLowerCase() !== query.toLowerCase()
        )
      ], 100);
      localStorage.setItem(STORAGE_KEYS.lookupCache, JSON.stringify(lookupCache));
      currentLookupAiEntry = entry;
      elements.lookupMeta.textContent = "AI 查询结果";
      elements.lookupResults.innerHTML = renderLookupCard(entry, true);
      elements.lookupAiButton.classList.add("hidden");
      elements.lookupAiStatus.textContent = "结果已缓存到当前浏览器";
    } catch (error) {
      console.error(error);
      elements.lookupAiStatus.textContent = error.message || "AI 查询失败";
    } finally {
      elements.lookupAiButton.disabled = false;
      elements.lookupAiButton.textContent = "AI 查询";
    }
  }

  function saveLookupEntryToLexicon(entry) {
    const duplicate = LEXICON.some((item) =>
      item.category === entry.category &&
      normalizeMatchText(item.term) === normalizeMatchText(entry.term)
    );
    if (duplicate) {
      showToast("这个词条已经存在");
      return;
    }
    customLexicon.unshift({
      id: `custom-${createId()}`,
      packId: PACK.id,
      custom: true,
      term: entry.term,
      category: entry.category,
      kind: entry.kind,
      zh: entry.zh,
      example: entry.example,
      aliases: [],
      zhTriggers: [entry.zh]
    });
    persistCustomLexicon();
    rebuildLexicon();
    renderLexiconList();
    showToast("已加入澳洲生活词库");
  }

  function bindLexicon() {
    elements.openLexiconButton.addEventListener("click", openLexicon);
    elements.closeLexiconButton.addEventListener("click", closeLexicon);
    elements.lexiconSearch.addEventListener("input", () => {
      randomLexiconIds = new Set();
      lexiconRenderLimit = 60;
      renderLexiconList();
    });
    elements.lexiconCategories.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lexicon-category]");
      if (!button) return;
      activeLexiconCategory = button.dataset.lexiconCategory;
      randomLexiconIds = new Set();
      lexiconRenderLimit = 60;
      renderLexiconCategories();
      renderLexiconList();
    });
    elements.randomLexiconButton.addEventListener("click", () => {
      const pool = getFilteredLexicon({ includeRandom: false });
      randomLexiconIds = new Set(
        [...pool]
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)
          .map((entry) => entry.term)
      );
      lexiconRenderLimit = 60;
      renderLexiconList();
    });
    elements.practiceLexiconButton.addEventListener("click", practiceSelectedLexicon);
    elements.toggleCustomLexiconButton.addEventListener("click", () => {
      const opening = elements.customLexiconForm.classList.contains("hidden");
      elements.customLexiconForm.classList.toggle("hidden", !opening);
      if (opening) elements.customLexiconTerm.focus();
    });
    elements.customLexiconForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addCustomLexiconEntry();
    });
    elements.lexiconList.addEventListener("click", (event) => {
      const exampleSpeakButton = event.target.closest("[data-lexicon-example-speak]");
      if (exampleSpeakButton) {
        speakText(exampleSpeakButton.dataset.lexiconExampleSpeak);
        return;
      }
      const speakButton = event.target.closest("[data-lexicon-speak]");
      if (speakButton) {
        speakText(speakButton.dataset.lexiconSpeak);
        return;
      }
      const copyButton = event.target.closest("[data-lexicon-copy]");
      if (copyButton) {
        copyText(copyButton.dataset.lexiconCopy);
        return;
      }
      const moreButton = event.target.closest("[data-lexicon-more]");
      if (moreButton) {
        lexiconRenderLimit += 60;
        renderLexiconList();
        return;
      }
      const deleteButton = event.target.closest("[data-lexicon-delete]");
      if (deleteButton) {
        if (deleteButton.dataset.confirm !== "true") {
          deleteButton.dataset.confirm = "true";
          deleteButton.textContent = "确认删除";
          window.setTimeout(() => {
            if (!deleteButton.isConnected) return;
            deleteButton.dataset.confirm = "false";
            deleteButton.textContent = "删除";
          }, 8000);
          return;
        }
        deleteCustomLexiconEntry(deleteButton.dataset.lexiconDelete);
      }
    });
  }

  function bindDrawer() {
    elements.openLibraryButton.addEventListener("click", openLibrary);
    elements.closeLibraryButton.addEventListener("click", closeLibrary);
    elements.drawerBackdrop.addEventListener("click", closeAllDrawers);
    elements.librarySearch.addEventListener("input", renderLibrary);
    elements.exportLibraryButton.addEventListener("click", exportLibrary);
  }

  function openLexicon() {
    closeLibrary();
    renderLexiconCategories();
    renderLexiconList();
    elements.drawerBackdrop.classList.add("open");
    elements.lexiconDrawer.classList.add("open");
    elements.lexiconDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLexicon() {
    elements.lexiconDrawer.classList.remove("open");
    elements.lexiconDrawer.setAttribute("aria-hidden", "true");
    if (!elements.libraryDrawer.classList.contains("open")) {
      elements.drawerBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  function closeAllDrawers() {
    closeLibrary();
    closeLexicon();
  }

  function migrateCustomLexicon() {
    const previous = JSON.stringify(customLexicon);
    customLexicon = asArray(customLexicon)
      .map((entry) => ({
        id: cleanText(entry?.id) || `custom-${createId()}`,
        packId: cleanText(entry?.packId) || LEGACY_PACK_ID,
        custom: true,
        term: cleanText(entry?.term),
        category: LEXICON_CATEGORY_LABELS[entry?.category] ? entry.category : "daily",
        kind: /\s|-/.test(cleanText(entry?.term)) ? "phrase" : "word",
        zh: cleanText(entry?.zh),
        example: cleanText(entry?.example),
        ipa: cleanText(entry?.ipa || entry?.ipaUs),
        pos: asArray(entry?.pos).map(cleanText).filter(Boolean),
        forms: asArray(entry?.forms),
        aliases: asArray(entry?.aliases).map(cleanText).filter(Boolean),
        zhTriggers: asArray(entry?.zhTriggers).map(cleanText).filter(Boolean)
      }))
      .filter((entry) => entry.term && entry.zh);
    if (JSON.stringify(customLexicon) !== previous) persistCustomLexicon();
    rebuildLexicon();
  }

  function rebuildLexicon() {
    LEXICON = [
      ...BUILTIN_LEXICON,
      ...customLexicon
        .filter((entry) => !entry.packId || entry.packId === PACK.id)
        .map(withLexiconMetadata)
    ];
  }

  function withLexiconMetadata(entry) {
    const meta = LEXICON_META[entry?.term] || {};
    return {
      ...entry,
      ipa: cleanText(entry?.ipa) || cleanText(meta.ipa),
      pos: asArray(entry?.pos).length ? asArray(entry.pos) : asArray(meta.pos),
      forms: asArray(entry?.forms).length ? asArray(entry.forms) : asArray(meta.forms)
    };
  }

  function persistCustomLexicon() {
    persistSyncCollection(STORAGE_KEYS.customLexicon, "customLexicon", customLexicon);
  }

  function populateCustomLexiconCategories() {
    elements.customLexiconCategory.innerHTML = Object.entries(LEXICON_CATEGORY_LABELS)
      .map(([key, label]) => `<option value="${key}">${escapeHtml(label)}</option>`)
      .join("");
    elements.customLexiconCategory.value = activeLexiconCategory === "all"
      ? "daily"
      : activeLexiconCategory;
  }

  function addCustomLexiconEntry() {
    const term = cleanText(elements.customLexiconTerm.value);
    const zh = cleanText(elements.customLexiconZh.value);
    const category = elements.customLexiconCategory.value;
    const example = cleanText(elements.customLexiconExample.value);
    if (!term || !zh || !LEXICON_CATEGORY_LABELS[category]) {
      elements.customLexiconStatus.textContent = "英文、中文和分类不能为空";
      return;
    }
    const duplicate = LEXICON.some((entry) =>
      entry.category === category &&
      normalizeMatchText(entry.term) === normalizeMatchText(term)
    );
    if (duplicate) {
      elements.customLexiconStatus.textContent = "这个分类里已经有相同词条";
      return;
    }

    customLexicon.unshift({
      id: `custom-${createId()}`,
      packId: PACK.id,
      custom: true,
      term,
      category,
      kind: /\s|-/.test(term) ? "phrase" : "word",
      zh,
      example,
      aliases: [],
      zhTriggers: [zh]
    });
    persistCustomLexicon();
    rebuildLexicon();
    activeLexiconCategory = category;
    randomLexiconIds = new Set();
    lexiconRenderLimit = 60;
    elements.customLexiconForm.reset();
    elements.customLexiconForm.classList.add("hidden");
    elements.customLexiconStatus.textContent = "保存在当前浏览器";
    renderLexiconCategories();
    renderLexiconList();
    showToast("已新增自定义词条");
  }

  function deleteCustomLexiconEntry(id) {
    const entry = customLexicon.find((item) => item.id === id);
    if (!entry) return;
    customLexicon = customLexicon.filter((item) => item.id !== id);
    persistCustomLexicon();
    rebuildLexicon();
    renderLexiconList();
    showToast("自定义词条已删除");
  }

  function renderLexiconCategories() {
    populateCustomLexiconCategories();
    const categories = [
      ["all", "全部"],
      ...Object.entries(LEXICON_CATEGORY_LABELS)
    ];
    elements.lexiconCategories.innerHTML = categories.map(([key, label]) => `
      <button class="lexicon-category ${activeLexiconCategory === key ? "active" : ""}" type="button" data-lexicon-category="${key}">
        ${escapeHtml(label)}
      </button>
    `).join("");
  }

  function getFilteredLexicon(options = {}) {
    const query = elements.lexiconSearch.value.trim().toLowerCase();
    const includeRandom = options.includeRandom !== false;
    return LEXICON.filter((entry) => {
      if (activeLexiconCategory !== "all" && entry.category !== activeLexiconCategory) return false;
      if (includeRandom && randomLexiconIds.size && !randomLexiconIds.has(entry.term)) return false;
      if (!query) return true;
      return [
        entry.term,
        entry.zh,
        entry.example,
        entry.note,
        entry.ipa,
        ...(entry.pos || []),
        ...(entry.forms || []).flatMap((form) => [form.label, form.value]),
        ...(entry.aliases || []),
        LEXICON_CATEGORY_LABELS[entry.category]
      ].join(" ").toLowerCase().includes(query);
    });
  }

  function renderLexiconList() {
    const entries = getFilteredLexicon();
    const visibleEntries = entries.slice(0, lexiconRenderLimit);
    elements.lexiconCount.textContent = entries.length > visibleEntries.length
      ? `${entries.length} 个词条 · 已显示 ${visibleEntries.length}`
      : `${entries.length} 个词条`;
    elements.practiceLexiconButton.disabled = entries.length === 0;
    if (!entries.length) {
      elements.lexiconList.innerHTML = '<div class="library-empty"><div><span>no match.</span>没有匹配的词条</div></div>';
      return;
    }
    elements.lexiconList.innerHTML = visibleEntries.map((entry) => {
      const meta = [
        entry.ipa ? `<span>${escapeHtml(entry.ipa)}</span>` : "",
        entry.pos?.length ? `<span>${escapeHtml(entry.pos.join(" / "))}</span>` : "",
        entry.forms?.length
          ? `<span>${entry.forms.slice(0, 2).map((form) => `${escapeHtml(form.label)} ${escapeHtml(form.value)}`).join(" · ")}</span>`
          : ""
      ].filter(Boolean).join("");
      return `
        <article class="lexicon-card">
          <div class="lexicon-card-top">
            <div class="lexicon-main">
              <div class="lexicon-title-row">
                <h3 class="lexicon-term">${escapeHtml(entry.term)}</h3>
                <span class="lexicon-tag ${entry.custom ? "custom" : ""}">
                  ${entry.custom ? "自定义 · " : ""}${escapeHtml(LEXICON_CATEGORY_LABELS[entry.category] || entry.category)}
                </span>
              </div>
              ${meta ? `<p class="lexicon-meta">${meta}</p>` : ""}
            </div>
            <div class="lexicon-actions">
              <button class="mini-action" type="button" data-lexicon-speak="${escapeAttribute(entry.term)}" aria-label="朗读" title="朗读">
                ${speakerIcon()}
              </button>
              <button class="mini-action" type="button" data-lexicon-copy="${escapeAttribute(entry.term)}" aria-label="复制" title="复制">
                ${copyIcon()}
              </button>
              ${entry.custom ? `<button class="mini-action lexicon-delete" type="button" data-lexicon-delete="${escapeAttribute(entry.id)}" aria-label="删除自定义词条" title="删除">
                ${trashIcon()}
              </button>` : ""}
            </div>
          </div>
          <p class="lexicon-zh">${escapeHtml(entry.zh)}</p>
          ${entry.example ? `
            <div class="lexicon-example-row">
              <p class="lexicon-example">${escapeHtml(entry.example)}</p>
              <button class="mini-action lexicon-example-speak" type="button" data-lexicon-example-speak="${escapeAttribute(entry.example)}" aria-label="朗读例句" title="朗读例句">
                ${speakerIcon()}
              </button>
            </div>
          ` : ""}
        </article>
      `;
    }).join("") + (entries.length > visibleEntries.length
      ? `<button class="lexicon-load-more" type="button" data-lexicon-more>再显示 60 个</button>`
      : "");
  }

  function practiceSelectedLexicon() {
    const entries = getFilteredLexicon().slice(0, 6);
    if (!entries.length) return;
    const category = activeLexiconCategory === "all" ? entries[0].category : activeLexiconCategory;
    const scene = LEXICON_SCENE_MAP[category] || "social";
    const terms = entries.map((entry) => entry.term);
    closeLexicon();
    setActiveScene(scene);
    renderTasks();
    generateTaskSet(scene, terms);
    document.querySelector("#sceneTabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindLibrary() {
    elements.libraryList.addEventListener("click", (event) => {
      const speakButton = event.target.closest("[data-library-speak]");
      if (speakButton) {
        speakText(speakButton.dataset.librarySpeak);
        return;
      }
      const reviewButton = event.target.closest("[data-review-id]");
      if (reviewButton) {
        const entry = getActivePackEntries()
          .find((item) => item.id === reviewButton.dataset.reviewId);
        if (entry) openSavedEntry(entry, true);
        return;
      }

      const entryButton = event.target.closest("[data-entry-id]");
      if (!entryButton) return;
      const entry = getActivePackEntries()
        .find((item) => item.id === entryButton.dataset.entryId);
      if (!entry) return;
      openSavedEntry(entry, false);
    });
  }

  function openSavedEntry(entry, focusPractice) {
    currentEntryId = entry.id;
    currentInput = entry.input;
    currentResult = enrichResultWithLexicon(entry.result);
    activeTask = normalizeStoredTask(entry.task);
    currentGaps = new Set();
    elements.sourceInput.value = entry.input;
    updateCharacterCount();
    updateComposerTaskContext();
    if (activeTask) setActiveScene(activeTask.scene);
    showState("content");
    renderResult(currentResult, { demo: false });
    closeLibrary();
    scrollToResult();

    if (focusPractice) {
      window.requestAnimationFrame(() => {
        document.querySelector("#practiceStudio")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  function buildTaskSets() {
    SCENE_ORDER.forEach((scene) => {
      taskSets[scene] = pickTasks(scene);
    });
  }

  function pickTasks(scene, excludedIds = []) {
    const pool = TASKS.filter((task) => task.scene === scene);
    const combinations = pool.flatMap((task) => TASK_CONTEXTS.map((context) => ({
      ...task,
      id: `${task.id}--${context.id}`,
      baseTaskId: task.id,
      contextId: context.id,
      contextLabel: context.label,
      title: `${context.label} · ${task.title}`,
      prompt: `${context.lead}${task.prompt}`,
      twist: context.label,
      skill: TASK_SKILLS[(TASKS.indexOf(task) + TASK_CONTEXTS.indexOf(context)) % TASK_SKILLS.length],
      confirm: DEFAULT_CONFIRM
    })))
      .filter((task) => !excludedIds.includes(task.id));
    return combinations
      .map((task) => ({ task, order: Math.random() }))
      .sort((left, right) => left.order - right.order)
      .slice(0, 3)
      .map(({ task }) => task);
  }

  function getTaskById(taskId) {
    return activeTask?.id === taskId
      ? activeTask
      : TASKS.find((task) => task.id === taskId) ||
        Object.values(taskSets).flat().find((task) => task.id === taskId);
  }

  async function generateTaskSet(scene, focusTerms = []) {
    const currentIds = (taskSets[scene] || []).map((task) => task.id);
    const localFallback = pickTasks(scene, currentIds);

    if (!isApiReady()) {
      document.documentElement.dataset.taskGeneration = "local-no-api";
      taskSets[scene] = localFallback;
      if (activeScene === scene) renderTasks();
      showToast("已换 3 个本地任务");
      return;
    }

    taskGenerating = true;
    document.documentElement.dataset.taskGeneration = "loading";
    elements.shuffleTasksButton.disabled = true;
    elements.shuffleTasksButton.textContent = "生成中…";
    if (activeScene === scene) renderTaskLoading();

    try {
      const currentTitles = (taskSets[scene] || []).map((task) => task.title);
      const content = await requestChatCompletion([
        { role: "system", content: TASK_GENERATOR_PROMPT },
        {
          role: "user",
          content: [
            `场景：${SCENE_LABELS[scene]}`,
            `可用范围：${SCENE_GENERATION_BRIEF[scene]}`,
            focusTerms.length ? `尽量自然融入这些词：${focusTerms.join("、")}` : "",
            `不要重复：${currentTitles.join("；") || "无"}`,
            "生成 3 个难度递进的任务，三项技能和三个突发变量都不能重复。"
          ].filter(Boolean).join("\n")
        }
      ], { temperature: 0.85, maxTokens: 1200, timeoutMs: 20000 });
      const generated = normalizeGeneratedTasks(parseModelJson(content), scene);
      taskSets[scene] = fillTasks(generated, localFallback);
      document.documentElement.dataset.taskGeneration = "api";
      if (activeScene === scene) renderTasks();
      showToast("已生成 3 个新任务");
    } catch (error) {
      console.error(error);
      document.documentElement.dataset.taskGeneration = `fallback:${error.message || String(error)}`;
      taskSets[scene] = localFallback;
      if (activeScene === scene) renderTasks();
      showToast("新任务生成失败，已换成本地任务");
    } finally {
      taskGenerating = false;
      elements.shuffleTasksButton.disabled = false;
      elements.shuffleTasksButton.textContent = "换一组任务 →";
    }
  }

  function normalizeGeneratedTasks(data, scene) {
    const usedTwists = new Set();
    return asArray(data?.tasks || data)
      .map((task, index) => {
        const requestedTwist = cleanText(task?.twist || task?.variable || task?.unexpectedVariable);
        const twist = requestedTwist && !usedTwists.has(requestedTwist)
          ? requestedTwist
          : TASK_TWISTS.find((item) => !usedTwists.has(item)) || TASK_TWISTS[index] || "临时变化";
        usedTwists.add(twist);
        return {
          id: `ai-${scene}-${Date.now()}-${index}`,
          scene,
          title: cleanText(task?.title),
          prompt: cleanText(task?.prompt || task?.scenario || task?.question),
          skill: normalizeTaskSkill(task?.skill || task?.focus, index),
          twist,
          opening: cleanText(
            task?.counterpart || task?.opening || task?.openingLine ||
            task?.counterpartLine || task?.theySay
          ),
          openingZh: cleanText(
            task?.counterpartZh || task?.openingZh || task?.openingLineZh ||
            task?.counterpartLineZh
          ),
          replyBrief: cleanText(task?.replyBrief || task?.replyGoal || task?.goal),
          followUp: cleanText(task?.followUp || task?.follow_up || task?.reply),
          followUpZh: cleanText(task?.followUpZh || task?.follow_up_zh),
          repair: cleanText(task?.repair || task?.rescue) || DEFAULT_REPAIR,
          confirm: cleanText(task?.confirm || task?.checkPhrase || task?.confirmation) || DEFAULT_CONFIRM
        };
      })
      .filter((task) => task.title && task.prompt && task.followUp)
      .slice(0, 3);
  }

  function normalizeTaskSkill(value, index = 0) {
    const raw = cleanText(value).toLowerCase();
    if (/clarify|confirm|异议|确认/.test(raw)) return "clarify";
    if (/follow|reply|追问|应对/.test(raw)) return "follow_up";
    if (/open|start|开口|开启/.test(raw)) return "open";
    return TASK_SKILLS[index] || "open";
  }

  function fillTasks(generated, fallback) {
    const result = [...generated];
    const seen = new Set(result.map((task) => task.title));
    for (const task of fallback) {
      if (result.length >= 3) break;
      if (seen.has(task.title)) continue;
      result.push(task);
      seen.add(task.title);
    }
    return result.slice(0, 3);
  }

  function renderTaskLoading() {
    elements.taskGrid.innerHTML = `
      <div class="task-loading" aria-live="polite">
        <span></span><span></span><span></span>
        <p>正在生成新的 3 个任务…</p>
      </div>
    `;
  }

  function renderTasks() {
    const picked = taskSets[activeScene] || pickTasks(activeScene);
    const tasks = [...picked];
    if (activeTask?.scene === activeScene && !tasks.some((task) => task.id === activeTask.id)) {
      tasks.splice(tasks.length - 1, 1, activeTask);
    }
    elements.taskGrid.innerHTML = tasks.map((task, index) => `
      <button class="task-card ${activeTask?.id === task.id ? "active" : ""}" type="button" data-task-id="${escapeAttribute(task.id)}">
        <span class="task-card-top">
          <span class="task-card-meta">
            <span class="task-scene">${escapeHtml(SCENE_LABELS[task.scene])}</span>
            ${task.twist ? `<span class="task-twist">${escapeHtml(task.twist)}</span>` : ""}
          </span>
          <span class="task-number">0${index + 1}</span>
        </span>
        <span>
          <span class="task-card-title">${escapeHtml(task.title)}</span>
          <span class="task-card-copy">${escapeHtml(task.prompt)}</span>
        </span>
        <span class="task-card-bottom">
          <span class="task-task-duration">${escapeHtml(TASK_SKILL_LABELS[task.skill] || "真实对话")}</span>
          <span class="task-start">${activeTask?.id === task.id ? "继续练习" : "开始练习"} →</span>
        </span>
      </button>
    `).join("");
  }

  function startTask(task) {
    activeTask = task;
    setActiveScene(task.scene);
    activeTone = task.scene === "work" ? "work" : task.scene === "travel" ? "concise" : "natural";
    currentInput = task.prompt;
    currentResult = null;
    currentEntryId = "";
    currentGaps = new Set();
    elements.sourceInput.value = task.prompt;
    updateCharacterCount();
    updateComposerTaskContext();
    updateToneSelection();
    renderTasks();
    showState("empty");
    elements.sourceInput.focus();
    window.scrollTo({ top: elements.sourceInput.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    showToast(`已选择：${task.title}`);
  }

  function setActiveScene(scene) {
    activeScene = SCENE_LABELS[scene] ? scene : "hospitality";
    elements.sceneTabs.querySelectorAll("[data-scene]").forEach((button) => {
      const isActive = button.dataset.scene === activeScene;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function clearActiveTask(options = {}) {
    activeTask = null;
    updateComposerTaskContext();
    renderTasks();
    if (options.resetInput) {
      elements.sourceInput.value = "";
      currentInput = "";
      currentResult = null;
      currentEntryId = "";
      currentGaps = new Set();
      updateCharacterCount();
      showState("empty");
    }
  }

  function updateComposerTaskContext() {
    if (activeTask) {
      elements.activeTaskKicker.textContent = SCENE_LABELS[activeTask.scene] || "练习任务";
      elements.activeTaskKicker.classList.remove("hidden");
      elements.composerTitle.textContent = activeTask.title;
      elements.clearTaskButton.classList.remove("hidden");
      return;
    }
    elements.activeTaskKicker.textContent = "";
    elements.activeTaskKicker.classList.add("hidden");
    elements.composerTitle.textContent = "自由输入";
    elements.clearTaskButton.classList.add("hidden");
  }

  function updateToneSelection() {
    elements.toneOptions.querySelectorAll("[data-tone]").forEach((button) => {
      button.classList.toggle("active", button.dataset.tone === activeTone);
    });
  }

  function normalizeStoredTask(task) {
    if (!task?.id || !task?.title) return null;
    return {
      id: task.id,
      scene: task.scene || "life",
      title: task.title,
      prompt: task.prompt || "",
      skill: normalizeTaskSkill(task.skill),
      twist: cleanText(task.twist),
      opening: task.opening || "",
      openingZh: task.openingZh || "",
      replyBrief: task.replyBrief || "",
      followUp: task.followUp || "",
      followUpZh: task.followUpZh || "",
      repair: task.repair || DEFAULT_REPAIR,
      confirm: task.confirm || DEFAULT_CONFIRM
    };
  }


  function updateCharacterCount() {
    const length = elements.sourceInput.value.length;
    elements.charCount.textContent = `${length} / 1000`;
    if (elements.clearInputButton) {
      elements.clearInputButton.classList.toggle("hidden", length === 0);
    }
  }

  function clearSourceInput() {
    if (!elements.sourceInput.value) return;
    elements.sourceInput.value = "";
    updateCharacterCount();
    elements.sourceInput.focus();
  }

  function refreshPrompt() {
    let nextIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
    if (RANDOM_PROMPTS.length > 1) {
      while (nextIndex === promptIndex) {
        nextIndex = Math.floor(Math.random() * RANDOM_PROMPTS.length);
      }
    }
    promptIndex = nextIndex;
    activeTask = null;
    elements.sourceInput.value = RANDOM_PROMPTS[promptIndex];
    currentInput = "";
    currentResult = null;
    currentEntryId = "";
    currentGaps = new Set();
    updateComposerTaskContext();
    renderTasks();
    updateCharacterCount();
    showState("empty");
    elements.sourceInput.focus();
  }

  function generateFromInput() {
    const input = elements.sourceInput.value.trim();
    if (!input) {
      showToast("先写下一句你想说的话");
      elements.sourceInput.focus();
      return;
    }

    currentInput = input;
    currentResult = null;
    currentEntryId = "";
    currentGaps = new Set();

    if (!isApiReady()) {
      openSettingsForManual(input);
      return;
    }

    requestAiResult(input).catch((error) => {
      console.error(error);
      showError(error.message || "接口请求失败，请检查设置。");
    });
  }

  async function requestAiResult(input) {
    showState("loading");
    elements.generateButton.disabled = true;
    elements.generateButton.querySelector("span:first-child").textContent = "正在组织表达…";
    const startedAt = performance.now();

    try {
      const requestStartedAt = performance.now();
      const content = await requestChatCompletion([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input, activeTone) }
      ], { temperature: 0.35, maxTokens: 2200, timeoutMs: 60000 });
      const requestMs = Math.round(performance.now() - requestStartedAt);
      const renderStartedAt = performance.now();
      const parsed = parseModelJson(content);
      currentResult = normalizeModelData(parsed, input);
      showState("content");
      renderResult(currentResult, { demo: false });
      scrollToResult();
      const timing = {
        requestMs,
        renderMs: Math.round(performance.now() - renderStartedAt),
        totalMs: Math.round(performance.now() - startedAt),
        responseChars: content.length,
        model: settings.model
      };
      window.SAYFLOW_LAST_GENERATION = timing;
      console.info(
        `[SayFlow] 地道表达 ${timing.totalMs}ms（模型 ${timing.requestMs}ms，渲染 ${timing.renderMs}ms，返回 ${timing.responseChars} 字符）`
      );
    } finally {
      elements.generateButton.disabled = false;
      elements.generateButton.querySelector("span:first-child").textContent = "生成地道表达";
    }
  }

  async function requestChatCompletion(messages, options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || 60000);
    try {
      const requestBody = {
        model: settings.model,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens || 2400,
        messages
      };
      if (/deepseek/i.test(settings.endpoint) || /deepseek/i.test(settings.model)) {
        requestBody.thinking = { type: "disabled" };
        requestBody.reasoning_effort = "none";
        requestBody.response_format = { type: "json_object" };
      }
      const response = await fetch(buildChatEndpoint(settings.endpoint), {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(readApiError(response.status, body));
      }

      const payload = await response.json();
      const choice = payload?.choices?.[0];
      const content = extractMessageContent(choice?.message?.content) ||
        extractMessageContent(choice?.text);
      if (content) return content;

      if (choice?.finish_reason === "length") {
        throw new Error("模型输出达到长度上限，没有留下最终 JSON。请重试，或把模型名称切换为非推理版本。");
      }
      if (extractMessageContent(choice?.message?.reasoning_content)) {
        throw new Error("模型只返回了推理内容，没有返回最终 JSON。请重试，或把模型切换为非推理版本。");
      }
      throw new Error("接口返回成功，但 choices 中没有可读取的正文。请检查接口是否为兼容 Chat Completions 的服务。");
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("接口超过 60 秒仍未返回，请稍后重试或更换更快的模型。");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function extractMessageContent(content) {
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((part) => typeof part === "string" ? part : part?.text || part?.content || "")
        .join("")
        .trim();
    }
    if (content && typeof content === "object") {
      return cleanText(content.text || content.content);
    }
    return "";
  }

  function buildChatEndpoint(endpoint) {
    const clean = endpoint.trim().replace(/\/+$/, "");
    if (clean.endsWith("/chat/completions")) return clean;
    return `${clean}/chat/completions`;
  }

  function buildHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
    return headers;
  }

  function buildUserPrompt(input, tone) {
    return [
      `本次希望的语气：${TONE_LABELS[tone] || "自然口语"}`,
      `优先音标：${settings.accent === "uk" ? "英音 UK" : "美音 US"}`,
      activeTask ? `任务场景：${SCENE_LABELS[activeTask.scene]} / ${activeTask.title}` : "使用方式：自由输入",
      activeTask?.opening ? `对方先开口：${activeTask.opening}` : "",
      activeTask?.replyBrief ? `这一轮回复目标：${activeTask.replyBrief}` : "",
      activeTask ? `说话后对方可能追问：${activeTask.followUp}` : "",
      "",
      "用户原句：",
      input
    ].filter((line) => line !== "").join("\n");
  }

  function buildManualPrompt(input, tone) {
    return [
      SYSTEM_PROMPT,
      "",
      "---",
      buildUserPrompt(input, tone)
    ].join("\n");
  }

  function readApiError(status, body) {
    let detail = "";
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.error?.message || parsed?.message || "";
    } catch {
      detail = body.slice(0, 180);
    }
    return `接口返回 ${status}${detail ? `：${detail}` : "，请检查地址、密钥和模型名。"}`;
  }

  function parseModelJson(rawContent) {
    let content = rawContent;
    if (Array.isArray(content)) {
      content = content.map((part) => part?.text || part?.content || "").join("");
    }
    content = String(content || "").trim();
    content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("没有识别到 JSON。请确认复制了 AI 返回的完整 JSON 对象。");
    }

    try {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1));
    } catch {
      throw new Error("返回内容的 JSON 格式不完整，请重新复制整段结果。");
    }
  }

  function normalizeModelData(data, input) {
    const versions = asArray(data.natural_versions || data.versions || data.natural_version)
      .slice(0, 1)
      .map((version) => {
        if (typeof version === "string") {
          return { style: "natural", text: version };
        }
        return {
          style: cleanText(version?.style) || "natural",
          text: cleanText(version?.text || version?.english || version?.sentence)
        };
      })
      .filter((version) => version.text);

    if (!versions.length) {
      throw new Error("结果中缺少地道表达。请确认 AI 按页面提供的 JSON 结构返回。");
    }

    const normalizedItems = [
      ...asArray(data.key_words).map((item) => normalizeLearningItemData(item, "word")),
      ...asArray(data.key_phrases || data.phrases).map((item) => normalizeLearningItemData(item, "phrase")),
      ...asArray(data.learning_items).map((item) => normalizeLearningItemData(item)),
      ...asArray(data.items).map((item) => normalizeLearningItemData(item))
    ].filter((item) => item.text && isAdvancedLearningItem(item));

    const seenItems = new Set();
    const items = normalizedItems
      .filter((item) => {
        const key = `${item.type}:${item.text.toLowerCase()}`;
        if (seenItems.has(key)) return false;
        seenItems.add(key);
        return true;
      })
      .sort((left, right) => (left.type === right.type ? 0 : left.type === "word" ? -1 : 1));
    const practicalItems = items.slice(0, 3);
    let expressionChunks = normalizeExpressionChunks(
      data.useful_chunks || data.expression_chunks || data.chunks
    );
    if (!expressionChunks.length) {
      expressionChunks = normalizedItems
        .filter((item) => item.type === "phrase")
        .slice(0, 4)
        .map((item) => ({
          type: "可复用表达",
          text: item.text,
          meaning: item.meaning,
          example: item.examples[0]?.en || ""
        }));
    }

    return enrichResultWithLexicon({
      original: cleanText(data.original) || input,
      intent: cleanText(data.intent || data.meaning),
      naturalVersions: versions,
      expressionChunks,
      learningItems: practicalItems,
      practicePrompts: asArray(data.practice_prompts || data.practice)
        .map(cleanText)
        .filter(Boolean)
        .slice(0, 2)
    });
  }

  function normalizeExpressionChunks(chunks) {
    const seen = new Set();
    return asArray(chunks)
      .map((chunk) => {
        if (typeof chunk === "string") {
          return { type: "可复用表达", text: chunk, meaning: "", example: "" };
        }
        const example = chunk?.example;
        return {
          type: cleanText(chunk?.type || chunk?.category) || "可复用表达",
          text: cleanText(chunk?.chunk || chunk?.text || chunk?.expression),
          meaning: cleanText(chunk?.meaning || chunk?.usage || chunk?.when_to_use),
          example: typeof example === "string"
            ? cleanText(example)
            : cleanText(example?.en || example?.english || example?.text)
        };
      })
      .filter((chunk) => {
        if (!chunk.text) return false;
        const key = chunk.text.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }

  function enrichResultWithLexicon(result) {
    if (!LEXICON.length || !result?.naturalVersions?.length) return result;
    const sourceText = [
      result.original,
      ...result.naturalVersions.map((version) => version.text)
    ].join(" ");
    const matched = findLexiconMatches(sourceText);
    if (!matched.length) return result;

    const seen = new Set(
      (result.learningItems || []).map((item) => normalizeMatchText(item.text).replace(/\s+/g, ""))
    );
    const localItems = [];
    for (const entry of matched) {
      const key = normalizeMatchText(entry.term).replace(/\s+/g, "");
      if (seen.has(key)) continue;
      seen.add(key);
      localItems.push({
        type: entry.kind === "word" || entry.kind === "place" ? "word" :
          entry.kind === "collocation" ? "collocation" :
            entry.kind === "idiom" ? "idiom" : "phrase",
        text: entry.term,
        level: "常用",
        ipa: "",
        ipaUs: entry.ipaUs || "",
        ipaUk: "",
        meaning: entry.zh,
        memoryMethod: "",
        memoryTrick: entry.note || "",
        forms: entry.aliases?.length
          ? [{ label: "常见变体", value: entry.aliases.join(" / ") }]
          : [],
        examples: entry.example ? [{ en: entry.example, zh: "" }] : [],
        senses: entry.kind === "word" || entry.kind === "place"
          ? [{
              pos: "",
              zh: entry.zh,
              examples: entry.example ? [{ en: entry.example, zh: "" }] : [],
              inContext: true
            }]
          : []
      });
    }

    return {
      ...result,
      learningItems: [...(result.learningItems || []), ...localItems].slice(0, 5)
    };
  }

  function isHighValueLexiconEntry(entry) {
    const kind = cleanText(entry?.kind).toLowerCase();
    const term = normalizeMatchText(entry?.term);
    if (!term || kind === "place" || kind === "menu") return false;
    if (kind === "idiom" || kind === "collocation") {
      return !BASIC_LEARNING_PHRASES.has(term);
    }
    if (BASIC_LEARNING_PHRASES.has(term)) return false;
    if (term.includes(" ")) {
      return COMMON_HIGH_VALUE_WORDS.has(term) ||
        HIGH_VALUE_WHV_TERMS.has(term) ||
        (term.split(" ").length >= 2 && term.length >= 14);
    }
    if (isBasicLearningWord(term)) return false;
    return COMMON_HIGH_VALUE_WORDS.has(term) ||
      HIGH_VALUE_WHV_TERMS.has(term) ||
      term.length >= 7;
  }

  function isBasicLearningWord(text) {
    const term = normalizeMatchText(text);
    if (!term) return false;
    const candidates = new Set([term]);
    if (term.endsWith("ies") && term.length > 4) candidates.add(`${term.slice(0, -3)}y`);
    if (term.endsWith("es") && term.length > 3) candidates.add(term.slice(0, -2));
    if (term.endsWith("s") && term.length > 2) candidates.add(term.slice(0, -1));
    if (term.endsWith("ed") && term.length > 3) {
      candidates.add(term.slice(0, -2));
      candidates.add(term.slice(0, -1));
    }
    if (term.endsWith("ing") && term.length > 4) {
      candidates.add(term.slice(0, -3));
      candidates.add(`${term.slice(0, -3)}e`);
    }
    return [...candidates].some((candidate) => BASIC_LEARNING_WORDS.has(candidate));
  }

  function findLexiconMatches(text) {
    const haystack = ` ${normalizeMatchText(text)} `;
    const rawText = String(text || "").toLowerCase();
    const ambiguous = new Set(["flat", "main", "side", "special", "fee", "interest"]);
    return LEXICON
      .filter((entry) => !ambiguous.has(entry.term.toLowerCase()))
      .filter(isHighValueLexiconEntry)
      .filter((entry) => {
        const keys = [entry.term, ...(entry.aliases || [])]
          .map(normalizeMatchText)
          .filter(Boolean)
          .sort((left, right) => right.length - left.length);
        return keys.some((key) => haystack.includes(` ${key} `)) ||
          (entry.zhTriggers || []).some((trigger) => rawText.includes(trigger.toLowerCase()));
      })
      .sort((left, right) => right.term.length - left.term.length);
  }

  function normalizeMatchText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeLearningItemData(item, forcedType = "") {
    const sourceType = cleanText(item?.type).toLowerCase();
    const type = forcedType || (/(phrase|collocation|pattern|idiom)/.test(sourceType) ? "phrase" : "word");
    const meaning = cleanText(item?.meaning || item?.meaning_in_context || item?.definition);
    const examples = normalizeExamples(item?.examples);
    return {
      type,
      text: cleanText(item?.word || item?.phrase || item?.text),
      level: cleanText(item?.level || item?.exam_level),
      ipa: cleanText(item?.ipa || item?.phonetic),
      ipaUs: cleanText(item?.ipa_us || item?.ipaUs || item?.phonetic_us),
      ipaUk: cleanText(item?.ipa_uk || item?.ipaUk || item?.phonetic_uk),
      meaning,
      memoryMethod: cleanText(item?.memory_method || item?.memoryMethod || item?.mnemonic_type).toLowerCase(),
      memoryTrick: cleanText(item?.memory_trick || item?.memoryTrick || item?.mnemonic),
      homophoneTrick: cleanText(item?.homophone_trick || item?.homophoneTrick || item?.sound_trick),
      forms: normalizeForms(
        item?.phrase_variations || item?.variations || item?.patterns || item?.collocations ||
        item?.word_family || item?.forms || item?.word_forms
      ),
      examples,
      senses: type === "word" ? normalizeWordSenses(item, examples, meaning) : []
    };
  }

  function normalizeWordSenses(item, fallbackExamples = [], currentMeaning = "") {
    const rawSenses = item?.senses || item?.meanings || item?.definitions || item?.all_meanings;
    const senses = asArray(rawSenses)
      .map((sense, index) => {
        if (typeof sense === "string") {
          return {
            pos: "",
            zh: cleanText(sense),
            examples: [],
            inContext: false
          };
        }
        const ownExamples = normalizeExamples(
          sense?.examples ||
          [sense?.example, sense?.example_zh ? { en: sense?.example, zh: sense.example_zh } : ""]
        );
        const examples = ownExamples.length
          ? ownExamples
          : fallbackExamples[index] ? [fallbackExamples[index]] : [];
        return {
          pos: normalizePartOfSpeech(sense?.pos || sense?.part_of_speech || sense?.type),
          zh: cleanText(sense?.zh || sense?.meaning || sense?.definition || sense?.translation),
          examples,
          inContext: sense?.in_context === true || sense?.inContext === true ||
            sense?.context === true || sense?.current_context === true
        };
      })
      .filter((sense) => sense.zh)
      .slice(0, 8);

    if (!senses.length && currentMeaning) {
      senses.push({
        pos: "",
        zh: currentMeaning,
        examples: fallbackExamples.slice(0, 3),
        inContext: true
      });
    }
    if (!senses.length) return [];

    let contextIndex = senses.findIndex((sense) => sense.inContext);
    if (contextIndex === -1 && currentMeaning) {
      contextIndex = senses.findIndex((sense) =>
        sense.zh.includes(currentMeaning) || currentMeaning.includes(sense.zh)
      );
    }
    if (contextIndex === -1) contextIndex = 0;
    return senses.map((sense, index) => ({
      ...sense,
      inContext: index === contextIndex
    }));
  }

  function isAdvancedLearningItem(item) {
    if (!item?.text) return false;
    const level = String(item.level || "").toLowerCase();
    if (item.type === "word") {
      const text = item.text
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text || /\s/.test(text)) return false;
      if (isBasicLearningWord(text)) return false;
      if (!level) return COMMON_HIGH_VALUE_WORDS.has(text);
      if (/(a1|a2|cet[-\s]?3|basic|初学|基础)/i.test(level)) return false;
      // CET-4/6 remain compatible with cards saved before the CEFR rule changed.
      return /(b1|b2|c1|c2|cet[-\s]?4|cet[-\s]?6|four|six|四级|六级)/i.test(level);
    }

    if (item.type === "phrase") {
      const parts = item.text.trim().split(/\s+/);
      if (parts.length < 2 || item.text.length > 80) return false;
      if (/(a1|cet[-\s]?3|basic|初学|基础)/i.test(level)) return false;
      return !level || /(a2|b1|b2|c1|c2|cet[-\s]?4|cet[-\s]?6|four|six|四级|六级)/i.test(level);
    }

    return false;
  }

  function normalizePartOfSpeech(value) {
    const raw = cleanText(value);
    if (!raw) return "";
    const direct = POS_ABBREVIATIONS[raw.toLowerCase().replace(/[.。]/g, "").trim()];
    if (direct) return direct;
    const parts = raw
      .split(/\s*(?:\/|,|，|、|;|；|\+|\band\b)\s*/i)
      .map((part) => part.toLowerCase().replace(/[.。]/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const mapped = parts.map((part) => POS_ABBREVIATIONS[part]).filter(Boolean);
    return mapped.length && mapped.length === parts.length
      ? [...new Set(mapped)].join(" / ")
      : "";
  }

  function normalizeForms(forms) {
    const usableFamilyLabels = /名词|动词|形容词|副词|反义词|近义词|词根|派生|常见变形|常见搭配|相关表达|替换表达|反义表达|适用句型|用法|noun|verb|adjective|adverb|antonym|synonym|root|derivative|variation|collocation|expression|pattern/i;
    if (Array.isArray(forms)) {
      return forms
        .map((form) => {
          if (typeof form === "string") return { label: "派生词", value: form };
          const label = cleanText(form?.label || form?.name || form?.type);
          const normalizedLabel = normalizePartOfSpeech(label) ||
            (usableFamilyLabels.test(label) ? label : "");
          return {
            label: normalizedLabel,
            value: cleanText(form?.value || form?.form || form?.word)
          };
        })
        .filter((form) => form.label && form.value)
        .slice(0, 8);
    }

    if (forms && typeof forms === "object") {
      return Object.entries(forms)
        .map(([label, value]) => {
          const cleanLabel = cleanText(label);
          return {
            label: normalizePartOfSpeech(cleanLabel) ||
              (usableFamilyLabels.test(cleanLabel) ? cleanLabel : ""),
            value: cleanText(value)
          };
        })
        .filter((form) => form.label && form.value)
        .slice(0, 8);
    }

    return [];
  }

  function normalizeExamples(examples) {
    return asArray(examples)
      .map((example) => {
        if (typeof example === "string") return { en: example, zh: "" };
        return {
          en: cleanText(example?.en || example?.english || example?.sentence),
          zh: cleanText(example?.zh || example?.chinese || example?.translation)
        };
      })
      .filter((example) => example.en)
      .slice(0, 3);
  }

  function renderResult(result, options = {}) {
    currentResult = result;
    const versionHtml = result.naturalVersions.map((version) => `
      <article class="version-card">
        <div class="version-top">
          <span class="version-style">${escapeHtml(STYLE_LABELS[version.style] || version.style || "自然表达")}</span>
          <div class="version-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(version.text)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(version.text)}" aria-label="朗读地道表达">
              ${speakerIcon()}
            </button>
            <button class="mini-action" type="button" data-copy="${escapeAttribute(version.text)}" aria-label="复制地道表达">
              ${copyIcon()}
            </button>
          </div>
        </div>
        <p class="version-text">${escapeHtml(version.text)}</p>
      </article>
    `).join("");
    const expressionChunks = normalizeExpressionChunks(result.expressionChunks);
    const fallbackChunks = result.learningItems
      .filter((item) => item.type === "phrase")
      .map((item) => ({
        type: "可复用表达",
        text: item.text,
        meaning: item.meaning,
        example: item.examples?.[0]?.en || ""
      }));
    const visibleChunks = expressionChunks.length ? expressionChunks : fallbackChunks;
    const chunksHtml = visibleChunks.map((chunk) => `
      <article class="chunk-card">
        <div class="chunk-top">
          <span class="chunk-type">${escapeHtml(chunk.type)}</span>
          <div class="chunk-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(chunk.text)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" aria-label="加入词库" title="加入词库"
              data-save-term="${escapeAttribute(chunk.text)}"
              data-save-meaning="${escapeAttribute(chunk.meaning || "")}"
              data-save-example="${escapeAttribute(chunk.example || "")}">
              ${lexiconIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(chunk.text)}" aria-label="朗读语块">
              ${speakerIcon()}
            </button>
            <button class="mini-action" type="button" data-copy="${escapeAttribute(chunk.text)}" aria-label="复制语块">
              ${copyIcon()}
            </button>
          </div>
        </div>
        <strong class="chunk-text">${escapeHtml(chunk.text)}</strong>
        ${chunk.meaning ? `<p class="chunk-meaning">${escapeHtml(chunk.meaning)}</p>` : ""}
        ${chunk.example ? `
          <div class="chunk-example-row">
            <p class="chunk-example">${escapeHtml(chunk.example)}</p>
            ${exampleSpeakButton(chunk.example)}
          </div>
        ` : ""}
      </article>
    `).join("");

    const wordsHtml = result.learningItems
      .filter((item) => item.type === "word")
      .map((item) => renderLearningItem(item))
      .join("");
    const phrasesHtml = result.learningItems
      .filter((item) => item.type !== "word")
      .map((item) => renderLearningItem(item))
      .join("");
    const practiceHtml = result.practicePrompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");
    const activeEntries = getActivePackEntries();
    const isSaved = Boolean(currentEntryId &&
      activeEntries.some((entry) => entry.id === currentEntryId));
    const savedEntry = activeEntries.find((entry) => entry.id === currentEntryId);
    const currentTask = activeTask || {
      scene: "",
      title: "自由输入",
      skill: "open",
      twist: "",
      opening: "",
      openingZh: "",
      replyBrief: "",
      followUp: "Could you tell me a bit more about what you need?",
      followUpZh: "对方可能会追问更多背景、时间、数量或原因。",
      repair: DEFAULT_REPAIR,
      confirm: DEFAULT_CONFIRM
    };
    const practiceStatus = savedEntry?.review
      ? `第 ${Math.max(1, savedEntry.review.stage + 1)} 次复习`
      : "第一次练习";
    const completedToday = isTaskCompletedToday(currentTask.id || "custom", currentInput);
    const supportText = result.naturalVersions[0]?.text || "";
    elements.resultContent.innerHTML = `
      <div class="result-toolbar">
        <span class="mission-context">${escapeHtml(SCENE_LABELS[currentTask.scene] || "自由输入")}${currentTask.scene ? ` · ${escapeHtml(currentTask.title)}` : ""}</span>
        <button class="save-button ${isSaved ? "saved" : ""}" type="button" data-action="save">
          ${isSaved ? "已收藏" : "收进表达库"}
        </button>
      </div>

      <p class="section-label">地道表达</p>
      ${versionHtml}

      ${chunksHtml ? `
        <p class="section-label">能直接使用的语块</p>
        <div class="chunk-grid">${chunksHtml}</div>
      ` : ""}

      <p class="section-label">对话演练</p>
      <div class="coach-panel">
        <article class="coach-card counterpart">
          <p class="coach-label">对方先开口</p>
          ${currentTask.opening ? `
            <p class="coach-text">${escapeHtml(currentTask.opening)}</p>
            ${currentTask.openingZh ? `<p class="coach-translation">${escapeHtml(currentTask.openingZh)}</p>` : ""}
            <div class="coach-actions">
              <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(currentTask.opening)}" aria-label="收藏到表达库" title="收藏到表达库">
                ${bookmarkIcon()}
              </button>
              <button class="mini-action" type="button" data-speak="${escapeAttribute(currentTask.opening)}" aria-label="朗读对方开场">
                ${speakerIcon()}
              </button>
            </div>
          ` : `
            <p class="coach-text coach-cue">这题由你先开口。</p>
            <p class="coach-translation">${escapeHtml(currentTask.replyBrief || currentTask.prompt || "先说明来意，再把时间、数量或下一步说清楚。")}</p>
          `}
        </article>
        <article class="coach-card reply-example">
          <p class="coach-label">你先这样回</p>
          <p class="coach-text">${escapeHtml(supportText)}</p>
          ${currentTask.replyBrief ? `<p class="coach-translation">${escapeHtml(currentTask.replyBrief)}</p>` : ""}
          <div class="coach-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(supportText)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(supportText)}" aria-label="朗读你的回复">
              ${speakerIcon()}
            </button>
            <button class="mini-action" type="button" data-copy="${escapeAttribute(supportText)}" aria-label="复制你的回复">
              ${copyIcon()}
            </button>
          </div>
        </article>
        <article class="coach-card">
          <p class="coach-label">对方可能接着问</p>
          <p class="coach-text">${escapeHtml(currentTask.followUp)}</p>
          ${currentTask.followUpZh ? `<p class="coach-translation">${escapeHtml(currentTask.followUpZh)}</p>` : ""}
          <div class="coach-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(currentTask.followUp)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(currentTask.followUp)}" aria-label="朗读对方追问">
              ${speakerIcon()}
            </button>
          </div>
        </article>
        <article class="coach-card repair">
          <p class="coach-label">没听清 / 词穷</p>
          <p class="coach-text">${escapeHtml(currentTask.repair)}</p>
          <p class="coach-translation">先争取时间，再请对方重复关键词。</p>
          <div class="coach-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(currentTask.repair)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(currentTask.repair)}" aria-label="朗读救场表达">
              ${speakerIcon()}
            </button>
          </div>
        </article>
        <article class="coach-card confirm">
          <p class="coach-label">需要查一下 / 再确认</p>
          <p class="coach-text">${escapeHtml(currentTask.confirm || DEFAULT_CONFIRM)}</p>
          <p class="coach-translation">不确定规则、价格、库存或安排时，先明确告诉对方你会确认后回复。</p>
          <div class="coach-actions">
            <button class="mini-action" type="button" data-save-sentence="${escapeAttribute(currentTask.confirm || DEFAULT_CONFIRM)}" aria-label="收藏到表达库" title="收藏到表达库">
              ${bookmarkIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(currentTask.confirm || DEFAULT_CONFIRM)}" aria-label="朗读确认表达">
              ${speakerIcon()}
            </button>
            <button class="mini-action" type="button" data-copy="${escapeAttribute(currentTask.confirm || DEFAULT_CONFIRM)}" aria-label="复制确认表达">
              ${copyIcon()}
            </button>
          </div>
        </article>
      </div>

      <section class="practice-studio" id="practiceStudio">
        <div class="practice-heading">
          <div>
            <h3>口语重说</h3>
          </div>
          <span class="practice-status">${escapeHtml(practiceStatus)}</span>
        </div>
        <div class="practice-box">
          <textarea class="practice-transcript" id="practiceTranscript" placeholder="用英语说出或输入这句话"></textarea>
          <button class="practice-mic" id="practiceMicButton" type="button" data-action="practice-mic" aria-label="开始英语语音输入">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3"></rect>
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"></path>
            </svg>
          </button>
        </div>
        <div class="gap-row" aria-label="记录本次卡点">
          <span class="gap-label">这次卡在哪里？</span>
          ${Object.entries(GAP_LABELS).map(([key, label]) => `
            <button class="gap-chip ${currentGaps.has(key) ? "active" : ""}" type="button" data-gap="${key}">${escapeHtml(label)}</button>
          `).join("")}
        </div>
        <div class="practice-actions">
          <details class="answer-reveal">
            <summary>说完了，再对照示范</summary>
            <p>${escapeHtml(supportText)}</p>
          </details>
          <button class="complete-button ${completedToday ? "completed" : ""}" type="button" data-action="complete-task">
            ${completedToday ? "今天已完成 ✓" : "完成这次练习"}
          </button>
        </div>
        <p class="practice-note">完成记录只保存在当前浏览器。复习会从明天开始，按 1、3、7、14、30 天逐步间隔。</p>
      </section>

      ${wordsHtml ? `
        <p class="section-label">重点单词</p>
        ${wordsHtml}
      ` : ""}

      ${phrasesHtml ? `
        <p class="section-label">重点词组</p>
        ${phrasesHtml}
      ` : ""}

      ${practiceHtml ? `
        <p class="section-label">练习</p>
        <ul class="practice-list">${practiceHtml}</ul>
      ` : ""}
    `;

    showState("content");
  }

  function exampleSpeakButton(text, label = "朗读例句") {
    return `
      <button class="mini-action example-speak" type="button" data-speak="${escapeAttribute(text)}" aria-label="${escapeAttribute(label)}" title="${escapeAttribute(label)}">
        ${speakerIcon()}
      </button>
    `;
  }

  function renderLearningExample(example) {
    return `
      <div class="example-line">
        <div class="example-copy">
          <span class="example-en">${escapeHtml(example.en)}</span>
          ${example.zh ? `<span class="example-zh">${escapeHtml(example.zh)}</span>` : ""}
        </div>
        ${exampleSpeakButton(example.en)}
      </div>
    `;
  }

  function renderLearningItem(item) {
    const itemExamples = asArray(item.examples);
    const phonetics = item.type !== "word" && item.ipa
      ? `<span class="phonetic-chip">IPA ${escapeHtml(item.ipa)}</span>`
      : [
          item.ipaUs ? `<span class="phonetic-chip">US ${escapeHtml(item.ipaUs)}</span>` : "",
          item.ipaUk ? `<span class="phonetic-chip">UK ${escapeHtml(item.ipaUk)}</span>` : ""
        ].join("");

    const forms = item.forms.map((form) => `
      <div class="form-pair">
        <span>${escapeHtml(normalizePartOfSpeech(form.label) || form.label)}</span>
        <span>${escapeHtml(form.value)}</span>
      </div>
    `).join("");

    const senses = item.type === "word"
      ? normalizeWordSenses(item, itemExamples, item.meaning || "")
      : [];
    const contextSense = senses.find((sense) => sense.inContext) || senses[0] || null;
    const otherSenses = senses.filter((sense) => sense !== contextSense);
    const contextExamples = contextSense?.examples?.length
      ? contextSense.examples
      : itemExamples;
    const contextHtml = item.type === "word" ? `
      <div class="word-context">
        <p class="detail-label">当前语境</p>
        <div class="context-sense">
          ${contextSense?.pos ? `<span class="sense-pos">${escapeHtml(normalizePartOfSpeech(contextSense.pos) || contextSense.pos)}</span>` : ""}
          <p class="context-meaning">${escapeHtml(item.meaning || contextSense?.zh || "")}</p>
        </div>
        ${contextExamples.length ? `
          <div class="context-examples">
            ${contextExamples.map((example) => renderLearningExample(example)).join("")}
          </div>
        ` : ""}
      </div>
    ` : item.meaning ? `<p class="item-meaning">${escapeHtml(item.meaning)}</p>` : "";
    const otherSensesHtml = otherSenses.length ? `
      <div class="senses-block">
        <p class="detail-label">其他常用义</p>
        <ol class="senses-list">
          ${otherSenses.map((sense) => `
            <li class="sense-item">
              <div class="sense-heading">
                ${sense.pos ? `<span class="sense-pos">${escapeHtml(normalizePartOfSpeech(sense.pos) || sense.pos)}</span>` : ""}
                <span class="sense-meaning">${escapeHtml(sense.zh)}</span>
              </div>
              ${sense.examples.length ? sense.examples.map((example) => renderLearningExample(example)).join("") : ""}
            </li>
          `).join("")}
        </ol>
      </div>
    ` : "";
    const phraseExamples = item.type !== "word"
      ? itemExamples.map((example) => `<li>${renderLearningExample(example)}</li>`).join("")
      : "";
    const memoryLabel = MEMORY_METHOD_LABELS[item.memoryMethod] || "记忆线索";
    const showMemoryTrick = item.memoryTrick && !(
      item.homophoneTrick &&
      item.memoryMethod === "sound" &&
      item.memoryTrick === item.homophoneTrick
    );
    const formsLabel = item.type !== "word" ? "常见变形与搭配" : "词族变化";

    return `
      <article class="learning-item">
        <div class="item-topline">
          <div class="item-tags">
            <span class="item-type">${escapeHtml(TYPE_LABELS[item.type] || item.type || "重点")}</span>
          </div>
          <div class="item-actions">
            <button class="mini-action" type="button" aria-label="加入词库" title="加入词库"
              data-save-term="${escapeAttribute(item.text)}"
              data-save-meaning="${escapeAttribute(item.meaning || "")}"
              data-save-example="${escapeAttribute(itemExamples[0]?.en || "")}">
              ${lexiconIcon()}
            </button>
            <button class="mini-action" type="button" data-speak="${escapeAttribute(item.text)}" aria-label="朗读这个表达">
              ${speakerIcon()}
            </button>
          </div>
        </div>
        <h3 class="item-title">${escapeHtml(item.text)}</h3>
        ${phonetics ? `<div class="phonetics">${phonetics}</div>` : ""}
        ${contextHtml}
        ${showMemoryTrick ? `
          <aside class="memory-trick">
            <p class="memory-trick-label"><span aria-hidden="true">✦</span> ${memoryLabel}</p>
            <p class="memory-trick-text">${escapeHtml(item.memoryTrick)}</p>
          </aside>
        ` : ""}
        ${item.homophoneTrick ? `
          <aside class="memory-trick homophone">
            <p class="memory-trick-label"><span aria-hidden="true">♪</span> 谐音记</p>
            <p class="memory-trick-text">${escapeHtml(item.homophoneTrick)}</p>
          </aside>
        ` : ""}
        ${forms ? `
          <div class="forms-block">
            <p class="detail-label">${formsLabel}</p>
            <div class="forms-grid">${forms}</div>
          </div>
        ` : ""}
        ${phraseExamples ? `
          <div class="examples-block">
            <p class="detail-label">例句</p>
            <ul class="examples-list">${phraseExamples}</ul>
          </div>
        ` : ""}
        ${otherSensesHtml}
      </article>
    `;
  }

  function showState(state) {
    elements.emptyResult.classList.toggle("hidden", state !== "empty");
    elements.loadingResult.classList.toggle("hidden", state !== "loading");
    elements.errorResult.classList.toggle("hidden", state !== "error");
    elements.resultContent.classList.toggle("hidden", state !== "content");
  }

  function showDemo() {
    activeTask = TASKS.find((task) => task.id === "hospitality-order") || null;
    if (activeTask) setActiveScene(activeTask.scene);
    currentInput = DEMO_RESULT.original;
    currentEntryId = "";
    currentGaps = new Set();
    elements.sourceInput.value = DEMO_RESULT.original;
    updateCharacterCount();
    updateComposerTaskContext();
    renderTasks();
    renderResult(enrichResultWithLexicon(DEMO_RESULT), { demo: true });
    scrollToResult();
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    showState("error");
    scrollToResult();
  }

  function prepareSettingsPrompt(input) {
    manualPromptInput = input;
    if (input) {
      elements.settingsPrompt.value = buildManualPrompt(input, activeTone);
      elements.copyPromptButton.disabled = false;
    } else {
      elements.settingsPrompt.value = "";
      elements.copyPromptButton.disabled = true;
    }
  }

  function parseManualResult() {
    try {
      if (!manualPromptInput) throw new Error("先在页面里写好一句话，再点击生成。");
      if (!elements.settingsResult.value.trim()) throw new Error("先粘贴 AI 返回的 JSON。");
      const parsed = parseModelJson(elements.settingsResult.value);
      currentInput = manualPromptInput;
      currentResult = normalizeModelData(parsed, manualPromptInput);
      currentEntryId = "";
      currentGaps = new Set();
      renderResult(currentResult, { demo: false });
      closeSettings();
      scrollToResult();
      showToast("学习卡已生成");
    } catch (error) {
      showToast(error.message);
    }
  }

  function handleResultClick(event) {
    const speakButton = event.target.closest("[data-speak]");
    if (speakButton) {
      speakText(speakButton.dataset.speak);
      return;
    }

    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      copyText(copyButton.dataset.copy);
      return;
    }

    const saveSentenceButton = event.target.closest("[data-save-sentence]");
    if (saveSentenceButton) {
      saveSentenceToLibrary(saveSentenceButton.dataset.saveSentence);
      return;
    }

    const saveTermButton = event.target.closest("[data-save-term]");
    if (saveTermButton) {
      saveTermToLexicon({
        term: saveTermButton.dataset.saveTerm,
        meaning: saveTermButton.dataset.saveMeaning,
        example: saveTermButton.dataset.saveExample
      });
      return;
    }

    const practiceMicButton = event.target.closest('[data-action="practice-mic"]');
    if (practiceMicButton) {
      togglePracticeSpeechRecognition();
      return;
    }

    const gapButton = event.target.closest("[data-gap]");
    if (gapButton) {
      const gap = gapButton.dataset.gap;
      if (currentGaps.has(gap)) currentGaps.delete(gap);
      else currentGaps.add(gap);
      gapButton.classList.toggle("active", currentGaps.has(gap));
      return;
    }

    const completeButton = event.target.closest('[data-action="complete-task"]');
    if (completeButton) {
      completeCurrentPractice();
      return;
    }

    const saveButton = event.target.closest('[data-action="save"]');
    if (saveButton && currentResult) saveCurrentResult();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("已复制");
    } catch {
      const temporary = document.createElement("textarea");
      temporary.value = text;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.appendChild(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
      showToast("已复制");
    }
  }

  function saveSentenceToLibrary(sentence) {
    const text = cleanText(sentence);
    if (!text) return;
    const duplicate = getActivePackEntries().some((entry) =>
      asArray(entry.result?.naturalVersions).some((version) =>
        cleanText(version?.text) === text
      )
    );
    if (duplicate) {
      showToast("这句话已经在表达库里");
      return;
    }

    entries.unshift({
      id: createId(),
      input: currentInput || currentResult?.original || text,
      result: {
        original: currentInput || currentResult?.original || text,
        intent: currentResult?.intent || "",
        naturalVersions: [{ style: "natural", text }],
        expressionChunks: [],
        learningItems: [],
        practicePrompts: []
      },
      task: serializeTask(activeTask),
      packId: PACK.id,
      savedAt: new Date().toISOString(),
      review: createReviewSchedule()
    });
    entries = limitActivePackItems(entries, 100);
    persistEntries();
    renderLibrary();
    updateDashboard();
    showToast("已收藏到表达库");
  }

  function saveTermToLexicon({ term, meaning, example }) {
    const cleanTerm = cleanText(term);
    if (!cleanTerm) return;
    const normalized = normalizeMatchText(cleanTerm);
    const duplicate = LEXICON.some((entry) =>
      normalizeMatchText(entry.term) === normalized
    );
    if (duplicate) {
      showToast("词库里已经有这个表达");
      return;
    }

    const category = getLexiconCategoryForScene(activeTask?.scene);
    const cleanMeaning = cleanText(meaning) ||
      `来自${SCENE_LABELS[activeTask?.scene] || "本次练习"}场景的重点表达`;
    customLexicon.unshift({
      id: `custom-${createId()}`,
      packId: PACK.id,
      custom: true,
      term: cleanTerm,
      category,
      kind: /\s|-/.test(cleanTerm) ? "phrase" : "word",
      zh: cleanMeaning,
      example: cleanText(example),
      aliases: [],
      zhTriggers: [cleanMeaning]
    });
    persistCustomLexicon();
    rebuildLexicon();
    showToast("已加入生活词库");
  }

  function getLexiconCategoryForScene(scene) {
    const sceneToCategory = {
      hospitality: "cafe",
      farm: "work",
      job: "work",
      life: "daily",
      delivery: "transport",
      transport: "transport",
      travel: "daily",
      shopping: "shopping",
      office: "office",
      cashier: "retail",
      retail: "retail",
      social: "work"
    };
    return sceneToCategory[scene] || "daily";
  }

  function setupVoiceOptions() {
    if (!("speechSynthesis" in window)) {
      elements.voiceSelect.disabled = true;
      elements.testVoiceButton.disabled = true;
      return;
    }
    populateVoiceOptions();
    window.speechSynthesis.addEventListener?.("voiceschanged", populateVoiceOptions);
  }

  function populateVoiceOptions() {
    if (!("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang) && !NOVELTY_VOICES.has(voice.name))
      .sort((left, right) => {
        const leftUs = /^en[-_]US/i.test(left.lang) ? 0 : 1;
        const rightUs = /^en[-_]US/i.test(right.lang) ? 0 : 1;
        if (leftUs !== rightUs) return leftUs - rightUs;
        const language = left.lang.replace("_", "-");
        const quality = PREFERRED_VOICES[language] || [];
        const leftRank = quality.findIndex((name) => left.name.includes(name));
        const rightRank = quality.findIndex((name) => right.name.includes(name));
        const safeLeftRank = leftRank === -1 ? 999 : leftRank;
        const safeRightRank = rightRank === -1 ? 999 : rightRank;
        if (safeLeftRank !== safeRightRank) return safeLeftRank - safeRightRank;
        if (left.localService !== right.localService) return left.localService ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
    const selected = settings.voiceURI || "";
    elements.voiceSelect.innerHTML = [
      '<option value="">自动选择</option>',
      ...voices.map((voice) => `
        <option value="${escapeAttribute(voice.voiceURI)}">
          ${escapeHtml(voice.name)} · ${escapeHtml(voice.lang)}${voice.localService ? " · 本机" : " · 在线"}
        </option>
      `)
    ].join("");
    elements.voiceSelect.value = voices.some((voice) => voice.voiceURI === selected) ? selected : "";
  }

  function getPreferredVoice(lang, voiceURI = settings.voiceURI) {
    const voices = window.speechSynthesis.getVoices();
    if (voiceURI) {
      const selected = voices.find((voice) => voice.voiceURI === voiceURI);
      if (selected && /^en(?:[-_]|$)/i.test(selected.lang)) return selected;
    }
    if (IS_IOS) return null;
    const matching = voices.filter((voice) =>
      voice.lang.replace("_", "-") === lang
    );
    const preferredNames = PREFERRED_VOICES[lang] || PREFERRED_VOICES["en-US"];
    for (const name of preferredNames) {
      const voice = matching.find((item) => item.name.includes(name));
      if (voice) return voice;
    }
    return matching.find((voice) => voice.localService) || matching[0] || null;
  }

  function speakText(text, overrides = {}) {
    if (!("speechSynthesis" in window)) {
      showToast("当前浏览器不支持朗读");
      return;
    }
    const runId = ++speechRunId;
    window.clearInterval(speechWatchdog);
    activeSpeechUtterances = [];
    const speech = window.speechSynthesis;
    if (IS_IOS) {
      if (speech.speaking || speech.pending) speech.cancel();
      if (speech.paused) speech.resume();
    } else {
      speech.cancel();
    }
    const accent = overrides.accent || settings.accent;
    const lang = accent === "uk" ? "en-GB" : "en-US";
    const voiceURI = Object.prototype.hasOwnProperty.call(overrides, "voiceURI")
      ? overrides.voiceURI
      : settings.voiceURI;
    const rate = Number(overrides.rate || settings.speechRate) || 0.95;
    const preferred = getPreferredVoice(lang, voiceURI);
    const segments = splitSpeechText(text);
    if (!segments.length) return;
    document.documentElement.dataset.speechSegments = String(segments.length);
    document.documentElement.dataset.speechStatus = "starting";
    document.documentElement.dataset.speechVoice = preferred?.name || "system-default";

    const speakNext = () => {
      if (runId !== speechRunId) return;
      const segment = segments.shift();
      if (!segment) {
        window.clearInterval(speechWatchdog);
        speechWatchdog = null;
        return;
      }
      const spokenText = /[.!?。！？]$/.test(segment) ? segment : `${segment}.`;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (preferred) utterance.voice = preferred;
      activeSpeechUtterances.push(utterance);
      const finishSegment = () => {
        activeSpeechUtterances = activeSpeechUtterances.filter((item) => item !== utterance);
        window.setTimeout(speakNext, 160);
      };
      utterance.onstart = () => {
        if (runId === speechRunId) {
          document.documentElement.dataset.speechStatus = "playing";
        }
      };
      utterance.onend = () => {
        if (runId === speechRunId) {
          document.documentElement.dataset.speechStatus = segments.length ? "continuing" : "ended";
        }
        finishSegment();
      };
      utterance.onerror = (event) => {
        if (runId === speechRunId && !["interrupted", "canceled"].includes(event.error)) {
          document.documentElement.dataset.speechStatus = `error:${event.error || "unknown"}`;
          showToast("系统语音未能播放，请检查静音、媒体音量和系统语音设置");
        }
        finishSegment();
      };
      speech.speak(utterance);
    };

    speechWatchdog = window.setInterval(() => {
      if (runId === speechRunId && window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      }
    }, 4000);
    // iOS Safari only accepts the first speech request while the tap is still active.
    if (IS_IOS) {
      // iOS Safari only accepts the first speech request while the tap is still active.
      speakNext();
    } else {
      window.setTimeout(speakNext, 80);
    }
  }

  function splitSpeechText(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];
    const sentences = clean
      .replace(/([.!?。！？;；])\s*/g, "$1\n")
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
    const segments = [];
    for (const sentence of sentences) {
      if (sentence.length <= 120) {
        segments.push(sentence);
        continue;
      }
      const clauses = sentence
        .replace(/([,，])\s*/g, "$1\n")
        .split("\n")
        .map((clause) => clause.trim())
        .filter(Boolean);
      let current = "";
      for (const clause of clauses) {
        if ((current + clause).length > 120 && current) {
          segments.push(current.trim());
          current = clause;
        } else {
          current += clause;
        }
      }
      if (current.trim()) segments.push(current.trim());
    }
    return segments;
  }

  function saveCurrentResult() {
    if (!currentResult) return;

    if (currentEntryId) {
      const existing = getActivePackEntries()
        .find((entry) => entry.id === currentEntryId);
      if (existing) {
        existing.result = currentResult;
        existing.savedAt = new Date().toISOString();
        existing.task = serializeTask(activeTask);
        existing.review = ensureReview(existing);
        persistEntries();
        renderLibrary();
        renderResult(currentResult, { demo: false });
        updateDashboard();
        showToast("表达卡已更新");
        return;
      }
    }

    currentEntryId = createId();
    entries.unshift({
      id: currentEntryId,
      input: currentInput || currentResult.original,
      result: currentResult,
      task: serializeTask(activeTask),
      packId: PACK.id,
      savedAt: new Date().toISOString(),
      review: createReviewSchedule()
    });
    entries = limitActivePackItems(entries, 100);
    persistEntries();
    renderLibrary();
    renderResult(currentResult, { demo: false });
    updateDashboard();
    showToast("已收进表达库");
  }

  function persistEntries() {
    persistSyncCollection(STORAGE_KEYS.entries, "entries", entries);
  }

  function persistSyncCollection(storageKey, collection, records) {
    const previous = asArray(loadJson(storageKey, []));
    const previousById = new Map(previous.map((record) => [record.id, record]));
    const currentIds = new Set(records.map((record) => record.id));
    const now = new Date().toISOString();
    const changes = [];

    for (const record of records) {
      if (!record?.id) continue;
      const previousRecord = previousById.get(record.id);
      const previousContent = previousRecord ? recordContentSignature(previousRecord) : "";
      const currentContent = recordContentSignature(record);
      let changed = !previousRecord || previousContent !== currentContent || !record.updatedAt;
      if (!record.updatedAt) {
        record.updatedAt = record.savedAt || record.completedAt || now;
      } else if (changed && previousRecord?.updatedAt &&
        record.updatedAt === previousRecord.updatedAt &&
        previousContent !== currentContent) {
        record.updatedAt = now;
      }
      if (changed) {
        changes.push({
          collection,
          id: record.id,
          updatedAt: record.updatedAt,
          deleted: false
        });
      }
    }

    for (const previousRecord of previous) {
      if (!previousRecord?.id || currentIds.has(previousRecord.id)) continue;
      changes.push({
        collection,
        id: previousRecord.id,
        updatedAt: now,
        deleted: true
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(records));
    if (!suppressSyncQueue) queueCloudChanges(changes);
  }

  function recordContentSignature(record) {
    const { updatedAt, ...content } = record || {};
    return JSON.stringify(content);
  }

  function setupCloudSync() {
    syncQueue = asArray(syncQueue)
      .filter((change) =>
        change?.id &&
        SYNC_COLLECTIONS.includes(change.collection) &&
        /^\d{4}-\d{2}-\d{2}T/.test(String(change.updatedAt || ""))
      )
      .slice(-2000);
    syncMeta = syncMeta && typeof syncMeta === "object" ? syncMeta : {
      lastSyncedAt: "",
      mode: "unknown"
    };
    persistSyncQueue();
    syncInitialized = true;
    updateSyncStatus();

    if (window.location.protocol === "file:") {
      syncMeta.mode = "local";
      updateSyncStatus("本地文件模式，不连接云同步");
      return;
    }

    window.addEventListener("online", () => scheduleCloudSync(300));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") scheduleCloudSync(500);
    });
    window.setTimeout(() => syncNow(), 350);
  }

  function updateSyncStatus(message = "", state = "") {
    if (!elements.syncStatus) return;
    const pendingCount = syncQueue.length;
    let text = message;
    if (!text) {
      if (syncInFlight) {
        text = "正在同步…";
      } else if (state === "error" || syncMeta.mode === "error") {
        text = syncMeta.error || "同步失败，点击“立即同步”重试";
      } else if (syncMeta.mode === "cloud") {
        const time = syncMeta.lastSyncedAt
          ? formatDate(syncMeta.lastSyncedAt)
          : "";
        text = pendingCount
          ? `${pendingCount} 项等待同步`
          : `已同步${time ? ` · ${time}` : ""}`;
      } else if (state === "local" || syncMeta.mode === "local") {
        text = "当前为本地版本，学习数据只保存在这台设备";
      } else {
        text = "正在检测同步服务…";
      }
    }
    elements.syncStatus.textContent = text;
    elements.syncStatus.dataset.state = state || syncMeta.mode || "unknown";
    if (elements.syncNowButton) {
      elements.syncNowButton.disabled = syncInFlight;
      elements.syncNowButton.textContent = syncInFlight ? "同步中…" : "立即同步";
    }
    if (elements.libraryStorageStatus) {
      const cloudReady = syncMeta.mode === "cloud";
      elements.libraryStorageStatus.textContent = cloudReady
        ? (pendingCount ? "已保存，等待云端同步" : "已同步到云端")
        : "仅保存在当前浏览器";
    }
  }

  function scheduleCloudSync(delay = 900) {
    if (!syncInitialized || window.location.protocol === "file:") return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => syncNow(), delay);
  }

  function queueCloudChanges(changes) {
    if (!changes.length) return;
    const queuedByKey = new Map(
      syncQueue.map((change) => [
        `${change.collection}:${change.id}`,
        change
      ])
    );
    for (const change of changes) {
      if (!change?.id || !SYNC_COLLECTIONS.includes(change.collection)) continue;
      const key = `${change.collection}:${change.id}`;
      const existing = queuedByKey.get(key);
      if (!existing || compareTimestamps(change.updatedAt, existing.updatedAt) >= 0) {
        queuedByKey.set(key, {
          collection: change.collection,
          id: change.id,
          updatedAt: change.updatedAt || new Date().toISOString(),
          deleted: Boolean(change.deleted)
        });
      }
    }
    syncQueue = [...queuedByKey.values()].slice(-2000);
    persistSyncQueue();
    updateSyncStatus();
    scheduleCloudSync();
  }

  function persistSyncQueue() {
    localStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(syncQueue));
  }

  function persistSyncMeta() {
    localStorage.setItem(STORAGE_KEYS.syncMeta, JSON.stringify(syncMeta));
  }

  function compareTimestamps(left, right) {
    const leftValue = new Date(left || 0).getTime() || 0;
    const rightValue = new Date(right || 0).getTime() || 0;
    return leftValue - rightValue;
  }

  function getSyncCollection(collection) {
    if (collection === "entries") return entries;
    if (collection === "activities") return activities;
    if (collection === "customLexicon") return customLexicon;
    return [];
  }

  function setSyncCollection(collection, records) {
    if (collection === "entries") entries = records;
    if (collection === "activities") activities = records;
    if (collection === "customLexicon") customLexicon = records;
  }

  function getSyncStorageKey(collection) {
    return STORAGE_KEYS[collection];
  }

  function findSyncRecord(collection, id) {
    return getSyncCollection(collection).find((record) => record.id === id) || null;
  }

  async function syncNow(options = {}) {
    if (syncInFlight) return;
    if (window.location.protocol === "file:") {
      syncMeta.mode = "local";
      updateSyncStatus("本地文件模式，不连接云同步");
      return;
    }

    syncInFlight = true;
    updateSyncStatus();
    try {
      await pushCloudQueue();
      const snapshot = await fetchCloudSnapshot();
      const localChanges = mergeCloudSnapshot(snapshot.records);
      queueCloudChanges(localChanges);
      await pushCloudQueue();
      syncMeta = {
        lastSyncedAt: new Date().toISOString(),
        mode: "cloud",
        error: ""
      };
      persistSyncMeta();
      if (localChanges.length) refreshAfterCloudSync();
      updateSyncStatus();
      if (options.manual) showToast("云端同步完成");
    } catch (error) {
      const localOnly = error?.code === "SYNC_UNAVAILABLE";
      syncMeta = {
        ...syncMeta,
        mode: localOnly ? "local" : "error",
        error: error?.message || "同步失败"
      };
      persistSyncMeta();
      updateSyncStatus("", localOnly ? "local" : "error");
      if (options.manual) showToast(localOnly ? "当前页面没有云同步服务" : "同步失败，请稍后重试");
    } finally {
      syncInFlight = false;
      updateSyncStatus();
    }
  }

  async function fetchCloudSnapshot() {
    const response = await fetch(`/api/sync?packId=${encodeURIComponent(PACK.id)}`, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    return readSyncResponse(response);
  }

  async function readSyncResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (response.status === 404) {
      const error = new Error("当前页面没有云同步服务");
      error.code = "SYNC_UNAVAILABLE";
      throw error;
    }
    if (!contentType.includes("application/json")) {
      throw new Error(response.redirected || response.status === 401 || response.status === 403
        ? "Cloudflare Access 登录已失效，请刷新页面重新登录"
        : "同步服务返回了无法识别的响应");
    }
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `同步服务返回 ${response.status}`);
    }
    return payload;
  }

  async function pushCloudQueue() {
    let rounds = 0;
    while (syncQueue.length && rounds < 10) {
      rounds += 1;
      const batch = syncQueue.slice(0, 100);
      const changes = batch.map((change) => {
        const record = findSyncRecord(change.collection, change.id);
        const deleted = change.deleted || !record;
        return {
          collection: change.collection,
          id: change.id,
          updatedAt: change.updatedAt,
          deleted,
          data: deleted ? null : record
        };
      });
      const response = await fetch("/api/sync", {
        method: "PUT",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          packId: PACK.id,
          schemaVersion: PACK.schemaVersion,
          changes
        })
      });
      await readSyncResponse(response);
      const accepted = new Set(batch.map((change) =>
        `${change.collection}:${change.id}:${change.updatedAt}`
      ));
      syncQueue = syncQueue.filter((change) =>
        !accepted.has(`${change.collection}:${change.id}:${change.updatedAt}`)
      );
      persistSyncQueue();
      updateSyncStatus();
    }
  }

  function mergeCloudSnapshot(records) {
    const serverRows = asArray(records);
    const rowsByCollection = new Map(
      SYNC_COLLECTIONS.map((collection) => [collection, new Map()])
    );
    for (const row of serverRows) {
      if (!rowsByCollection.has(row.collection) || !row.id) continue;
      rowsByCollection.get(row.collection).set(row.id, row);
    }

    const localChanges = [];
    let changedAny = false;
    for (const collection of SYNC_COLLECTIONS) {
      const localRecords = asArray(getSyncCollection(collection));
      const localById = new Map(localRecords.map((record) => [record.id, record]));
      const serverById = rowsByCollection.get(collection);
      const mergedById = new Map(localById);

      for (const [id, row] of serverById) {
        const localRecord = localById.get(id);
        if (row.deleted) {
          if (!localRecord || compareTimestamps(row.updatedAt, localRecord.updatedAt) >= 0) {
            if (mergedById.delete(id)) changedAny = true;
          } else {
            localChanges.push({ collection, ...localRecord });
          }
          continue;
        }
        const serverRecord = row.data && typeof row.data === "object"
          ? { ...row.data, id, packId: row.data.packId || PACK.id, updatedAt: row.updatedAt }
          : null;
        if (!serverRecord) continue;
        if (!localRecord || compareTimestamps(row.updatedAt, localRecord.updatedAt) > 0) {
          mergedById.set(id, serverRecord);
          changedAny = true;
        } else if (compareTimestamps(localRecord.updatedAt, row.updatedAt) > 0 ||
          recordContentSignature(localRecord) !== recordContentSignature(serverRecord)) {
          localChanges.push({ collection, ...localRecord });
        }
      }

      for (const localRecord of localRecords) {
        if (!serverById.has(localRecord.id)) {
          localChanges.push({ collection, ...localRecord });
        }
      }

      let mergedRecords = [...mergedById.values()].filter((record) => record?.id);
      if (collection === "entries") {
        mergedRecords = limitActivePackItems(mergedRecords, 100);
      } else if (collection === "activities") {
        mergedRecords = limitActivePackItems(mergedRecords, 300);
      }
      mergedRecords.sort((left, right) => {
        const leftDate = left.updatedAt || left.savedAt || left.completedAt || "";
        const rightDate = right.updatedAt || right.savedAt || right.completedAt || "";
        return compareTimestamps(rightDate, leftDate);
      });
      setSyncCollection(collection, mergedRecords);
      suppressSyncQueue = true;
      localStorage.setItem(getSyncStorageKey(collection), JSON.stringify(mergedRecords));
      suppressSyncQueue = false;
    }

    if (changedAny) refreshAfterCloudSync();
    return localChanges.filter((record) => record?.id).map((record) => ({
      collection: record.collection,
      id: record.id,
      updatedAt: record.updatedAt || record.savedAt || record.completedAt || new Date().toISOString(),
      deleted: false
    }));
  }

  function refreshAfterCloudSync() {
    rebuildLexicon();
    renderLibrary();
    renderLexiconList();
    updateDashboard();
  }

  function migrateStoredEntries() {
    let changed = false;
    entries = asArray(entries).filter(Boolean).map((entry) => {
      const packId = cleanText(entry.packId) || LEGACY_PACK_ID;
      if (!entry.packId) changed = true;
      if (!entry.result) return { ...entry, packId };
      const previousItems = asArray(entry.result.learningItems);
      const previousChunks = asArray(entry.result.expressionChunks);
      const advancedItems = previousItems
        .filter(isAdvancedLearningItem)
        .map((item) => ({
          type: item.type,
          text: item.text,
          level: item.level,
          ipa: item.ipa,
          ipaUs: item.ipaUs,
          ipaUk: item.ipaUk,
          meaning: item.meaning,
          memoryMethod: item.memoryMethod,
          memoryTrick: item.memoryTrick,
          homophoneTrick: item.type === "word" ? item.homophoneTrick : "",
          forms: normalizeForms(item.forms),
          examples: asArray(item.examples),
          senses: asArray(item.senses)
        }));
      if (JSON.stringify(previousItems) !== JSON.stringify(advancedItems)) changed = true;
      const expressionChunks = normalizeExpressionChunks(previousChunks);
      if (JSON.stringify(previousChunks) !== JSON.stringify(expressionChunks)) changed = true;
      if (!entry.review) changed = true;
      const normalizedAdvancedItems = advancedItems.map((item) => {
        const itemExamples = normalizeExamples(item.examples);
        return {
          ...item,
          examples: itemExamples,
          senses: item.type === "word"
            ? normalizeWordSenses(item, itemExamples, item.meaning)
            : []
        };
      });
      if (advancedItems.some((item, index) =>
        JSON.stringify(item.senses || []) !== JSON.stringify(normalizedAdvancedItems[index].senses)
      )) changed = true;
      return {
        ...entry,
        packId,
        task: normalizeStoredTask(entry.task),
        review: ensureReview(entry),
        result: {
          original: entry.result.original || entry.input,
          intent: entry.result.intent || "",
          naturalVersions: asArray(entry.result.naturalVersions).slice(0, 1).map((version) => ({
            style: version.style || "natural",
            text: version.text
          })),
          expressionChunks,
          learningItems: normalizedAdvancedItems,
          practicePrompts: asArray(entry.result.practicePrompts).slice(0, 2)
        }
      };
    });
    if (changed) persistEntries();
  }

  function renderLibrary() {
    const query = elements.librarySearch.value.trim().toLowerCase();
    const activeEntries = getActivePackEntries();
    const filtered = activeEntries.filter((entry) => {
      if (!query) return true;
      const text = [
        entry.input,
        entry.task?.title,
        entry.result?.original,
        ...(entry.result?.naturalVersions || []).map((version) => version.text),
        ...(entry.result?.expressionChunks || []).flatMap((chunk) => [chunk.text, chunk.meaning, chunk.example]),
        ...(entry.result?.learningItems || []).flatMap((item) => [item.text, item.memoryTrick])
      ].join(" ").toLowerCase();
      return text.includes(query);
    });

    renderReviewSummary();

    if (!filtered.length) {
      elements.libraryList.innerHTML = `
        <div class="library-empty">
          <div>
            <span>say it, keep it.</span>
            ${activeEntries.length ? "没有匹配的表达" : "生成并收藏第一张表达卡后，会出现在这里"}
          </div>
        </div>
      `;
      return;
    }

    elements.libraryList.innerHTML = filtered.map((entry) => {
      const firstVersion = entry.result?.naturalVersions?.[0]?.text || "";
      const review = ensureReview(entry);
      const due = isReviewDue(entry);
      const taskTitle = entry.task?.title ? `${SCENE_LABELS[entry.task.scene] || "任务"} · ${entry.task.title}` : "自由输入";
      return `
        <article class="library-entry">
          <button class="library-entry-main" type="button" data-entry-id="${escapeAttribute(entry.id)}">
            <time>${escapeHtml(taskTitle)}</time>
            <strong>${escapeHtml(firstVersion)}</strong>
            <p>${escapeHtml(entry.input)}</p>
          </button>
          <div class="library-entry-footer">
            <span class="review-state ${due ? "due" : ""}">
              ${due ? "今天该复习" : `下次 ${formatReviewDate(review.dueAt)}`}
            </span>
            <div class="library-entry-actions">
              ${firstVersion ? `
                <button class="mini-action" type="button" data-library-speak="${escapeAttribute(firstVersion)}" aria-label="朗读表达" title="朗读表达">
                  ${speakerIcon()}
                </button>
              ` : ""}
              <button class="review-button" type="button" data-review-id="${escapeAttribute(entry.id)}">现在重练</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderReviewSummary() {
    if (!elements.reviewSummary) return;
    const dueCount = getActivePackEntries().filter(isReviewDue).length;
    const topGap = getTopGap();
    elements.reviewSummary.innerHTML = `
      <div>
        <strong>${dueCount}</strong>
        <span>张表达今天待复习</span>
      </div>
      <p>${topGap ? `近期最常卡在「${escapeHtml(topGap)}」` : "完成一次任务后，这里会帮你找出反复卡住的地方"}</p>
    `;
  }

  function updateDashboard() {
    const activeEntries = getActivePackEntries();
    const activeActivities = getActivePackActivities();
    const today = activeActivities
      .filter((activity) => isSameLocalDay(activity.completedAt, new Date()))
      .length;
    const weekStart = startOfLocalWeek(new Date());
    const thisWeek = activeActivities
      .filter((activity) => new Date(activity.completedAt) >= weekStart)
      .length;
    const dueReviews = activeEntries.filter(isReviewDue).length;
    const topGap = getTopGap();
    elements.todayCompletedStat.textContent = String(today);
    elements.weekCompletedStat.textContent = String(thisWeek);
    elements.dueReviewStat.textContent = String(dueReviews);
    elements.gapSummary.textContent = topGap ? `最常卡住：${topGap}` : "还没有记录卡点";
    renderReviewSummary();
  }

  function exportLibrary() {
    const activeEntries = getActivePackEntries();
    if (!activeEntries.length) {
      showToast("表达库还是空的");
      return;
    }
    downloadJson(
      `sayflow-library-${PACK.id}-${new Date().toISOString().slice(0, 10)}.json`,
      activeEntries
    );
    showToast("表达库已导出");
  }

  function exportAllData() {
    downloadJson(
      `sayflow-backup-${PACK.id}-${new Date().toISOString().slice(0, 10)}.json`,
      {
        format: "sayflow-backup",
        version: 1,
        packId: PACK.id,
        exportedAt: new Date().toISOString(),
        data: {
          entries: getActivePackEntries(),
          activities: getActivePackActivities(),
          customLexicon: customLexicon.filter((entry) =>
            !entry.packId || entry.packId === PACK.id
          )
        }
      }
    );
    showToast("完整学习数据已导出，不包含 API Key");
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackupFile(file) {
    try {
      const payload = JSON.parse(await file.text());
      const data = payload?.data || (Array.isArray(payload) ? { entries: payload } : payload);
      const incomingCollections = {
        entries: asArray(data?.entries),
        activities: asArray(data?.activities),
        customLexicon: asArray(data?.customLexicon || data?.customWords)
      };
      const counts = { entries: 0, activities: 0, customLexicon: 0 };

      for (const collection of SYNC_COLLECTIONS) {
        const current = asArray(getSyncCollection(collection));
        const byId = new Map(current.map((record) => [record.id, record]));
        const incoming = incomingCollections[collection];
        for (const rawRecord of incoming) {
          if (!rawRecord?.id) continue;
          const record = {
            ...rawRecord,
            packId: rawRecord.packId || PACK.id,
            updatedAt: rawRecord.updatedAt || rawRecord.savedAt ||
              rawRecord.completedAt || new Date().toISOString()
          };
          const existing = byId.get(record.id);
          if (!existing || compareTimestamps(record.updatedAt, existing.updatedAt) > 0) {
            byId.set(record.id, record);
            counts[collection] += 1;
          }
        }
        let records = [...byId.values()];
        if (collection === "entries") records = limitActivePackItems(records, 100);
        if (collection === "activities") records = limitActivePackItems(records, 300);
        setSyncCollection(collection, records);
        persistSyncCollection(getSyncStorageKey(collection), collection, records);
      }

      refreshAfterCloudSync();
      scheduleCloudSync(200);
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      showToast(total ? `已导入 ${total} 条学习数据` : "备份中没有更新的数据");
    } catch (error) {
      console.error(error);
      showToast("备份文件无法读取，请选择 SayFlow 导出的 JSON");
    }
  }

  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      elements.micButton.disabled = true;
      elements.micButton.title = "当前浏览器不支持语音识别，请直接输入文字";
      elements.micLabel.textContent = "请键入文字";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("start", () => {
      listening = true;
      speechBaseText = elements.sourceInput.value.trim();
      elements.micButton.classList.add("listening");
      elements.micLabel.textContent = "正在听…";
    });

    recognition.addEventListener("result", (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      elements.sourceInput.value = [speechBaseText, transcript.trim()].filter(Boolean).join(" ");
      updateCharacterCount();
    });

    recognition.addEventListener("error", (event) => {
      const messages = {
        "not-allowed": "没有麦克风权限，请在浏览器设置中允许访问",
        "no-speech": "没有听清，再说一次试试",
        network: "语音识别需要网络或当前浏览器服务不可用"
      };
      showToast(messages[event.error] || "语音识别失败，请直接输入文字");
    });

    recognition.addEventListener("end", () => {
      listening = false;
      elements.micButton.classList.remove("listening");
      elements.micLabel.textContent = "点击说话";
    });
  }

  function toggleSpeechRecognition(event) {
    if (!recognition) return;
    event.preventDefault();
    if (listening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch {
      showToast("语音识别暂时无法启动");
    }
  }

  function setupPracticeSpeechRecognition() {
    if (practiceRecognition) return true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    practiceRecognition = new SpeechRecognition();
    practiceRecognition.lang = settings.accent === "uk" ? "en-GB" : "en-US";
    practiceRecognition.continuous = false;
    practiceRecognition.interimResults = true;
    practiceRecognition.maxAlternatives = 1;

    practiceRecognition.addEventListener("start", () => {
      practiceListening = true;
      const input = document.querySelector("#practiceTranscript");
      const button = document.querySelector("#practiceMicButton");
      practiceBaseText = input?.value.trim() || "";
      button?.classList.add("listening");
    });

    practiceRecognition.addEventListener("result", (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const input = document.querySelector("#practiceTranscript");
      if (input) {
        input.value = [practiceBaseText, transcript.trim()].filter(Boolean).join(" ");
      }
    });

    practiceRecognition.addEventListener("error", (event) => {
      const messages = {
        "not-allowed": "没有麦克风权限，请在浏览器设置中允许访问",
        "no-speech": "没有听清，再说一次试试",
        network: "语音识别需要网络或当前浏览器服务不可用"
      };
      showToast(messages[event.error] || "英语语音识别失败，可以直接输入文字");
    });

    practiceRecognition.addEventListener("end", () => {
      practiceListening = false;
      document.querySelector("#practiceMicButton")?.classList.remove("listening");
    });
    return true;
  }

  function togglePracticeSpeechRecognition() {
    if (!setupPracticeSpeechRecognition()) {
      showToast("当前浏览器不支持英语语音识别，请直接输入文字");
      return;
    }
    if (practiceListening) {
      practiceRecognition.stop();
      return;
    }
    try {
      window.speechSynthesis?.cancel();
      practiceRecognition.lang = settings.accent === "uk" ? "en-GB" : "en-US";
      practiceRecognition.start();
    } catch {
      showToast("英语语音识别暂时无法启动");
    }
  }

  function completeCurrentPractice() {
    const transcript = document.querySelector("#practiceTranscript")?.value.trim() || "";
    const task = activeTask || {
      id: "custom",
      scene: "",
      title: "自由输入"
    };

    if (!transcript && currentGaps.size === 0) {
      showToast("先用英语说一句，或者至少记录这次卡在哪里");
      document.querySelector("#practiceTranscript")?.focus();
      return;
    }

    const completedAt = new Date().toISOString();
    const existingToday = getActivePackActivities().find((activity) =>
      activity.taskId === task.id &&
      isSameLocalDay(activity.completedAt, new Date(completedAt))
    );
    const activity = {
      id: existingToday?.id || createId(),
      packId: PACK.id,
      taskId: task.id,
      scene: task.scene,
      title: task.title,
      completedAt,
      gaps: [...currentGaps],
      practiceText: transcript,
      input: currentInput || currentResult?.original || "",
      entryId: currentEntryId || ""
    };

    if (existingToday) {
      activities = activities.map((item) => item.id === existingToday.id ? activity : item);
    } else {
      activities.unshift(activity);
      activities = limitActivePackItems(activities, 300);
    }
    persistActivities();

    if (currentEntryId && !existingToday) {
      const entry = getActivePackEntries()
        .find((item) => item.id === currentEntryId);
      if (entry) {
        entry.review = scheduleNextReview(entry);
        persistEntries();
      }
    }

    const button = document.querySelector('[data-action="complete-task"]');
    if (button) {
      button.classList.add("completed");
      button.textContent = "今天已完成 ✓";
    }
    updateDashboard();
    renderLibrary();
    showToast(existingToday ? "今天的练习记录已更新" : "任务完成，复习已安排到下个时间点");
  }

  function serializeTask(task) {
    if (!task) return null;
    return {
      id: task.id,
      scene: task.scene,
      title: task.title,
      prompt: task.prompt,
      skill: task.skill,
      twist: task.twist,
      opening: task.opening,
      openingZh: task.openingZh,
      replyBrief: task.replyBrief,
      followUp: task.followUp,
      followUpZh: task.followUpZh,
      repair: task.repair,
      confirm: task.confirm
    };
  }

  function createReviewSchedule(baseDate = new Date()) {
    const dueAt = new Date(baseDate);
    dueAt.setDate(dueAt.getDate() + REVIEW_INTERVALS[0]);
    return {
      stage: 0,
      dueAt: dueAt.toISOString(),
      lastReviewedAt: null
    };
  }

  function ensureReview(entry) {
    if (entry.review?.dueAt) return entry.review;
    const baseDate = entry.savedAt ? new Date(entry.savedAt) : new Date();
    return createReviewSchedule(Number.isNaN(baseDate.getTime()) ? new Date() : baseDate);
  }

  function scheduleNextReview(entry) {
    const review = ensureReview(entry);
    const nextStage = Math.min(review.stage + 1, REVIEW_INTERVALS.length - 1);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + REVIEW_INTERVALS[nextStage]);
    return {
      stage: nextStage,
      dueAt: dueAt.toISOString(),
      lastReviewedAt: new Date().toISOString()
    };
  }

  function isReviewDue(entry) {
    if (!isActivePackItem(entry)) return false;
    const dueAt = new Date(ensureReview(entry).dueAt);
    if (Number.isNaN(dueAt.getTime())) return false;
    return localDateKey(dueAt) <= localDateKey(new Date());
  }

  function formatReviewDate(dateString) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit"
      }).format(new Date(dateString));
    } catch {
      return "稍后";
    }
  }

  function isTaskCompletedToday(taskId, input) {
    return getActivePackActivities().some((activity) =>
      isSameLocalDay(activity.completedAt, new Date()) &&
      (activity.taskId === taskId || (taskId === "custom" && activity.input === input))
    );
  }

  function getTopGap() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const counts = {};
    getActivePackActivities()
      .filter((activity) => new Date(activity.completedAt) >= weekAgo)
      .flatMap((activity) => activity.gaps || [])
      .forEach((gap) => {
        counts[gap] = (counts[gap] || 0) + 1;
      });
    const top = Object.entries(counts).sort((left, right) => right[1] - left[1])[0];
    return top ? `${GAP_LABELS[top[0]] || top[0]}（${top[1]} 次）` : "";
  }

  function migrateActivities() {
    const previous = JSON.stringify(activities);
    activities = asArray(activities)
      .filter((activity) => activity?.completedAt)
      .map((activity) => ({
        id: activity.id || createId(),
        packId: cleanText(activity.packId) || LEGACY_PACK_ID,
        taskId: activity.taskId || "custom",
        scene: activity.scene || "life",
        title: activity.title || "自由输入",
        completedAt: activity.completedAt,
        gaps: asArray(activity.gaps).filter((gap) => GAP_LABELS[gap]),
        practiceText: cleanText(activity.practiceText),
        input: cleanText(activity.input),
        entryId: cleanText(activity.entryId)
      }))
      .slice(0, 300);
    if (JSON.stringify(activities) !== previous) persistActivities();
  }

  function persistActivities() {
    persistSyncCollection(STORAGE_KEYS.activities, "activities", activities);
  }

  function migrateLookupCache() {
    const previous = JSON.stringify(lookupCache);
    lookupCache = asArray(lookupCache)
      .filter((item) => item?.query && item?.entry)
      .map((item) => ({
        ...item,
        packId: cleanText(item.packId) || LEGACY_PACK_ID
      }));
    if (JSON.stringify(lookupCache) !== previous) {
      localStorage.setItem(STORAGE_KEYS.lookupCache, JSON.stringify(lookupCache));
    }
  }

  function isSameLocalDay(dateString, comparison) {
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()) &&
      date.getFullYear() === comparison.getFullYear() &&
      date.getMonth() === comparison.getMonth() &&
      date.getDate() === comparison.getDate();
  }

  function localDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function startOfLocalWeek(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    return start;
  }

  function openSettings() {
    prepareSettingsPrompt(elements.sourceInput.value.trim());
    showSettingsDialog();
  }

  function openSettingsForManual(input) {
    currentInput = input;
    currentResult = null;
    currentEntryId = "";
    currentGaps = new Set();
    elements.settingsResult.value = "";
    prepareSettingsPrompt(input);
    showSettingsDialog();
  }

  function showSettingsDialog() {
    elements.endpointInput.value = settings.endpoint || "";
    elements.apiKeyInput.value = settings.apiKey || "";
    elements.modelInput.value = settings.model || "";
    elements.speechRateInput.value = settings.speechRate || "0.95";
    populateVoiceOptions();
    const accentInput = document.querySelector(`input[name="accent"][value="${settings.accent || "us"}"]`);
    if (accentInput) accentInput.checked = true;
    if (typeof elements.settingsDialog.showModal === "function") {
      elements.settingsDialog.showModal();
    } else {
      elements.settingsDialog.setAttribute("open", "");
    }
  }

  function closeSettings() {
    if (typeof elements.settingsDialog.close === "function") {
      elements.settingsDialog.close();
    } else {
      elements.settingsDialog.removeAttribute("open");
    }
  }

  function openLibrary() {
    closeLexicon();
    elements.drawerBackdrop.classList.add("open");
    elements.libraryDrawer.classList.add("open");
    elements.libraryDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLibrary() {
    elements.libraryDrawer.classList.remove("open");
    elements.libraryDrawer.setAttribute("aria-hidden", "true");
    if (!elements.lexiconDrawer.classList.contains("open")) {
      elements.drawerBackdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  function isApiReady() {
    if (!settings.endpoint || !settings.model) return false;
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(settings.endpoint);
    return Boolean(settings.apiKey) || isLocal;
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("show");
    }, 2600);
  }

  function scrollToResult() {
    if (window.innerWidth <= 860) {
      document.querySelector("#resultPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function loadJson(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function formatDate(dateString) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(dateString));
    } catch {
      return "";
    }
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || typeof value === "undefined" || value === "") return [];
    return [value];
  }

  function cleanText(value) {
    if (value === null || typeof value === "undefined") return "";
    if (typeof value === "object") return "";
    return String(value).trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("\n", "&#10;");
  }

  function speakerIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9v6h4l5 4V5L9 9H5Z"></path><path d="M17 8a5 5 0 0 1 0 8"></path></svg>';
  }

  function copyIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
  }

  function bookmarkIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"></path></svg>';
  }

  function lexiconIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"></path><path d="M8 20a3 3 0 0 1-3-3h14M12 8v6M9 11h6"></path></svg>';
  }

  function trashIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"></path></svg>';
  }
})();
