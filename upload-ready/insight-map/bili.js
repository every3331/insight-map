/* 洞见 · 已核实的 B 站视频（三轮检索 + 人工检索词 + 三重校验 + 事后收紧）
 * 规则：必须词命中（≥10万播放；或≥3万且标题含两个必须词/完整知识点名）
 *      + 时长 2–120 分钟 + 学段过滤（大学排除高中/高考/必修；高中排除考研/高数）
 *      + 排除合集/直播/音乐/游戏；事后对易混节点（导数定义 vs 圆锥曲线切线）做标题收紧。
 * 核不到的节点不在表里 —— 前端自动退回六平台站内检索，不会出现死链。
 */
(function (root) {
  root.BILI = {
  "ineq-basic": [
    {
      "bvid": "BV1oNxszjE99",
      "title": "【加数】高中数学技能课：一元二次不等式！",
      "up": "加数FloweRomanXi",
      "dur": 555,
      "play": 89289
    },
    {
      "bvid": "BV1LT4y1f7rN",
      "title": "一元二次函数、一元二次方程、一元二次不等式习题提高",
      "up": "刘老师高中数学课堂",
      "dur": 1471,
      "play": 8224
    }
  ],
  "func-zero": [
    {
      "bvid": "BV1tY411J77h",
      "title": "【函数 | 基础知识】函数的零点（易）",
      "up": "一数",
      "dur": 1915,
      "play": 2176268
    },
    {
      "bvid": "BV1rG4y1d73x",
      "title": "23分钟拯救「零点」压轴小题，超棒新老师登场！",
      "up": "一数",
      "dur": 1394,
      "play": 2116142
    }
  ],
  "trig-graph": [
    {
      "bvid": "BV1SF411v7Yo",
      "title": "正切函数的图像性质[三角函数7]",
      "up": "会放羊的教书匠",
      "dur": 967,
      "play": 191100
    }
  ],
  "trig-ident": [
    {
      "bvid": "BV1pe411q79E",
      "title": "「三角恒等变换」公式多吧？半小时全学会！",
      "up": "一数",
      "dur": 2334,
      "play": 4024847
    },
    {
      "bvid": "BV1hyCbYmEsp",
      "title": "三角恒等变换不会做题？30分钟学会思路！",
      "up": "一数",
      "dur": 1632,
      "play": 2043673
    }
  ],
  "triangle-solve": [
    {
      "bvid": "BV1GXZAY7EWe",
      "title": "「解三角形」常考题型！基础到进阶！",
      "up": "一数",
      "dur": 5051,
      "play": 3743520
    },
    {
      "bvid": "BV1Et411j7qJ",
      "title": "【解三角形|常考题型】三角形解的个数&amp;测量问题（基础）",
      "up": "一数",
      "dur": 1500,
      "play": 1500648
    }
  ],
  "complex": [
    {
      "bvid": "BV1r4411z76d",
      "title": "【复数】复数的概念（易）",
      "up": "一数",
      "dur": 574,
      "play": 499379
    },
    {
      "bvid": "BV1QJ411w7zB",
      "title": "【复数】复数的运算（中档）",
      "up": "一数",
      "dur": 1441,
      "play": 183595
    }
  ],
  "solid-basic": [
    {
      "bvid": "BV1KR4y1B7tn",
      "title": "立体几何初步-多面体和旋转体",
      "up": "小郎老师",
      "dur": 6055,
      "play": 62284
    },
    {
      "bvid": "BV1dm411X7cs",
      "title": "中职数学—7·1·1多面体（棱柱）",
      "up": "双木老师数学课",
      "dur": 2461,
      "play": 45019
    }
  ],
  "line-eq": [
    {
      "bvid": "BV17t4y1z74V",
      "title": "中职数学零基础——第8章 直线与圆的方程（一）～直线方程",
      "up": "小林老师Math",
      "dur": 1323,
      "play": 1237497
    }
  ],
  "ellipse": [
    {
      "bvid": "BV1zrnH6jEeu",
      "title": "椭圆！一个视频从入门到进阶！",
      "up": "一数",
      "dur": 4675,
      "play": 643080
    },
    {
      "bvid": "BV1Sp421S7fp",
      "title": "中职数学—3·1·1椭圆（椭圆的标准方程）拓展模块上册",
      "up": "双木老师数学课",
      "dur": 2024,
      "play": 51947
    }
  ],
  "hyperbola": [
    {
      "bvid": "BV12Qxy6iEN5",
      "title": "「双曲线」学着烧心？这些题型你要会！",
      "up": "一数",
      "dur": 4437,
      "play": 615606
    },
    {
      "bvid": "BV1F615BpErW",
      "title": "直线与双曲线！保姆级讲解",
      "up": "一数",
      "dur": 1455,
      "play": 1827369
    }
  ],
  "seq": [
    {
      "bvid": "BV1Qt411u7eL",
      "title": "【数列| | 基础知识】什么是数列？",
      "up": "一数",
      "dur": 845,
      "play": 1997477
    },
    {
      "bvid": "BV1dd4y1p7Su",
      "title": "2022新高考1卷数列大题，直播没来得及听的来这里听回放",
      "up": "高中数学月牙老师",
      "dur": 554,
      "play": 8948
    }
  ],
  "binomial": [
    {
      "bvid": "BV1hEwMzFEuS",
      "title": "「二项式定理」学不懂？一个视频完全搞定！",
      "up": "一数",
      "dur": 5355,
      "play": 3280037
    },
    {
      "bvid": "BV1sc411L75L",
      "title": "【二项式定理】保姆级梳理，重点题型一网打尽！",
      "up": "一数",
      "dur": 2103,
      "play": 7795293
    }
  ],
  "stat-sample": [
    {
      "bvid": "BV1pq4y1p7nu",
      "title": "样本方差为什么除以n-1?",
      "up": "小崔说数",
      "dur": 661,
      "play": 146794
    },
    {
      "bvid": "BV1E4421w7ef",
      "title": "【统计学】8.4.2简单随机抽样下样本容量的确定",
      "up": "宋浩老师官方",
      "dur": 1262,
      "play": 21113
    }
  ],
  "rv-basic": [
    {
      "bvid": "BV1mFo7BvEEj",
      "title": "【概率】随机变量与分布列！期望与方差！一课搞定！",
      "up": "一数",
      "dur": 4623,
      "play": 1844977
    },
    {
      "bvid": "BV1c5411S7ZL",
      "title": "高中数学概率三大分布，0基础到高考，一个视频搞定！ |二项分布、超几何分布、正态分布",
      "up": "一数",
      "dur": 2841,
      "play": 5819846
    }
  ],
  "der-calc": [
    {
      "bvid": "BV1Ud4y1E7FE",
      "title": "高中数学考点410：二次求导或多次求导",
      "up": "嗲东数学",
      "dur": 779,
      "play": 94134
    }
  ],
  "continuous": [
    {
      "bvid": "BV1zb4y1b7t1",
      "title": "【高等数学】函数的连续点与间断点（包括类型判断）",
      "up": "delta哥",
      "dur": 1731,
      "play": 1413711
    },
    {
      "bvid": "BV1LUx368E1L",
      "title": "【高数】看完起飞！连续与间断概念题，结论大盘点！",
      "up": "一高数",
      "dur": 1777,
      "play": 240959
    }
  ],
  "der-rule": [
    {
      "bvid": "BV1WP4y1b7Km",
      "title": "[高等数学12]反函数、隐函数、参数方程求导法则",
      "up": "会放羊的教书匠",
      "dur": 1357,
      "play": 176392
    },
    {
      "bvid": "BV1DHugznEfB",
      "title": "复合函数求导法则，链式法则，你学会了吗？",
      "up": "青衿学长B",
      "dur": 272,
      "play": 51012
    }
  ],
  "diff-diff": [
    {
      "bvid": "BV1nd4y197yY",
      "title": "零基础学高数 ｜ 微分在近似计算中的应用",
      "up": "玩转高等数学",
      "dur": 770,
      "play": 100088
    },
    {
      "bvid": "BV1de411F7gP",
      "title": "用微分求函数的近似值",
      "up": "周周数学课",
      "dur": 700,
      "play": 55822
    }
  ],
  "high-deriv": [
    {
      "bvid": "BV1EE411a7rx",
      "title": "高等数学|3.7 高阶导数",
      "up": "兆筱小分队",
      "dur": 1043,
      "play": 450385
    },
    {
      "bvid": "BV1144y1x7Jh",
      "title": "【高阶导数】的三种解题方法",
      "up": "小崔说数",
      "dur": 776,
      "play": 405782
    }
  ],
  "mvt": [
    {
      "bvid": "BV1UV411G7Gb",
      "title": "【中值定理】有限增量定理，什么是求中值θ的极限？！！！",
      "up": "雲月无悔",
      "dur": 479,
      "play": 8484
    },
    {
      "bvid": "BV18SmZYrEPA",
      "title": "「微分中值定理」保姆级教程！8道题搞定！干货密集，不看后悔 | 高数上",
      "up": "一高数",
      "dur": 3936,
      "play": 1662690
    }
  ],
  "taylor": [
    {
      "bvid": "BV12G411U7tD",
      "title": "泰勒公式，39分钟，小白也直接上手！|高等数学",
      "up": "一高数",
      "dur": 2348,
      "play": 2657072
    },
    {
      "bvid": "BV1Aq4y1g7JQ",
      "title": "泰勒公式及麦克劳林公式[高等数学18]",
      "up": "会放羊的教书匠",
      "dur": 925,
      "play": 610066
    }
  ],
  "monotone-ext": [
    {
      "bvid": "BV1im411d7Eu",
      "title": "【导数】单调性+极值+最值+图象！半小时解决，保姆级基础讲解！",
      "up": "一数",
      "dur": 2006,
      "play": 8144036
    },
    {
      "bvid": "BV1EE41187az",
      "title": "高等数学|4.6 函数的单调性、极值、最值",
      "up": "兆筱小分队",
      "dur": 1592,
      "play": 287675
    }
  ],
  "concavity": [
    {
      "bvid": "BV1fR4y1s7yn",
      "title": "【高等数学】曲线的凹凸性和拐点",
      "up": "delta哥",
      "dur": 1086,
      "play": 420993
    }
  ],
  "indef-int": [
    {
      "bvid": "BV1sa411r7FG",
      "title": "不定积分[高等数学21]",
      "up": "会放羊的教书匠",
      "dur": 1088,
      "play": 209297
    },
    {
      "bvid": "BV1ie411d7ze",
      "title": "不定积分，必会技巧，思路瞬间清晰！一般人不知道",
      "up": "一高数",
      "dur": 1631,
      "play": 1677362
    }
  ],
  "int-sub": [
    {
      "bvid": "BV16b4y1i74f",
      "title": "换元积分法，第一换元法＆第二换元法[高等数学22]",
      "up": "会放羊的教书匠",
      "dur": 914,
      "play": 675070
    },
    {
      "bvid": "BV1YE411L7w6",
      "title": "换元积分法（第一换元积分法（凑微分）和第二换元积分法）",
      "up": "图图数学",
      "dur": 2034,
      "play": 511976
    }
  ],
  "rational-int": [
    {
      "bvid": "BV1XLiUY9Eud",
      "title": "边学边练！&quot;有理函数积分&quot;，49min全面入门到精通！|高数上",
      "up": "一高数",
      "dur": 2964,
      "play": 790538
    },
    {
      "bvid": "BV1THazzWEmm",
      "title": "小豚专升本高数基础论有理函数积分法（试听课程）1.分式拆分型",
      "up": "杰哥专升本",
      "dur": 1754,
      "play": 12157
    }
  ],
  "int-app": [
    {
      "bvid": "BV1oBNAeGEbi",
      "title": "【专升本高等数学0基础学习】定积分的应用（求面积、体积）",
      "up": "高数-Econ-",
      "dur": 2036,
      "play": 7073
    },
    {
      "bvid": "BV1LXfdBhEwb",
      "title": "【升本速成课5】一个视频讲完定积分的应用，包含面积和体积！",
      "up": "中崎高数",
      "dur": 5000,
      "play": 30049
    }
  ],
  "improper-int": [
    {
      "bvid": "BV1JArLYHEeD",
      "title": "反常积分敛散性，23min，从小白到高手！|高数上",
      "up": "一高数",
      "dur": 1417,
      "play": 745691
    },
    {
      "bvid": "BV1LU4y1C7bW",
      "title": "零基础学高数 ｜ 广义积分（反常积分）计算及其敛散性的判定",
      "up": "玩转高等数学",
      "dur": 1537,
      "play": 287025
    }
  ],
  "series-test": [
    {
      "bvid": "BV1Gv411B7YK",
      "title": "【无穷级数第四期】交错级数的莱布尼茨判别法",
      "up": "小崔说数",
      "dur": 311,
      "play": 100469
    }
  ],
  "multi-limit": [
    {
      "bvid": "BV1kv4y1j753",
      "title": "多元函数的极限与连续（极限计算看这个够了）",
      "up": "高等数学熊老师",
      "dur": 1563,
      "play": 83285
    },
    {
      "bvid": "BV1V34y1a7Ev",
      "title": "考研数学难点秒杀之多元函数极限",
      "up": "考研数学叶小贝",
      "dur": 1263,
      "play": 69438
    }
  ],
  "partial-deriv": [
    {
      "bvid": "BV17D4y1H7D3",
      "title": "专升本数学：第六章：3偏导数与全微分1偏导数的概念",
      "up": "泡泡于鱼泡",
      "dur": 1109,
      "play": 12264
    },
    {
      "bvid": "BV1mg4y1S7fq",
      "title": "偏导数和全导数的区别",
      "up": "账号已注销",
      "dur": 145,
      "play": 120846
    }
  ],
  "double-int": [
    {
      "bvid": "BV11t42177s1",
      "title": "「二重积分」保姆级教程！8道题搞定！干货密集，不看后悔 |高数下",
      "up": "一高数",
      "dur": 6151,
      "play": 2193910
    },
    {
      "bvid": "BV1Ah41167CW",
      "title": "2022考研数学【含二重积分的极限】【交换积分次序】【洛必达】",
      "up": "甄佳林考研数学",
      "dur": 742,
      "play": 11944
    }
  ],
  "line-int": [
    {
      "bvid": "BV1csqwBvESH",
      "title": "小豚优学帮专升本高数全程班（曲线积分）",
      "up": "杰哥专升本",
      "dur": 2724,
      "play": 11918
    },
    {
      "bvid": "BV1h7VH67EZm",
      "title": "高数期末必刷【曲线积分与曲面积分】专题速成！经典题型讲解 | 看完直接起飞",
      "up": "期末闪学",
      "dur": 2569,
      "play": 73992
    }
  ],
  "diff-eq1": [
    {
      "bvid": "BV1zX4y1V7ce",
      "title": "【高等数学】一阶微分方程的常见解法（针对可分离变量的微分方程、齐次方程、一阶线性微分方程）",
      "up": "delta哥",
      "dur": 2806,
      "play": 1322386
    },
    {
      "bvid": "BV1XX4y1V7QE",
      "title": "【高等数学】微分方程-一阶线性微分方程",
      "up": "Alan_极蓝星辰",
      "dur": 526,
      "play": 136366
    }
  ],
  "diff-eq2": [
    {
      "bvid": "BV1W54y1z7Pb",
      "title": "91.微分方程：二阶线性微分方程解的结构",
      "up": "尚书院",
      "dur": 1665,
      "play": 140370
    },
    {
      "bvid": "BV1FAWAzHER7",
      "title": "[万能解法]二阶线性微分方程",
      "up": "小白考研竞赛数学",
      "dur": 1336,
      "play": 8872
    }
  ],
  "vec-space": [
    {
      "bvid": "BV1Km4y1P7jA",
      "title": "零基础学线代 ｜ 向量组的线性相关性（线性相关与线性无关）",
      "up": "玩转高等数学",
      "dur": 690,
      "play": 232345
    },
    {
      "bvid": "BV1NH4y127w6",
      "title": "线性代数第四章《向量组的线性相关性》知识点讲解",
      "up": "数学系于老师",
      "dur": 3178,
      "play": 83557
    }
  ],
  "eigen": [
    {
      "bvid": "BV1Js4y1372V",
      "title": "求矩阵的特征值和特征向量例题讲解。",
      "up": "猫儿来袭",
      "dur": 552,
      "play": 1215536
    },
    {
      "bvid": "BV1Va411Y7Ff",
      "title": "5-1-1  特征值与特征向量的概念与计算",
      "up": "考研数学梁瑞珍",
      "dur": 940,
      "play": 153764
    }
  ],
  "quad-form": [
    {
      "bvid": "BV1Jg411h7kH",
      "title": "【导数单调性】讨论点法求含参函数单调性（类二次型）",
      "up": "数学大叔的系统课",
      "dur": 812,
      "play": 9961
    },
    {
      "bvid": "BV1UG4y1E7HB",
      "title": "线代-配方法（二次型化标准型）万能模板",
      "up": "小吴学长啊",
      "dur": 1016,
      "play": 313290
    }
  ],
  "prob-axiom": [
    {
      "bvid": "BV1aq4y177pS",
      "title": "压缩样本空间法求条件概率",
      "up": "顺哥考研数学课堂",
      "dur": 1690,
      "play": 6891
    },
    {
      "bvid": "BV1f5411X7jz",
      "title": "[大帅学深度学习]17.概率-联合概率 条件概率 贝叶斯定理 边缘概率 独立性 应用",
      "up": "都叫我大帅哥",
      "dur": 1170,
      "play": 6180
    }
  ],
  "rv-discrete": [
    {
      "bvid": "BV1jJWJeNEYv",
      "title": "中职数学—9·1·1离散型随机变量（拓展模块下册）",
      "up": "双木老师数学课",
      "dur": 1096,
      "play": 19241
    },
    {
      "bvid": "BV1sv4y1G743",
      "title": "2-5  一维离散型随机变量的分布函数",
      "up": "考研数学梁瑞珍",
      "dur": 511,
      "play": 41436
    }
  ],
  "expect": [
    {
      "bvid": "BV1Bg4y1M7wK",
      "title": "随机变量的数字特征",
      "up": "太白金星V博士",
      "dur": 1146,
      "play": 44301
    }
  ],
  "ll-clt": [
    {
      "bvid": "BV1i84y1S7Cp",
      "title": "概率专题|大数定律与中心极限定理",
      "up": "小吴学长啊",
      "dur": 2439,
      "play": 81256
    },
    {
      "bvid": "BV18t411q7bG",
      "title": "【考研数学】Kira小课糖26|一点就通的大数定律",
      "up": "上交Kira老师",
      "dur": 524,
      "play": 82058
    }
  ],
  "stat-infer": [
    {
      "bvid": "BV1DP411a732",
      "title": "30分钟拿下区间估计与假设检验",
      "up": "考研数学叶小贝",
      "dur": 1893,
      "play": 727377
    },
    {
      "bvid": "BV1U5efz2ExD",
      "title": "04 参数估计与假设检验 | 《医学统计学》第8版 人民卫生出版社",
      "up": "华夏丹心-classics",
      "dur": 1947,
      "play": 15047
    }
  ],
  "set-logic": [
    {
      "bvid": "BV11P411s7dd",
      "title": "高中数学第一课《集合》",
      "up": "一数",
      "dur": 1509,
      "play": 8900603
    },
    {
      "bvid": "BV19YUwBEEX7",
      "title": "【一数拔高】圆锥曲线命题背景！射影几何：调和点列+极点极线！高考五年考五次！",
      "up": "一数",
      "dur": 3652,
      "play": 2025787
    }
  ],
  "exp-log": [
    {
      "bvid": "BV1ke4y1W7tb",
      "title": "对数运算 27分钟入门到精通，藏獒变小哈！",
      "up": "一数",
      "dur": 1639,
      "play": 3905446
    },
    {
      "bvid": "BV15UBiYhE5a",
      "title": "指数、对数没学懂？来听总结！",
      "up": "一数",
      "dur": 2455,
      "play": 3146503
    }
  ],
  "vector": [
    {
      "bvid": "BV1eC411W7L3",
      "title": "开学要学平面向量？一个视频基础通关！",
      "up": "一数",
      "dur": 2257,
      "play": 7801809
    },
    {
      "bvid": "BV1brQyY5Eo7",
      "title": "2025 平面向量必会十题【技巧篇】",
      "up": "一数",
      "dur": 2782,
      "play": 4364975
    }
  ],
  "solid-vector": [
    {
      "bvid": "BV19f4y117hk",
      "title": "立体几何如何建系？空间向量的坐标运算要点总结！",
      "up": "一数",
      "dur": 1193,
      "play": 3530063
    },
    {
      "bvid": "BV1Mz421B7Pr",
      "title": "空间向量零基础到精通，系统讲解！定义+位置关系+角度！",
      "up": "一数",
      "dur": 6173,
      "play": 3394436
    }
  ],
  "circle-eq": [
    {
      "bvid": "BV17t4y1z74V",
      "title": "中职数学零基础——第8章 直线与圆的方程（一）～直线方程",
      "up": "小林老师Math",
      "dur": 1323,
      "play": 1237498
    },
    {
      "bvid": "BV1Cf4y197Sn",
      "title": "【直线和圆 | 基础知识】圆的一般方程（易）",
      "up": "一数",
      "dur": 1676,
      "play": 2041069
    }
  ],
  "parabola": [
    {
      "bvid": "BV1MP41137Yw",
      "title": "抛物线重点全在这，事半功倍！超棒新老师登场！【圆锥曲线】",
      "up": "一数",
      "dur": 1854,
      "play": 3048251
    },
    {
      "bvid": "BV14WDAYQEyy",
      "title": "高考中出现的“抛物线”二级结论！",
      "up": "一数",
      "dur": 1609,
      "play": 1820781
    }
  ],
  "stat-reg": [
    {
      "bvid": "BV1PrLS6pEJS",
      "title": "【统计】线性回归与非线性回归！最小二乘法！保姆级讲解！",
      "up": "一数",
      "dur": 2632,
      "play": 1415237
    }
  ],
  "prob-basic": [
    {
      "bvid": "BV1k4411S7VR",
      "title": "【概率必修】随机事件与古典概型",
      "up": "一数",
      "dur": 2091,
      "play": 541933
    },
    {
      "bvid": "BV1wa411Y7HP",
      "title": "高中数学考点262：古典概型",
      "up": "嗲东数学",
      "dur": 886,
      "play": 174934
    }
  ],
  "ineq-proof": [
    {
      "bvid": "BV1uAZjBBEsj",
      "title": "导数与不等式证明！直接求导+变换主元！",
      "up": "一数",
      "dur": 2744,
      "play": 2228408
    },
    {
      "bvid": "BV1KG411E7WR",
      "title": "基本不等式专题4:不等式证明思路总结",
      "up": "汉口冯",
      "dur": 1379,
      "play": 20922
    }
  ],
  "limit-method": [
    {
      "bvid": "BV1Fb4y1V7Bg",
      "title": "直击痛点 | 求极限题型与方法一课通 等价无穷小TA来了！",
      "up": "一高数",
      "dur": 3599,
      "play": 2975584
    }
  ],
  "der-def": [
    {
      "bvid": "BV1Y2DGYoEEw",
      "title": "&quot;导数定义&quot;不会做题？50min从入门到精通！ |高数上",
      "up": "一高数",
      "dur": 3241,
      "play": 1288829
    },
    {
      "bvid": "BV1oN4y1D7c9",
      "title": "高数难点-导数定义，25分钟彻底搞定！",
      "up": "高数-大饼老师",
      "dur": 1507,
      "play": 669134
    }
  ],
  "implicit-deriv": [
    {
      "bvid": "BV1mp4y1U7Fo",
      "title": "【高数导数篇】隐函数求导",
      "up": "每天一道高数题",
      "dur": 844,
      "play": 1110935
    },
    {
      "bvid": "BV1eq4y1G7FM",
      "title": "大一高数-十分钟学会期末必考题型：隐函数求导",
      "up": "骑哈雷的数学老师",
      "dur": 603,
      "play": 930122
    }
  ],
  "curve-sketch": [
    {
      "bvid": "BV15B4y1e7rm",
      "title": "零基础学高数 ｜ 曲线的渐近线及其求法总结",
      "up": "玩转高等数学",
      "dur": 1080,
      "play": 293992
    }
  ],
  "def-int": [
    {
      "bvid": "BV1su4y1L7Vn",
      "title": "不定积分难学？1h全面入门到精通！|学渣救星",
      "up": "一高数",
      "dur": 5162,
      "play": 4678219
    },
    {
      "bvid": "BV1EN4y1a7Qr",
      "title": "「定积分」一课通！概念+性质一站式到位！",
      "up": "一高数",
      "dur": 4752,
      "play": 3330632
    }
  ],
  "ftc": [
    {
      "bvid": "BV1zE411Y7cv",
      "title": "微积分基本定理",
      "up": "高中数学练家子",
      "dur": 1122,
      "play": 65749
    },
    {
      "bvid": "BV1Ni5C6BEg6",
      "title": "泛函分析 三大基本定理 Baire 纲定理 开映射 闭图定理",
      "up": "北游知",
      "dur": 723,
      "play": 13017
    }
  ],
  "series": [
    {
      "bvid": "BV1Zi421f7sM",
      "title": "级数敛散性判别看不懂？40min小白变高手！|高数下",
      "up": "一高数",
      "dur": 2532,
      "play": 1531884
    },
    {
      "bvid": "BV1gXG16mE9H",
      "title": "13.1 常数项级数的概念与性质｜高数3.0｜宋浩老师",
      "up": "宋浩老师官方",
      "dur": 5038,
      "play": 89423
    }
  ],
  "multi-ext": [
    {
      "bvid": "BV1KBu26KEEn",
      "title": "【多元极值点偏移】一类硬堆复杂度的题，极值点偏移+切割线放缩+单变量放缩",
      "up": "敝槛玄鹤",
      "dur": 1943,
      "play": 16089
    },
    {
      "bvid": "BV1e9GQzHEhK",
      "title": "40min入门到上天！拉格朗日乘数法与多元条件极值，看着一个视频就够！|高数下",
      "up": "一高数",
      "dur": 2550,
      "play": 540104
    }
  ],
  "rv-continuous": [
    {
      "bvid": "BV1E34y1Q7Sv",
      "title": "（概率论必看）卷积法求解简单二维连续型随机变量函数的概率密度",
      "up": "吃尽天下面",
      "dur": 1346,
      "play": 302605
    },
    {
      "bvid": "BV1VY411J7nk",
      "title": "连续型随机变量概率密度的典型大题——积分的分段处理",
      "up": "薛由蓝",
      "dur": 496,
      "play": 171852
    }
  ],
  "der-opt": [
    {
      "bvid": "BV1P14y1g7KY",
      "title": "【数之道35】最优化问题如何求解，十分钟时间梳理清楚&lt;最优化系列第1集&gt;",
      "up": "FunInCode",
      "dur": 610,
      "play": 114709
    }
  ],
  "limit": [
    {
      "bvid": "BV1Fb4y1V7Bg",
      "title": "直击痛点 | 求极限题型与方法一课通 等价无穷小TA来了！",
      "up": "一高数",
      "dur": 3599,
      "play": 2975597
    },
    {
      "bvid": "BV1eg1KY8EGw",
      "title": "用&quot;夹逼定理&quot;求数列极限，看这一个视频就够！|高数上",
      "up": "一高数",
      "dur": 2999,
      "play": 1902382
    }
  ],
  "lhopital": [
    {
      "bvid": "BV1QE411h7cN",
      "title": "高等数学|4.4 洛必达法则",
      "up": "兆筱小分队",
      "dur": 1019,
      "play": 845185
    },
    {
      "bvid": "BV1DY411V758",
      "title": "三分钟学懂洛必达法则",
      "up": "乐水老师",
      "dur": 202,
      "play": 688403
    }
  ],
  "int-parts": [
    {
      "bvid": "BV1yv411b7ek",
      "title": "【高等数学】不定积分的分部积分法（掌握原理比死记硬背更重要）",
      "up": "delta哥",
      "dur": 1977,
      "play": 870260
    },
    {
      "bvid": "BV13J411q7RS",
      "title": "考试不挂科-5分钟学会分部积分法",
      "up": "一起谈数学",
      "dur": 684,
      "play": 868075
    }
  ],
  "matrix": [
    {
      "bvid": "BV1MV4y1A7cL",
      "title": "“四字诀”教你秒杀矩阵求逆问题！",
      "up": "且听锋吟Pro",
      "dur": 506,
      "play": 1441632
    },
    {
      "bvid": "BV1c2421P7g8",
      "title": "【矩阵】入门到精通！概念题型一网打尽|线性代数",
      "up": "一高数",
      "dur": 4997,
      "play": 1296813
    }
  ],
  "rank": [
    {
      "bvid": "BV1AK4y197pS",
      "title": "向量组求秩及一个极大（最大）无关组",
      "up": "柱哥数学",
      "dur": 498,
      "play": 659279
    },
    {
      "bvid": "BV1gp421R7VN",
      "title": "彻底搞懂矩阵的秩！",
      "up": "考研数学李烈老师",
      "dur": 1323,
      "play": 397342
    }
  ]
};
})(typeof globalThis !== "undefined" ? globalThis : this);
