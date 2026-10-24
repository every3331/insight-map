/* 洞见 · 跨学段错题地图 —— 知识库
 *
 * 主线：函数性质（高中）→ 导数 → 极限 → 洛必达 / 定积分
 * 学段：高中（人教A版）+ 大学（高等数学·上册）。初中部分按「已掌握」处理，不再入图。
 *
 * 同时被浏览器和 Node 服务端加载（UMD），白名单、召回、兜底只有一份实现。
 */
(function (root) {
  'use strict';

  var LEVELS = [
    { key: 'sen', name: '高中', full: '人教A版 · 高中' },
    { key: 'uni', name: '大学', full: '高等数学 · 上册' }
  ];

  var ERROR_TYPES = {
    sen: ['符号错误', '概念混淆', '分类讨论不全', '换元不当', '运算跳步'],
    uni: ['条件遗漏', '定理误用', '概念混淆', '推演跳步', '极限判错']
  };
  var ALL_TYPES = [];
  ['sen', 'uni'].forEach(function (lv) {
    ERROR_TYPES[lv].forEach(function (t) { if (ALL_TYPES.indexOf(t) < 0) { ALL_TYPES.push(t); } });
  });

  /* ───────── 知识节点（19 个，全部高中 + 大学） ───────── */
  var NODES = [
    { id: 'func-prop', label: '函数性质', level: 'sen', book: '高中·必修一', chapter: '第3章 函数的概念与性质', code: '3.2', prereq: '',
      kw: ['单调性', '奇偶性', '函数性质', '增函数', '减函数', '定义域', '值域'] },
    { id: 'exp-log',   label: '指数对数', level: 'sen', book: '高中·必修一', chapter: '第4章 指数函数与对数函数', code: '4.2', prereq: 'func-prop',
      kw: ['指数函数', '对数', 'ln', 'log', 'e^x'] },
    { id: 'trig',      label: '三角函数', level: 'sen', book: '高中·必修一', chapter: '第5章 三角函数', code: '5.4', prereq: 'func-prop',
      kw: ['三角函数', '诱导公式', '和差化积', '弧度', '#sin', '#cos', '#tan'] },
    { id: 'seq',       label: '数列',     level: 'sen', book: '高中·选必二', chapter: '第4章 数列', code: '4.3', prereq: '',
      kw: ['数列', '等差', '等比', '通项', '求和', '前n项'] },
    { id: 'der-con',   label: '导数概念', level: 'sen', book: '高中·选必二', chapter: '第5章 导数及其应用', code: '5.1', prereq: 'func-prop',
      kw: ['导数概念', '平均变化率', '瞬时变化率', '导数的几何意义', '切线斜率', '割线'] },
    { id: 'der-calc',  label: '导数运算', level: 'sen', book: '高中·选必二', chapter: '第5章 导数及其应用', code: '5.2', prereq: 'der-con',
      kw: ['求导公式', '幂函数求导', '求导法则', '复合函数求导', '链式法则', '(x^n)', '#求导'] },
    { id: 'der-app',   label: '导数应用', level: 'sen', book: '高中·选必二', chapter: '第5章 导数及其应用', code: '5.3', prereq: 'der-calc',
      kw: ['单调区间', '单调递增', '单调递减', '递增区间', '递减区间', '极值', '极大值', '极小值', '用导数求最值', '导数应用'] },
    { id: 'func-zero', label: '函数零点', level: 'sen', book: '高中·必修一', chapter: '第4章 函数的应用', code: '4.5', prereq: 'der-app',
      kw: ['零点', '零点存在定理', '二分法', '根的个数'] },
    { id: 'ineq-proof',label: '不等式证明', level: 'sen', book: '高中·必修一', chapter: '第2章 一元二次函数与不等式', code: '2.3', prereq: 'der-app',
      kw: ['不等式证明', '恒成立', '放缩', '构造函数证明'] },

    { id: 'limit',     label: '极限',     level: 'uni', book: '高数·上册', chapter: '第1章 函数与极限', code: '1.3', prereq: 'seq',
      kw: ['#极限', '#lim', '趋于', '无穷小', '夹逼', '未定式'] },
    { id: 'continuous',label: '连续',     level: 'uni', book: '高数·上册', chapter: '第1章 函数与极限', code: '1.5', prereq: 'limit',
      kw: ['连续', '间断点', '左连续', '右连续', '可去间断'] },
    { id: 'der-def',   label: '导数定义', level: 'uni', book: '高数·上册', chapter: '第2章 导数与微分', code: '2.1', prereq: 'der-con',
      kw: ['导数定义', '定义求导', '用定义', 'Δy/Δx', '可导', '左导数', '右导数'] },
    { id: 'der-rule',  label: '求导法则', level: 'uni', book: '高数·上册', chapter: '第2章 导数与微分', code: '2.2', prereq: 'der-def',
      kw: ['求导法则', '四则运算求导', '高阶导数', '隐函数求导', '反函数求导'] },
    { id: 'mvt',       label: '中值定理', level: 'uni', book: '高数·上册', chapter: '第3章 微分中值定理', code: '3.1', prereq: 'der-rule',
      kw: ['中值定理', '罗尔', '拉格朗日', '柯西中值', '三个条件'] },
    { id: 'lhopital',  label: '洛必达',   level: 'uni', book: '高数·上册', chapter: '第3章 微分中值定理', code: '3.2', prereq: 'mvt',
      kw: ['洛必达', '洛必达法则', '上下求导', '未定式求极限', '#0/0', '#∞/∞'] },
    { id: 'taylor',    label: '泰勒公式', level: 'uni', book: '高数·上册', chapter: '第3章 微分中值定理', code: '3.3', prereq: 'mvt',
      kw: ['泰勒', '麦克劳林', '展开式', '佩亚诺', '拉格朗日余项'] },
    { id: 'indef-int', label: '不定积分', level: 'uni', book: '高数·上册', chapter: '第4章 不定积分', code: '4.1', prereq: 'der-rule',
      kw: ['不定积分', '原函数', '凑微分', '换元积分', '分部积分'] },
    { id: 'def-int',   label: '定积分',   level: 'uni', book: '高数·上册', chapter: '第5章 定积分', code: '5.1', prereq: 'limit',
      kw: ['定积分', '积分上限', '黎曼和', '分割', '面积'] },
    { id: 'ftc',       label: '基本定理', level: 'uni', book: '高数·上册', chapter: '第5章 定积分', code: '5.3', prereq: 'def-int',
      kw: ['微积分基本定理', '牛顿-莱布尼茨', '变上限积分', '积分求导'] }
  ];

  /* 无向边；第三位为 1 表示跨学段 */
  var EDGES = [
    ['func-prop', 'exp-log'], ['func-prop', 'trig'], ['func-prop', 'der-con'],
    ['der-con', 'der-calc'], ['der-calc', 'der-app'],
    ['der-app', 'func-zero'], ['der-app', 'ineq-proof'],
    ['exp-log', 'der-calc'], ['trig', 'der-calc'],
    ['der-calc', 'der-def', 1], ['seq', 'limit', 1],
    ['limit', 'continuous'], ['continuous', 'der-def'], ['der-def', 'der-rule'],
    ['der-rule', 'mvt'], ['mvt', 'lhopital'], ['mvt', 'taylor'],
    ['der-rule', 'indef-int'], ['limit', 'def-int'], ['indef-int', 'ftc'], ['def-int', 'ftc']
  ];

  /* ───────── 三道示例错题（都带图） ───────── */
  var SAMPLES = [
    {
      chip: '① 导数定义 · 大学',
      text:
        '用导数定义求 f(x) = x² 在 x = 1 处的导数。\n' +
        '我的写法：f′(1) = 2x = 2。\n' +
        '先把 x = 1 代进导函数，得到 2，所以答案是 2。',
      right: false,
      yourAnswer: 'f′(1) = 2x = 2',
      rightAnswer: 'f′(1) = lim(Δx→0) [(1+Δx)² − 1] / Δx = 2',
      reason: '结果碰巧对了，但过程不成立。题目要求「用定义求」，必须先写差商再取极限；你直接拿导函数代值，等于把要证的结论当成已知。',
      steps: [
        '写出差商：Δy/Δx = [(1 + Δx)² − 1] / Δx',
        '展开分子：1 + 2Δx + Δx² − 1 = 2Δx + Δx²',
        '约去 Δx：Δy/Δx = 2 + Δx',
        '取极限：lim(Δx→0)(2 + Δx) = 2，所以 f′(1) = 2'
      ],
      plot: { expr: 'x^2', range: [-1, 3], tangent: { x: 1, slope: 2 } }
    },
    {
      chip: '② 洛必达 · 大学',
      text:
        '求极限 lim(x→0) sinx / x。\n' +
        '我的解法：这是 0/0 型，用洛必达法则，上下分别求导得 cosx / 1，\n' +
        '再把 x = 0 代进去，得到 1。',
      right: false,
      yourAnswer: '0/0 型 → 洛必达 → cosx/1 → 1',
      rightAnswer: '用夹逼定理，或直接用重要极限 lim(x→0) sinx/x = 1',
      reason: '结论对，方法不能用。洛必达要求 (sinx)′ = cosx 已知，而这个导数本身就是用 lim(sinx/x)=1 推出来的——用洛必达证它等于循环论证。',
      steps: [
        '先判断结构：0/0 型确实满足，但「可导」这一条要单独验',
        '(sinx)′ = cosx 的推导依赖 lim(sinx/x) = 1，不能反过来用',
        '改用夹逼：0 < |x| < π/2 时，cosx < sinx/x < 1',
        '两端极限都为 1，由夹逼定理得 lim(x→0) sinx/x = 1'
      ],
      plot: { expr: 'sin(x)/x', range: [-12, 12] }
    },
    {
      chip: '③ 导数应用 · 高中',
      text:
        '求 f(x) = x³ − 3x 的单调递增区间。\n' +
        '我求导得 f′(x) = 3x² − 3，令 3x² − 3 > 0 得 x > 1，\n' +
        '所以单调递增区间是 (1, +∞)。',
      right: false,
      yourAnswer: '递增区间 (1, +∞)',
      rightAnswer: '递增区间 (−∞, −1) ∪ (1, +∞)',
      reason: '解 3x² − 3 > 0 时只取了正的那一支。x² > 1 的解是 x > 1 或 x < −1，两支都属于递增区间，你丢掉了一半。',
      steps: [
        '求导：f′(x) = 3x² − 3 = 3(x² − 1)',
        '令 f′(x) > 0，即 x² > 1',
        '解得 x > 1 或 x < −1，两段都要',
        '所以递增区间是 (−∞, −1) 和 (1, +∞)，不能用并集之外的写法漏掉一支'
      ],
      plot: { expr: 'x^3-3x', range: [-2.6, 2.6], deriv: true,
        marks: [{ x: -1, y: 2, kind: 'good' }, { x: 1, y: -2, kind: 'good' }] }
    }
  ];

  /* ───────── 变式题 ───────── */
  var VARIANTS = {
    'der-def': {
      stem: '用导数定义求 f(x) = x³ 在 x = 2 处的导数，结果是',
      options: [{ k: 'A', t: '12' }, { k: 'B', t: '8' }, { k: 'C', t: '3x²' }, { k: 'D', t: '6' }],
      answer: 'A',
      hint: '定义题必须出现 Δy/Δx 和 Δx→0 两个东西，缺一个就是没按要求做。',
      steps: [
        '写出差商：[(2+Δx)³ − 8] / Δx',
        '展开分子：8 + 12Δx + 6Δx² + Δx³ − 8',
        '约去 Δx：12 + 6Δx + Δx²',
        '令 Δx→0，得 12，所以 f′(2) = 12'
      ]
    },
    lhopital: {
      stem: '求 lim(x→0) (eˣ − 1) / x，正确结果是',
      options: [{ k: 'A', t: '1' }, { k: 'B', t: '0' }, { k: 'C', t: 'e' }, { k: 'D', t: '不存在' }],
      answer: 'A',
      hint: '用洛必达的三条前提要逐条过一遍，别只看到 0/0 就动手。',
      steps: [
        '定型：x→0 时分子分母都→0，是 0/0 型',
        '验证邻域可导，且导数之比的极限存在',
        '上下求导得 eˣ / 1',
        '代 x=0 得 1，所以极限是 1'
      ]
    },
    'der-app': {
      stem: 'f(x) = x³ − 3x 的单调递减区间是',
      options: [
        { k: 'A', t: '(−1, 1)' },
        { k: 'B', t: '(1, +∞)' },
        { k: 'C', t: '(−∞, −1)' },
        { k: 'D', t: '(−∞, −1) ∪ (1, +∞)' }
      ],
      answer: 'A',
      hint: '递减要的是 f′(x) < 0，不是 > 0；解不等式时两个分支都要留。',
      steps: [
        '求导：f′(x) = 3x² − 3',
        '令 f′(x) < 0，即 x² < 1',
        '解得 −1 < x < 1',
        '所以递减区间是 (−1, 1)，注意这里只有一段'
      ]
    },
    'der-con': {
      stem: 'f(x) = x² 在 x = 1 处的瞬时变化率是',
      options: [{ k: 'A', t: '2' }, { k: 'B', t: '1' }, { k: 'C', t: '2x' }, { k: 'D', t: '0' }],
      answer: 'A',
      hint: '瞬时变化率 = 平均变化率取极限，题目问的是某一点的值。',
      steps: [
        '写平均变化率：[f(1+h) − f(1)] / h',
        '代入 f(x)=x²：(1+2h+h²−1)/h = 2 + h',
        '让 h→0',
        '得 2，所以瞬时变化率是 2'
      ]
    },
    mvt: {
      stem: '罗尔定理成立的三个条件是',
      options: [
        { k: 'A', t: '闭区间连续、开区间可导、两端函数值相等' },
        { k: 'B', t: '闭区间连续、开区间可导、两端函数值异号' },
        { k: 'C', t: '开区间连续、闭区间可导、存在零点' },
        { k: 'D', t: '只要函数连续就够了' }
      ],
      answer: 'A',
      hint: '三个条件缺一不可，尤其是「端点函数值相等」——这是罗尔区别于拉格朗日的地方。',
      steps: [
        '条件一：在 [a,b] 上连续',
        '条件二：在 (a,b) 内可导',
        '条件三：f(a) = f(b)',
        '结论：存在 ξ∈(a,b) 使 f′(ξ)=0'
      ]
    },
    'der-calc': {
      stem: 'f(x) = x·sin(x) 的导数是',
      options: [
        { k: 'A', t: 'sinx + x·cosx' },
        { k: 'B', t: 'cosx' },
        { k: 'C', t: 'x·cosx' },
        { k: 'D', t: 'sinx − x·cosx' }
      ],
      answer: 'A',
      hint: '乘积法则：(uv)′ = u′v + uv′，两项都要，都是加号。',
      steps: [
        '套乘积法则：(uv)′ = u′v + uv′',
        'u = x，u′ = 1；v = sinx，v′ = cosx',
        '代入：1·sinx + x·cosx',
        '所以导数是 sinx + x·cosx'
      ]
    },
    limit: {
      stem: 'lim(x→0) (1 − cosx) / x² 等于',
      options: [{ k: 'A', t: '1/2' }, { k: 'B', t: '0' }, { k: 'C', t: '1' }, { k: 'D', t: '不存在' }],
      answer: 'A',
      hint: '等价无穷小 1 − cosx ~ x²/2，比洛必达更快。',
      steps: [
        '定型：0/0 型',
        '用等价无穷小：1 − cosx ~ x²/2',
        '原式 = lim (x²/2) / x²',
        '得 1/2'
      ]
    }
  };
  /* ───────── 前置探针 ───────── */
  var PROBES = {
    'der-def': {
      nodeId: 'der-con',
      why: '你卡在导数定义，但导数定义是从高中的瞬时变化率长出来的。先回高中敲一下地基。',
      stem: '导数 f′(x₀) 的定义式是下面哪一个？',
      options: [
        { k: 'A', t: 'lim(Δx→0) [f(x₀+Δx) − f(x₀)] / Δx' },
        { k: 'B', t: '[f(x₀+Δx) − f(x₀)] / Δx' },
        { k: 'C', t: 'lim(Δx→0) f(x₀+Δx) / Δx' },
        { k: 'D', t: 'f(x₀+Δx) − f(x₀)' }
      ],
      answer: 'A',
      hint: '定义式的两个要害：差商，以及 Δx→0 的极限。少一个都不叫导数。'
    },
    lhopital: {
      nodeId: 'mvt',
      why: '洛必达不是独立公式，它是中值定理的推论。定理前提没搞清，用它就是碰运气。',
      stem: '洛必达法则要成立，必须满足下面哪一组条件？',
      options: [
        { k: 'A', t: '0/0 或 ∞/∞ 型、去心邻域内可导、导数之比的极限存在' },
        { k: 'B', t: '只要是 0/0 型就能用' },
        { k: 'C', t: '函数连续且极限存在' },
        { k: 'D', t: '分子分母都可导即可' }
      ],
      answer: 'A',
      hint: '三个条件是一条链：型要满足、邻域要可导、求导后的极限要存在。缺一条都不能下结论。'
    },
    'der-app': {
      nodeId: 'der-calc',
      why: '单调区间错在「解不等式漏一半」，往上追，是求导和因式分解不熟。',
      stem: 'f(x) = x³ − 3x 的导数是',
      options: [
        { k: 'A', t: '3x² − 3' },
        { k: 'B', t: '3x²' },
        { k: 'C', t: 'x² − 3' },
        { k: 'D', t: '3x² − 3x' }
      ],
      answer: 'A',
      hint: '逐项求导：(x³)′ = 3x²，(3x)′ = 3。'
    }
  };

  /* ───────── 自行出题：题库（都带图） ───────── */
  var GEN_BANK = [
    {
      id: 'g1', nodeId: 'der-calc', errorType: '概念混淆',
      stem: 'f(x) = x·sin(x) 的导数是？',
      options: [
        { k: 'A', t: 'sinx + x·cosx' },
        { k: 'B', t: 'cosx' },
        { k: 'C', t: 'x·cosx' },
        { k: 'D', t: 'sinx − x·cosx' }
      ],
      answer: 'A',
      why: {
        B: '这是把 (uv)′ 当成了 u′v′，乘积的导数不是各自求导再乘。',
        C: '漏了 u′v 这一项，乘积法则是 (uv)′ = u′v + uv′。',
        D: '中间项的符号错了，乘积法则里两项都是加号。'
      },
      steps: ['套乘积法则：(uv)′ = u′v + uv′', 'u = x，u′ = 1；v = sinx，v′ = cosx', '(x·sinx)′ = 1·sinx + x·cosx', '所以结果是 sinx + x·cosx'],
      plot: { expr: 'x*sin(x)', range: [-8, 8], deriv: true }
    },
    {
      id: 'g2', nodeId: 'der-app', errorType: '运算跳步',
      stem: 'f(x) = x³ − 3x 的极大值是？',
      options: [{ k: 'A', t: '2' }, { k: 'B', t: '−2' }, { k: 'C', t: '0' }, { k: 'D', t: '1' }],
      answer: 'A',
      why: {
        B: '这是极小值。x = −1 时 f = 2 是极大，x = 1 时 f = −2 是极小，两个别弄反。',
        C: '0 是 f(0)，不是极值点——f′(0) = −3 ≠ 0，这里根本不是驻点。',
        D: '1 是驻点的横坐标，不是函数值。'
      },
      steps: ['求导：f′(x) = 3x² − 3 = 3(x−1)(x+1)', '令 f′(x)=0 得 x = −1 或 x = 1', 'f(−1) = −1 + 3 = 2，f(1) = 1 − 3 = −2', 'f′ 在 x=−1 两侧由正变负，所以极大值是 2'],
      plot: { expr: 'x^3-3x', range: [-2.6, 2.6], deriv: true, marks: [{ x: -1, y: 2, kind: 'good' }, { x: 1, y: -2, kind: 'bad' }] }
    },
    {
      id: 'g3', nodeId: 'limit', errorType: '极限判错',
      stem: 'lim(x→0) (1 − cosx) / x² 等于？',
      options: [{ k: 'A', t: '1/2' }, { k: 'B', t: '0' }, { k: 'C', t: '1' }, { k: 'D', t: '不存在' }],
      answer: 'A',
      why: {
        B: '直接代 x=0 得到 0/0，0/0 不是 0，是未定式。',
        C: '把 1−cosx 当成了 x²/2 的两倍，系数多了一倍。',
        D: '这个极限存在。0/0 型只说明不能直接代，不说明不存在。'
      },
      steps: ['先定型：x→0 时分子分母都→0，是 0/0 型', '用等价无穷小：1 − cosx ~ x²/2', '原式 = lim (x²/2) / x² = 1/2', '也可以用洛必达：上下求导得 sinx/(2x) → 1/2'],
      plot: { expr: '(1-cos(x))/x^2', range: [-4, 4] }
    },
    {
      id: 'g4', nodeId: 'lhopital', errorType: '条件遗漏',
      stem: 'lim(x→0) (eˣ − 1) / x 等于？',
      options: [{ k: 'A', t: '1' }, { k: 'B', t: '0' }, { k: 'C', t: 'e' }, { k: 'D', t: '∞' }],
      answer: 'A',
      why: {
        B: '把 e⁰ − 1 = 0 当成了答案。分子为 0 说明是 0/0 型，还得继续算。',
        C: 'e 是 e¹，这里 x→0 不是 x→1。',
        D: '这个极限存在且有限，趋近过程不是发散。'
      },
      steps: ['定型：x→0 时分子→0、分母→0，0/0 型', '验证洛必达条件：邻域内可导，导数之比极限存在', '上下求导：eˣ / 1', '代 x=0 得 1，所以极限是 1'],
      plot: { expr: '(e^x-1)/x', range: [-4, 4] }
    },
    {
      id: 'g5', nodeId: 'der-def', errorType: '概念混淆',
      stem: '用导数定义求 f(x) = √x 在 x = 1 处的导数，结果是？',
      options: [{ k: 'A', t: '1/2' }, { k: 'B', t: '1' }, { k: 'C', t: '2' }, { k: 'D', t: '不存在' }],
      answer: 'A',
      why: {
        B: '这是 f(1) 的值，不是导数。函数值和导数值是两回事。',
        C: '这是 1/(1/2) 的倒数，把有理化的结果倒过来了。',
        D: '√x 在 x=1 附近光滑，导数存在。'
      },
      steps: ['差商：[√(1+Δx) − 1] / Δx', '分子有理化：乘 [√(1+Δx) + 1] / [√(1+Δx) + 1]', '得 Δx / (Δx·(√(1+Δx)+1)) = 1/(√(1+Δx)+1)', '取极限：1/(1+1) = 1/2'],
      plot: { expr: 'sqrt(x)', range: [-1, 6], tangent: { x: 1, slope: 0.5 } }
    },
    {
      id: 'g6', nodeId: 'continuous', errorType: '概念混淆',
      stem: 'f(x) = 1/x 在 x = 0 处的间断类型是？',
      options: [{ k: 'A', t: '无穷间断点' }, { k: 'B', t: '可去间断点' }, { k: 'C', t: '跳跃间断点' }, { k: 'D', t: '连续' }],
      answer: 'A',
      why: {
        B: '可去间断要求左右极限都存在且相等，这里左右极限都是无穷。',
        C: '跳跃间断要求左右极限都存在但不相等，这里两侧都发散。',
        D: 'x=0 不在定义域内，谈不上连续。'
      },
      steps: ['看定义域：x = 0 处函数无定义', '看左右极限：x→0⁺ 时 1/x → +∞，x→0⁻ 时 → −∞', '极限不存在且为无穷', '所以是无穷间断点'],
      plot: { expr: '1/x', range: [-4, 4] }
    },
    {
      id: 'g7', nodeId: 'der-con', errorType: '概念混淆',
      stem: 'f(x) = x² 在 x = 1 处的切线斜率是？',
      options: [{ k: 'A', t: '2' }, { k: 'B', t: '1' }, { k: 'C', t: '2x' }, { k: 'D', t: '0' }],
      answer: 'A',
      why: {
        B: '这是 f(1) 的函数值，不是斜率。切线的斜率是导数。',
        C: '2x 是导函数，题目问的是在 x=1 这一点的值，得代进去。',
        D: '斜率为 0 意味着切线水平，但 x=1 处抛物线明显还在上升。'
      },
      steps: ['切线斜率 = 该点导数', 'f′(x) = 2x', 'f′(1) = 2', '所以斜率是 2'],
      plot: { expr: 'x^2', range: [-1, 3], tangent: { x: 1, slope: 2 } }
    },
    {
      id: 'g8', nodeId: 'der-app', errorType: '分类讨论不全',
      stem: 'f(x) = x³ − 3x 在 [0, 2] 上的最大值是？',
      options: [{ k: 'A', t: '2' }, { k: 'B', t: '0' }, { k: 'C', t: '−2' }, { k: 'D', t: '1' }],
      answer: 'A',
      why: {
        B: '这是 f(0)，你只比较了端点，漏掉区间内部的驻点。',
        C: '−2 是 x=1 处的极小值，闭区间求最值要把端点和驻点一起比。',
        D: '1 是驻点的横坐标，不是函数值。'
      },
      steps: ['求导：f′(x) = 3x² − 3，驻点 x = ±1', '区间 [0,2] 内只有 x = 1', 'f(0)=0，f(1)=−2，f(2)=2', '比较三个值，最大值是 2'],
      plot: { expr: 'x^3-3x', range: [0, 2], deriv: true, marks: [{ x: 1, y: -2, kind: 'bad' }, { x: 2, y: 2, kind: 'good' }] }
    },
    {
      id: 'g9', nodeId: 'exp-log', errorType: '运算跳步',
      stem: 'log₂8 + log₂(1/4) 等于？',
      options: [{ k: 'A', t: '1' }, { k: 'B', t: '5' }, { k: 'C', t: '−1' }, { k: 'D', t: '2' }],
      answer: 'A',
      why: {
        B: '把 log₂(1/4) 当成了 2，其实 1/4 是真数小于 1，对数为负。',
        C: 'log₂8 = 3 这一步没算，只留了后半截。',
        D: '8 ÷ 4 = 2 的直觉用错了地方，对数里 1/4 的底是 2 的 −2 次方。'
      },
      steps: ['log₂8 = 3，因为 2³ = 8', 'log₂(1/4) = −2，因为 2⁻² = 1/4', '3 + (−2) = 1', '所以答案是 1']
    },
    {
      id: 'g10', nodeId: 'trig', errorType: '符号错误',
      stem: 'sin(π/6) + cos(π/3) 等于？',
      options: [{ k: 'A', t: '1' }, { k: 'B', t: '0' }, { k: 'C', t: '√3' }, { k: 'D', t: '1/2' }],
      answer: 'A',
      why: {
        B: '你把其中一个记成了负数，π/6 和 π/3 都在第一象限，正弦余弦都是正的。',
        C: '√3 是 tan(π/3)，不是这两个值之和。',
        D: '只算了其中一项，另一项也是 1/2。'
      },
      steps: ['sin(π/6) = 1/2', 'cos(π/3) = 1/2', '1/2 + 1/2 = 1', '所以答案是 1']
    },
    {
      id: 'g11', nodeId: 'der-rule', errorType: '概念混淆',
      stem: 'f(x) = ln(x) 的导数是？',
      options: [{ k: 'A', t: '1/x' }, { k: 'B', t: 'x' }, { k: 'C', t: 'e^x' }, { k: 'D', t: '1/ln(x)' }],
      answer: 'A',
      why: {
        B: '这是幂函数 x 的导数，ln(x) 是超越函数。',
        C: 'e^x 的导数才是 e^x，别把 ln 和 e 混了。',
        D: '把函数和它的倒数搞混了，1/ln(x) 不在导数公式表里。'
      },
      steps: ['基本导数公式：(ln x)′ = 1/x', '复合函数 ln(u) 则要乘 u′：1/u · u′', '本题 u = x，u′ = 1', '所以导数是 1/x'],
      plot: { expr: 'ln(x)', range: [0, 6] }
    },
    {
      id: 'g12', nodeId: 'mvt', errorType: '定理误用',
      stem: '拉格朗日中值定理的结论是：存在 ξ ∈ (a,b)，使得 f′(ξ) 等于？',
      options: [
        { k: 'A', t: '[f(b) − f(a)] / (b − a)' },
        { k: 'B', t: 'f(b) − f(a)' },
        { k: 'C', t: '0' },
        { k: 'D', t: 'f(b) + f(a)' }
      ],
      answer: 'A',
      why: {
        B: '漏了除以 (b−a)，这是函数值的差，不是平均变化率。',
        C: 'f′(ξ)=0 是罗尔定理（端点值相等）的特例，不是一般结论。',
        D: '定理里没有出现两项相加。'
      },
      steps: ['前提：闭区间连续、开区间可导', '结论：存在 ξ ∈ (a,b)，f′(ξ) = [f(b)−f(a)]/(b−a)', '右端就是区间上的平均变化率', '几何意义：某点切线平行于两端点的连线']
    },
    {
      id: 'g13', nodeId: 'indef-int', errorType: '运算跳步',
      stem: '∫ x² dx 等于？',
      options: [{ k: 'A', t: 'x³/3 + C' }, { k: 'B', t: '2x + C' }, { k: 'C', t: 'x³ + C' }, { k: 'D', t: '3x² + C' }],
      answer: 'A',
      why: {
        B: '2x 是 x² 的导数，求积分是反着来，方向搞反了。',
        C: '漏了 1/3 这个系数，求导验证 (x³)′ = 3x²，回不去 x²。',
        D: '3x² 是求导不是积分。'
      },
      steps: ['幂函数积分：∫xⁿdx = xⁿ⁺¹/(n+1) + C', '这里 n = 2', '得 x³/3 + C', '验证：(x³/3)′ = x² ✓'],
      plot: { expr: 'x^2', range: [-3, 3] }
    },
    {
      id: 'g14', nodeId: 'def-int', errorType: '运算跳步',
      stem: '∫₀¹ 2x dx 等于？',
      options: [{ k: 'A', t: '1' }, { k: 'B', t: '2' }, { k: 'C', t: '1/2' }, { k: 'D', t: '0' }],
      answer: 'A',
      why: {
        B: '忘了代上下限，只用了原函数在 1 处的系数。',
        C: '把 ∫2x dx = x² 记成了 x²/2，系数搞错。',
        D: '定积分不是恒为 0，只有当上下限相等或奇函数在对称区间才是。'
      },
      steps: ['原函数：∫2x dx = x²', '牛顿-莱布尼茨：代入上下限', 'x²|₀¹ = 1² − 0² = 1', '所以结果是 1'],
      plot: { expr: '2x', range: [0, 1] }
    },
    {
      id: 'g15', nodeId: 'func-zero', errorType: '分类讨论不全',
      stem: 'f(x) = x³ − x 的零点个数是？',
      options: [{ k: 'A', t: '3' }, { k: 'B', t: '1' }, { k: 'C', t: '2' }, { k: 'D', t: '0' }],
      answer: 'A',
      why: {
        B: '只看到了 x=0 这一个解，因式分解后还有两支。',
        C: '要么漏了原点，要么把重根算重了，本题三个根互不相同。',
        D: 'f(0)=0 本身就是零点，不可能没有。'
      },
      steps: ['因式分解：x³ − x = x(x−1)(x+1)', '令其为 0 得 x = 0, 1, −1', '三个根互不相同', '所以零点是 3 个'],
      plot: { expr: 'x^3-x', range: [-2, 2], marks: [{ x: -1, y: 0, kind: 'good' }, { x: 0, y: 0, kind: 'good' }, { x: 1, y: 0, kind: 'good' }] }
    },
    {
      id: 'g16', nodeId: 'der-calc', errorType: '运算跳步',
      stem: '(x · eˣ)′ 等于？',
      options: [
        { k: 'A', t: 'eˣ(1 + x)' },
        { k: 'B', t: 'eˣ' },
        { k: 'C', t: 'x·eˣ' },
        { k: 'D', t: 'eˣ(x − 1)' }
      ],
      answer: 'A',
      why: {
        B: '把乘积求导当成了只对 eˣ 求导，漏了 x 这一项。',
        C: '漏了 (x)′·eˣ 这一项，乘积法则是两项相加。',
        D: '符号错了，两项都是加。'
      },
      steps: ['乘积法则：(uv)′ = u′v + uv′', 'u = x，u′ = 1；v = eˣ，v′ = eˣ', '(x·eˣ)′ = eˣ + x·eˣ', '提公因式得 eˣ(1 + x)'],
      plot: { expr: 'x*e^x', range: [-3, 2], deriv: true }
    }
  ];

  /* ───────── 教学资源：一数（B 站） ─────────
   * 不硬编码 BV 号（会失效、也无法核实），每条卡片是一个 B 站站内检索入口，
   * 关键词固定带「一数」，点开就是该知识点的对应视频列表。
   */
  var TEACH_OVERRIDE = {
    'der-def': [
      { t: '导数定义 · 从差商到极限', d: '一数讲定义最透的一节，配着 Δy/Δx 的图理解', tag: '概念', q: '一数 导数定义' },
      { t: '用定义求导 · 典型题型', d: '定义题怎么写过程才不丢分', tag: '题型', q: '一数 导数定义 题型' }
    ],
    limit: [
      { t: '极限入门 · 七种未定式', d: '先认型再动手，一数的分类很清楚', tag: '概念', q: '一数 极限 未定式' },
      { t: '等价无穷小 · 替换技巧', d: '什么时候能换、什么时候不能换', tag: '技巧', q: '一数 等价无穷小' }
    ],
    lhopital: [
      { t: '洛必达法则 · 三条前提', d: '条件不验就用，是这一节最大的坑', tag: '概念', q: '一数 洛必达 条件' },
      { t: '洛必达 · 循环论证与反例', d: '为什么 sinx/x 不能拿它证', tag: '易错', q: '一数 洛必达 反例' }
    ],
    continuous: [
      { t: '连续与间断点分类', d: '可去 / 跳跃 / 无穷，一图分清', tag: '概念', q: '一数 连续 间断点' },
      { t: '连续 · 常考判断题', d: '连续与可导的关系最常考', tag: '题型', q: '一数 连续 可导' }
    ],
    mvt: [
      { t: '中值定理三兄弟', d: '罗尔、拉格朗日、柯西串起来讲', tag: '概念', q: '一数 中值定理' },
      { t: '中值定理 · 证明题套路', d: '构造辅助函数的几种常用思路', tag: '题型', q: '一数 中值定理 证明' }
    ],
    'der-app': [
      { t: '单调性与极值 · 标准流程', d: '求导、找驻点、看符号变化', tag: '概念', q: '一数 导数 单调性 极值' },
      { t: '导数大题 · 恒成立与参数', d: '压轴题的分类讨论怎么不重不漏', tag: '压轴', q: '一数 导数 恒成立' }
    ],
    'der-calc': [
      { t: '求导公式速记 + 复合函数', d: '链式法则一层层剥', tag: '基础', q: '一数 求导公式' },
      { t: '乘积与商的求导', d: '(uv)′ 和 (u/v)′ 别混', tag: '题型', q: '一数 乘积 求导' }
    ],
    taylor: [
      { t: '泰勒公式 · 展开到几阶', d: '余项决定展开阶数', tag: '概念', q: '一数 泰勒公式' },
      { t: '麦克劳林展开 · 常用五个', d: 'e^x、sin、cos、ln(1+x)、(1+x)^a', tag: '技巧', q: '一数 麦克劳林' }
    ]
  };

  function teachFor(id) {
    if (TEACH_OVERRIDE[id]) { return TEACH_OVERRIDE[id]; }
    var n = NODE_MAP[id];
    if (!n) { return []; }
    return [
      { t: n.label + ' · 概念与常用结论', d: '先把定义、公式、成立条件过一遍', tag: '基础', q: '一数 ' + n.label },
      { t: n.label + ' · 典型题与易错点', d: '跟一道例题，看错在哪一步', tag: '题型', q: '一数 ' + n.label + ' 题型' }
    ];
  }

  var FALLBACK_VARIANT = {
    stem: '关于这一步的解法，下面哪种做法最容易埋雷？',
    options: [
      { k: 'A', t: '先确认定理的前提条件再动手' },
      { k: 'B', t: '把公式记牢，直接套用' },
      { k: 'C', t: '先看函数形式和定义域' },
      { k: 'D', t: '算完回代检验' }
    ],
    answer: 'B',
    hint: '不理解前提下套公式，是这一层最常见的错法。'
  };

  /* 每个知识点的典型函数 */
  var NODE_FN = {
    'func-prop': 'x^3-3x', 'exp-log': 'e^x', trig: 'sin(x)', seq: '1/x',
    'der-con': 'x^2', 'der-calc': 'x^3-3x', 'der-app': 'x^3-3x',
    'func-zero': 'x^3-x', 'ineq-proof': 'x^2-1',
    limit: 'sin(x)/x', continuous: '1/x', 'der-def': 'x^2', 'der-rule': 'x*sin(x)',
    mvt: 'x^3-3x', lhopital: 'sin(x)/x', taylor: 'sin(x)',
    'indef-int': '1/x', 'def-int': 'x^2', ftc: 'sin(x)'
  };
  var NODE_FNX = {
    'der-calc': [-3, 3], 'der-app': [-2.6, 2.6], 'der-def': [-1, 3], 'func-prop': [-3, 3],
    mvt: [-3, 3], trig: [-7, 7], limit: [-12, 12], lhopital: [-12, 12],
    taylor: [-7, 7], continuous: [-4, 4], 'indef-int': [-4, 4], seq: [-4, 4]
  };
  var NODE_M = {
    'func-prop': 78, 'der-con': 72, 'exp-log': 69, 'der-calc': 64, seq: 62,
    limit: 58, trig: 55, continuous: 51, 'func-zero': 49, 'indef-int': 46,
    'der-rule': 45, 'def-int': 44, 'der-app': 41, mvt: 38,
    'ineq-proof': 36, lhopital: 33, 'der-def': 30, ftc: 30, taylor: 22
  };

  NODES.forEach(function (n) {
    if (NODE_FN[n.id]) { n.fn = NODE_FN[n.id]; }
    if (NODE_FNX[n.id]) { n.fnx = NODE_FNX[n.id]; }
    n.m = NODE_M[n.id] === undefined ? 55 : NODE_M[n.id];
  });

  var TIPS = {
    'der-def': ['回到定义：先写 Δy/Δx，再让 Δx→0，中途不能先求导', '对照：f′(x₀) = lim [f(x₀+Δx) − f(x₀)] / Δx'],
    lhopital: ['先用洛必达三条前提逐条验证：型、邻域可导、导数之比的极限存在', '若分子分母的导数本身依赖待求极限，改用等价无穷小或夹逼'],
    'der-app': ['求导 → 令 f′(x)=0 找驻点 → 看 f′ 的符号变化', '写单调区间时，导数为正的所有区间都要写出来，别漏一支'],
    limit: ['先定型：0/0、∞/∞、还是 1^∞', '能等价替换就先替换，再考虑洛必达或夹逼'],
    'der-con': ['瞬时变化率就是导数：平均变化率取极限', '几何意义：割线斜率的极限就是切线斜率'],
    'der-calc': ['先看结构：幂、积、商、复合，选对应法则', '复合函数用链式法则，从外到内一层层求'],
    mvt: ['三个前提逐条核对，缺一条结论就不成立', '常考错点：忽略「端点函数值相等」这个条件'],
    continuous: ['连续性三要素：有定义、极限存在、极限等于函数值', '间断点先分类再下结论']
  };
  function tipsOf(id) {
    return TIPS[id] || ['回到这一节的基本形式，先把条件写全再动笔', '算完之后代回原题检验，别停在结果上'];
  }

  /* ───────── 知识点介绍：定位到节点先讲清楚「这是什么」 ───────── */
  var INTRO = {
    'func-prop': {
      one: '函数的性质就是它的脾气：单调性看增减，奇偶性看对称，周期性看重复。',
      pts: ['单调性用 f′ 的符号判断；高中阶段也可以直接用定义：取值、作差、定号', '判断奇偶性前先看定义域是否关于原点对称'],
      trap: '定义域不对称就直接说非奇非偶，别再往下算 f(−x)。'
    },
    'exp-log': {
      one: '指数把加法变成乘法，对数把乘法变成加法，两者互为反函数。',
      pts: ['logₐ(MN) = logₐM + logₐN，幂次可以提到对数前面', '换底公式 logₐb = lnb / lna，考试里很常用'],
      trap: 'log(M+N) ≠ logM + logN，加号不能拆开。'
    },
    trig: {
      one: '三角函数是把角映射成比值：单位圆上一点的横坐标是 cos，纵坐标是 sin。',
      pts: ['诱导公式记口诀：奇变偶不变，符号看象限', 'π/6、π/4、π/3 三组特殊值必须背熟'],
      trap: 'sin(π/6)=1/2、sin(π/3)=√3/2，这两个最容易记反。'
    },
    seq: {
      one: '数列是按顺序排的一列数，本质是定义在正整数上的函数。',
      pts: ['等差看公差，等比看公比', '求通项优先找递推关系；求和先判断是等差还是等比'],
      trap: '等比求和公式要求 q ≠ 1，q = 1 的情况必须单独讨论。'
    },
    'der-con': {
      one: '导数就是瞬时变化率：让平均变化率的 Δx→0，割线就变成切线。',
      pts: ['几何意义：导数 = 该点切线的斜率', '物理意义：位移对时间的导数 = 瞬时速度'],
      trap: '把导数和函数值混为一谈——f(1) 和 f′(1) 完全是两个东西。'
    },
    'der-calc': {
      one: '求导就是根据几条固定公式，把函数变形成它的变化率函数。',
      pts: ['(xⁿ)′ = n·xⁿ⁻¹、(sinx)′ = cosx、(eˣ)′ = eˣ、(lnx)′ = 1/x', '先认结构：幂、积、商、复合，再选对应法则'],
      trap: '(uv)′ ≠ u′v′，乘积的导数一定要用 u′v + uv′。'
    },
    'der-app': {
      one: '导数最实用的三件事：判断单调、找极值、求闭区间上的最值。',
      pts: ['f′(x) > 0 递增，f′(x) < 0 递减', '极值点在 f′ 变号的地方，不是 f′ = 0 本身'],
      trap: 'f′(x₀)=0 只是驻点，不一定是极值点（y=x³ 在 0 处就是反例）。'
    },
    'func-zero': {
      one: '零点不是点，是使 f(x)=0 的那个 x。方程的解、图像与 x 轴的交点，说的是一回事。',
      pts: ['零点存在定理：连续 + 两端异号 → 中间必有零点', '零点的个数就是方程根的个数'],
      trap: '把零点写成坐标 (a, 0)，题目问的是一个数。'
    },
    'ineq-proof': {
      one: '不等式证明两条主路：构造函数用导数求最值，或者做放缩。',
      pts: ['证 f(x) > 0 通常转化为求 f 的最小值', '放缩要有明确目标，不能随便放大或缩小'],
      trap: '用完导数直接写「显然成立」，中间的最值验证不能省。'
    },
    limit: {
      one: '极限描述的是「趋近」而不是「到达」：x 无限接近 a 时，f(x) 稳定地靠近哪个数，那个数就是极限，和 f(a) 等于几没有关系。',
      pts: ['先定型：0/0、∞/∞、1^∞，型决定了用什么方法', '等价无穷小优先 → 洛必达次之 → 夹逼兜底'],
      trap: '看到 0/0 就说「没有极限」——0/0 是未定式，不是结论。'
    },
    continuous: {
      one: '连续要同时满足三条：这一点有定义、极限存在、极限等于函数值。',
      pts: ['间断点分四类：可去、跳跃、无穷、振荡', '连续不一定可导，可导一定连续'],
      trap: '把「极限存在」直接当成「连续」，漏掉了等于函数值这一步。'
    },
    'der-def': {
      one: '导数的定义是一个极限：f′(x₀) = lim(Δx→0) [f(x₀+Δx) − f(x₀)] / Δx，先写差商，再取极限。',
      pts: ['定义题必须出现 Δy/Δx 和 Δx→0 两步，少一个就是没按要求做', '可导必连续，连续不一定可导'],
      trap: '拿导函数直接代值——等于把要证的结论当成了已知。'
    },
    'der-rule': {
      one: '求导法则把复杂函数的求导拆成几条固定套路：和差、乘积、商、复合。',
      pts: ['复合函数用链式法则，从外到内一层层剥', '高阶导数就是对导数再求一次导'],
      trap: '链式法则漏乘内层导数：(sin2x)′ = 2cos2x，不是 cos2x。'
    },
    mvt: {
      one: '中值定理说：在一段光滑曲线上，总存在某一点，它的切线平行于两端点的连线。',
      pts: ['罗尔：端点值相等 → 存在 ξ 使 f′(ξ)=0', '拉格朗日：f′(ξ) = [f(b)−f(a)]/(b−a)', '柯西：两个函数之比的形式，是拉格朗日的推广'],
      trap: '三个前提少验一条，结论就不成立，这是最常见的扣分点。'
    },
    lhopital: {
      one: '洛必达把「求极限」变成「求导再求极限」，但它有严格前提，不是万能钥匙。',
      pts: ['必须是 0/0 或 ∞/∞ 型', '去心邻域内可导，且导数之比的极限存在'],
      trap: '用洛必达去证 lim sinx/x：(sinx)′ = cosx 本身就依赖这个极限，属于循环论证。'
    },
    taylor: {
      one: '泰勒公式用多项式去逼近一个函数，阶数越高越贴近原函数。',
      pts: ['展开到几阶，由余项要求的精度决定', '记住五个常用展开：eˣ、sinx、cosx、ln(1+x)、(1+x)^α'],
      trap: '展开阶数不够就下结论，余项那一项不能丢。'
    },
    'indef-int': {
      one: '不定积分是求导的逆运算：找一个函数，使它的导数等于被积函数。',
      pts: ['结果必须带常数 C', '凑微分、换元、分部积分是三板斧'],
      trap: '忘了 +C，这是最冤的丢分。'
    },
    'def-int': {
      one: '定积分是一个数，表示曲线下的有向面积，靠牛顿-莱布尼茨公式算出来。',
      pts: ['先求原函数，再代上下限相减', '换元之后上下限要跟着换'],
      trap: '换元忘记改上下限，直接把新变量代进旧区间。'
    },
    ftc: {
      one: '微积分基本定理把「求面积」和「求原函数」这两件看起来无关的事接了起来。',
      pts: ['变上限积分求导：d/dx ∫ₐˣ f(t)dt = f(x)', '它是定积分能真正算出来的根本原因'],
      trap: '上限是复合函数时，漏乘链式法则的那一层。'
    }
  };

  function introFor(id) {
    return INTRO[id] || null;
  }

  var NODE_MAP = {};
  NODES.forEach(function (n) { NODE_MAP[n.id] = n; });

  function normalize(s) { return String(s).replace(/\s+/g, ''); }

  function scoreNode(text, n) {
    var t = normalize(text), s = 0;
    n.kw.forEach(function (k) {
      var weak = k.charAt(0) === '#';
      var kk = normalize(weak ? k.slice(1) : k);
      if (kk && t.indexOf(kk) >= 0) { s += (1 + kk.length / 8) * (weak ? 0.4 : 1); }
    });
    if (t.indexOf(normalize(n.label)) >= 0) { s += 2; }
    return s;
  }

  function degree(id) {
    var d = 0;
    EDGES.forEach(function (e) { if (e[0] === id || e[1] === id) { d++; } });
    return d;
  }

  function recallCandidates(text, k) {
    k = k || 10;
    var scored = NODES.map(function (n) { return { id: n.id, s: scoreNode(text, n) }; })
                      .filter(function (x) { return x.s > 0; })
                      .sort(function (a, b) { return b.s - a.s; });
    var out = scored.slice(0, k).map(function (x) { return x.id; });
    if (out.length < k) {
      var byDeg = NODES.slice().sort(function (a, b) { return degree(b.id) - degree(a.id); })
                        .map(function (n) { return n.id; });
      for (var i = 0; i < byDeg.length && out.length < k; i++) {
        if (out.indexOf(byDeg[i]) < 0) { out.push(byDeg[i]); }
      }
    }
    return out;
  }

  function diagnoseLocal(text) {
    var cands = recallCandidates(text, 10);
    var best = null, bestScore = -1;
    cands.forEach(function (id) {
      var s = scoreNode(text, NODE_MAP[id]);
      if (s > bestScore) { bestScore = s; best = NODE_MAP[id]; }
    });
    if (!best) { best = NODE_MAP['limit']; }

    var err = '概念混淆';
    if (best.id === 'lhopital') { err = '条件遗漏'; }
    if (best.id === 'mvt') { err = '条件遗漏'; }
    if (best.id === 'limit') { err = '极限判错'; }
    if (best.id === 'der-def') { err = '概念混淆'; }
    if (best.id === 'der-app') { err = '分类讨论不全'; }

    var DIAG = {
      'der-def': '你把导函数直接代值，等于跳过了定义里的极限过程。定义题必须写出 Δy/Δx 再取极限，不能先求导再代。',
      lhopital: '用洛必达之前没验证条件，而且 (sinx)′ = cosx 本身就依赖这个极限，构成循环论证。',
      'der-app': '导数算对了，错在解不等式：x² > 1 有两个分支，你只写了一支。',
      mvt: '中值定理的三个前提缺一不可，少一条结论就不成立。',
      limit: '极限的存在性没判清楚就往下算，后面全部作废。'
    };

    return {
      nodeId: best.id,
      errorType: ALL_TYPES.indexOf(err) >= 0 ? err : '概念混淆',
      confidence: Math.min(0.93, 0.58 + Math.max(0, bestScore) * 0.06),
      diagnosis: DIAG[best.id] || ('这道题卡在「' + best.label + '」（' + best.code + '）。先把这一节的基本形式过一遍，再做一道同类变式。')
    };
  }

  var DATA = {
    TEXTBOOK: '人教A版 高中 → 高等数学 · 函数与微积分主线',
    LEVELS: LEVELS,
    ERROR_TYPES: ERROR_TYPES,
    ALL_TYPES: ALL_TYPES,
    NODES: NODES,
    EDGES: EDGES,
    SAMPLES: SAMPLES,
    VARIANTS: VARIANTS,
    PROBES: PROBES,
    GEN_BANK: GEN_BANK,
    teachFor: teachFor,
    introFor: introFor,
    FALLBACK_VARIANT: FALLBACK_VARIANT,
    NODE_MAP: NODE_MAP,
    recallCandidates: recallCandidates,
    diagnoseLocal: diagnoseLocal,
    tipsOf: tipsOf,
    typesFor: function (id) {
      var n = NODE_MAP[id];
      return ERROR_TYPES[n ? n.level : 'uni'];
    }
  };

  root.APP_DATA = DATA;
  if (typeof module === 'object' && module.exports) { module.exports = DATA; }
})(typeof globalThis !== 'undefined' ? globalThis : this);





