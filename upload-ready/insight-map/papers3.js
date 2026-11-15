/* 洞见 · 试卷数据（三）：2023 / 2024（广东省普通专升本 · 高等数学）
 * 与 papers.js 同一 schema；同样是按考纲编写的示例结构卷，非官方真题。
 */
(function (root) {
  'use strict';
  root.PAPERS = root.PAPERS || [];

  root.PAPERS.push({
    id: 'gd-2023-demo', year: 2023, region: '广东', subject: '高等数学',
    title: '2023 年广东省普通专升本 · 高等数学（示例结构卷）',
    source: '按考纲编写的示例结构卷（非官方真题）',
    minutes: 120, total: 100,
    choice: [
      { no: 1, score: 4, stem: 'lim(x→0) (eˣ − 1) / x =', options: [{ k: 'A', t: '0' }, { k: 'B', t: '1' }, { k: 'C', t: 'e' }, { k: 'D', t: '不存在' }], answer: 'B',
        baby: { ask: 'x 靠近 0 时，(eˣ−1) 除以 x 靠近几。', idea: 'eˣ ≈ 1 + x，所以 eˣ − 1 ≈ x，比值就是 1。', steps: ['eˣ 在 0 附近约等于 1 + x', 'eˣ − 1 ≈ x', 'x / x = 1'], trap: '直接代 0 得 0/0，那不是答案。' } },
      { no: 2, score: 4, stem: 'lim(x→0) (1 − cosx) / (x·sinx) =', options: [{ k: 'A', t: '1/2' }, { k: 'B', t: '1' }, { k: 'C', t: '2' }, { k: 'D', t: '0' }], answer: 'A',
        baby: { ask: 'x 靠近 0 时，上面那点差距和 x·sinx 的比值。', idea: '分子用 1 − cosx ~ x²/2，分母用 sinx ~ x。', steps: ['分子 ≈ x²/2', '分母 ≈ x·x = x²', '比值 = (x²/2)/x² = 1/2'], trap: '分母是乘积，两个都要换成等价量，只换一个就错。' } },
      { no: 3, score: 4, stem: 'f(x) = x³ − 3x 在 x = 1 处的导数是', options: [{ k: 'A', t: '0' }, { k: 'B', t: '3' }, { k: 'C', t: '−3' }, { k: 'D', t: '6' }], answer: 'A',
        baby: { ask: 'x = 1 这一点，切线有多陡。', idea: '先求导再代值。', steps: ['f′(x) = 3x² − 3', 'f′(1) = 3 − 3 = 0'], trap: '导数为 0 不代表「没有切线」，只代表切线是水平的。' } },
      { no: 4, score: 4, stem: '∫ (2x + 3) dx =', options: [{ k: 'A', t: 'x² + 3x + C' }, { k: 'B', t: '2x² + 3x + C' }, { k: 'C', t: 'x² + 3x' }, { k: 'D', t: 'x² + C' }], answer: 'A',
        baby: { ask: '谁求导等于 2x + 3。', idea: '拆成两项分别积分。', steps: ['∫2x dx = x²', '∫3 dx = 3x', '合起来 x² + 3x + C'], trap: '常数 3 的原函数是 3x，别漏掉。' } },
      { no: 5, score: 4, stem: 'd/dx ∫₁ˣ (t² + 1) dt =', options: [{ k: 'A', t: 'x² + 1' }, { k: 'B', t: 'x²' }, { k: 'C', t: '2x' }, { k: 'D', t: 'x² + 1 − 2' }], answer: 'A',
        baby: { ask: '对「从 1 积到 x」再求导。', idea: '变上限求导：把上限代进被积函数。', steps: ['被积函数 t² + 1', '把 t 换成 x：x² + 1'], trap: '下限 1 代进去得到的常数会被导数消掉，不参与。' } },
      { no: 6, score: 4, stem: '行列式 |2 0 1; 0 3 0; 1 0 2| =', options: [{ k: 'A', t: '9' }, { k: 'B', t: '12' }, { k: 'C', t: '6' }, { k: 'D', t: '3' }], answer: 'A',
        baby: { ask: '这个三阶行列式等于多少。', idea: '按含零多的行展开最省事；也可以直接用三阶公式。', steps: ['按第一行展开：2 × |3 0; 0 2| − 0 + 1 × |0 3; 1 0|', '第一项：2 × (3×2 − 0) = 12', '第二项：1 × (0×0 − 3×1) = −3', '12 − 3 = 9'], trap: '展开时正负号交替（+ − +），第二项那个负号别丢。' } },
      { no: 7, score: 4, stem: 'A = [1 2; 3 4]，则 |A| =', options: [{ k: 'A', t: '−2' }, { k: 'B', t: '2' }, { k: 'C', t: '10' }, { k: 'D', t: '−10' }], answer: 'A',
        baby: { ask: '这个矩阵的行列式。', idea: '二阶行列式：主对角相乘减副对角相乘。', steps: ['主：1 × 4 = 4', '副：2 × 3 = 6', '4 − 6 = −2'], trap: '行列式可以是负数。' } },
      { no: 8, score: 4, stem: '曲线 y = sinx 在 x = 0 处的切线斜率是', options: [{ k: 'A', t: '0' }, { k: 'B', t: '1' }, { k: 'C', t: '−1' }, { k: 'D', t: '不存在' }], answer: 'B',
        baby: { ask: '在原点附近，sin 曲线有多陡。', idea: '(sinx)′ = cosx，代 x = 0。', steps: ['y′ = cosx', 'cos0 = 1'], trap: 'sin0 = 0 是函数值，不是斜率。' } },
      { no: 9, score: 4, stem: '∫₀^(π/2) cosx dx =', options: [{ k: 'A', t: '0' }, { k: 'B', t: '1' }, { k: 'C', t: '2' }, { k: 'D', t: '1/2' }], answer: 'B',
        baby: { ask: '从 0 到 π/2 把 cosx 累加起来。', idea: 'cosx 的原函数是 sinx，代上下限。', steps: ['[sinx]₀^(π/2)', '= sin(π/2) − sin0 = 1 − 0 = 1'], trap: 'sin(π/2) = 1，别写成 0。' } },
      { no: 10, score: 4, stem: '袋中有 3 个白球、2 个黑球，任取一个，取到白球的概率是', options: [{ k: 'A', t: '2/5' }, { k: 'B', t: '3/5' }, { k: 'C', t: '1/2' }, { k: 'D', t: '3/2' }], answer: 'B',
        baby: { ask: '随便拿一个，是白球的机会。', idea: '概率 = 白球数 ÷ 总数。', steps: ['白球 3 个，总共 5 个', '3/5'], trap: '3/2 大于 1，概率不可能大于 1。' } }
    ],
    big: [
      { no: 11, score: 10, stem: '求 lim(x→0) (tanx − x) / x³', answer: '1/3',
        steps: ['先代 0：tan0 − 0 = 0，分母 0，是 0/0', '洛必达一次：分子 sec²x − 1，分母 3x²', 'sec²x − 1 = tan²x，且 tanx ~ x，所以分子 ~ x²', '原式 = lim x² / (3x²) = 1/3'],
        baby: { ask: 'x 靠近 0 时，(tanx − x) 比 x³ 大多少倍。', idea: 'tanx 去掉一次项后剩下的部分大约是三阶的，用洛必达或泰勒都能抓出来。', trap: '洛必达两次后要记得 sec²x − 1 = tan²x 这个变形，否则算不下去。' } },
      { no: 12, score: 12, stem: '设 f(x) = x³ − 3x² + 1，求极值', answer: '极大值 f(0) = 1，极小值 f(2) = −3',
        steps: ['求导：f′(x) = 3x² − 6x = 3x(x − 2)', '驻点：x = 0 与 x = 2', '判号：x < 0 增；0 < x < 2 减；x > 2 增', 'x = 0 极大：f(0) = 1', 'x = 2 极小：f(2) = 8 − 12 + 1 = −3'],
        baby: { ask: '曲线的山顶和谷底各多高。', idea: '驻点定位置，判号定谁大谁小。', trap: '把「驻点」直接当极值点，不判号；有的驻点不是极值。' } },
      { no: 13, score: 12, stem: '求 ∫ lnx dx', answer: 'x·lnx − x + C',
        steps: ['只有一项但不好积，用分部积分：u = lnx，dv = dx', '则 du = (1/x)dx，v = x', '代入：= x·lnx − ∫ x·(1/x) dx = x·lnx − ∫1 dx', '= x·lnx − x + C', '验算求导：lnx + 1 − 1 = lnx ✔'],
        baby: { ask: '谁求导等于 lnx。', idea: '对数单独出现时，就让 dv = dx，把 x 从「凭空」造出来。', trap: '忘记最后的 −x，只写 x·lnx 是不对的。' } },
      { no: 14, score: 10, stem: '求微分方程 y′ − 2y = 0 满足 y(0) = 3 的特解', answer: 'y = 3e²ˣ',
        steps: ['分离变量：dy/y = 2dx', '两边积分：ln|y| = 2x + C', '取指数：y = C₁e²ˣ', '代入 y(0) = 3：C₁ = 3', '所以 y = 3e²ˣ'],
        baby: { ask: '哪个函数，它的导数是自己的 2 倍，且 x=0 时等于 3。', idea: '导数和自己是倍数关系 → 指数函数，倍数写在指数上。', trap: '把 2 写成 e 的指数上的常数，搞成 e^(2x)+C。' } },
      { no: 15, score: 12, stem: '求曲线 y = x² 与 y = 2 − x² 围成的面积', answer: '8/3',
        steps: ['交点：x² = 2 − x² → 2x² = 2 → x = ±1', '在 (−1,1) 内 2 − x² > x²（x=0 时 2 > 0）', '面积 = ∫₋₁¹ (2 − 2x²) dx', '原函数：[2x − 2x³/3]₋₁¹', '代入：= (2 − 2/3) − (−2 + 2/3) = 4/3 + 4/3 = 8/3'],
        baby: { ask: '两条抛物线夹出来的那块有多大。', idea: '交点对称时积分区间是 [−1,1]，注意上下限代入的符号。', trap: '只算 [0,1] 再乘 2 可以，但直接算 (−1,1) 时别丢负号。' } }
    ]
  });

  root.PAPERS.push({
    id: 'gd-2024-demo', year: 2024, region: '广东', subject: '高等数学',
    title: '2024 年广东省普通专升本 · 高等数学（示例结构卷）',
    source: '按考纲编写的示例结构卷（非官方真题）',
    minutes: 120, total: 100,
    choice: [
      { no: 1, score: 4, stem: 'lim(x→0) sin3x / x =', options: [{ k: 'A', t: '1' }, { k: 'B', t: '3' }, { k: 'C', t: '1/3' }, { k: 'D', t: '0' }], answer: 'B',
        baby: { ask: 'x 靠近 0 时，sin3x 除以 x 靠近几。', idea: '把分母凑成 sin 里面的 3x。', steps: ['sin3x/x = 3 × (sin3x/3x)', '括号里趋于 1', '得 3'], trap: '别直接把 sin3x 当 3x 约掉而不解释。' } },
      { no: 2, score: 4, stem: 'lim(x→∞) (3x² − 1) / (x² + 2) =', options: [{ k: 'A', t: '0' }, { k: 'B', t: '1' }, { k: 'C', t: '3' }, { k: 'D', t: '∞' }], answer: 'C',
        baby: { ask: 'x 很大时这个分数稳定到几。', idea: '上下同为二次，看系数比。', steps: ['上下同除 x²：(3 − 1/x²)/(1 + 2/x²)', '1/x²、2/x² 趋于 0', '得 3/1 = 3'], trap: '别用「∞/∞=1」。' } },
      { no: 3, score: 4, stem: 'f(x) = x⁴ − 2x² 的极大值是', options: [{ k: 'A', t: '0' }, { k: 'B', t: '−1' }, { k: 'C', t: '1' }, { k: 'D', t: '2' }], answer: 'A',
        baby: { ask: '这条曲线最高的那个「山顶」有多高。', idea: '先求导找驻点，再判断哪个是极大。', steps: ['f′(x) = 4x³ − 4x = 4x(x − 1)(x + 1)', '驻点：x = −1、0、1', 'x = 0 处 f′ 由正变负 → 极大', 'f(0) = 0 − 0 = 0'], trap: 'x = ±1 是极小值 −1，别把极小当极大。' } },
      { no: 4, score: 4, stem: '∫ cosx dx =', options: [{ k: 'A', t: 'sinx + C' }, { k: 'B', t: '−sinx + C' }, { k: 'C', t: 'cosx + C' }, { k: 'D', t: '−cosx + C' }], answer: 'A',
        baby: { ask: '谁求导等于 cosx。', idea: '(sinx)′ = cosx，所以原函数是 sinx。', steps: ['(sinx)′ = cosx', '∫cosx dx = sinx + C'], trap: 'cos 的导数是 −sin；别把积分和求导的符号搞混。' } },
      { no: 5, score: 4, stem: 'd/dx ∫₀ˣ cos t dt =', options: [{ k: 'A', t: 'cos x' }, { k: 'B', t: 'sin x' }, { k: 'C', t: '−sin x' }, { k: 'D', t: 'cos x − 1' }], answer: 'A',
        baby: { ask: '对「从 0 积到 x」再求导。', idea: '变上限求导：上限代进被积函数。', steps: ['被积函数 cos t', '把 t 换成 x：cos x'], trap: 'sin x 是积分结果，不是求导之后。' } },
      { no: 6, score: 4, stem: '行列式 |1 2; 2 1| =', options: [{ k: 'A', t: '−3' }, { k: 'B', t: '3' }, { k: 'C', t: '0' }, { k: 'D', t: '5' }], answer: 'A',
        baby: { ask: '这个二阶行列式。', idea: '主对角相乘减副对角相乘。', steps: ['主：1 × 1 = 1', '副：2 × 2 = 4', '1 − 4 = −3'], trap: '结果是负数很正常。' } },
      { no: 7, score: 4, stem: 'A = [3 0; 0 −1]，则 A⁻¹ =', options: [{ k: 'A', t: '[1/3 0; 0 −1]' }, { k: 'B', t: '[3 0; 0 −1]' }, { k: 'C', t: '[1/3 0; 0 1]' }, { k: 'D', t: '[−3 0; 0 1]' }], answer: 'A',
        baby: { ask: '对角矩阵的逆。', idea: '对角元各自取倒数，别动符号之外的任何东西。', steps: ['|A| = 3 × (−1) = −3', '按伴随矩阵除以行列式，等价于对角元取倒数', '得 [1/3 0; 0 −1]'], trap: '−1 的倒数是 −1，不是 1。' } },
      { no: 8, score: 4, stem: '曲线 y = x³ − 3x 在 x = 2 处的切线斜率是', options: [{ k: 'A', t: '0' }, { k: 'B', t: '3' }, { k: 'C', t: '9' }, { k: 'D', t: '−3' }], answer: 'C',
        baby: { ask: 'x = 2 时曲线有多陡。', idea: 'y′ = 3x² − 3，代 2。', steps: ['y′ = 3x² − 3', '代入：3×4 − 3 = 9'], trap: 'f(2) = 8 − 6 = 2 是函数值。' } },
      { no: 9, score: 4, stem: '∫₋₁¹ x³ dx =', options: [{ k: 'A', t: '0' }, { k: 'B', t: '2/3' }, { k: 'C', t: '1/2' }, { k: 'D', t: '−2' }], answer: 'A',
        baby: { ask: '从 −1 到 1 把 x³ 累加。', idea: 'x³ 是奇函数，左右对称、一正一负正好抵消。', steps: ['原函数 x⁴/4', '代入：1/4 − 1/4 = 0'], trap: '不需要算就知道是 0，但写过程时仍要交代对称性。' } },
      { no: 10, score: 4, stem: '从 1、2、3、4、5、6 中任取一数，取到 3 的倍数的概率是', options: [{ k: 'A', t: '1/6' }, { k: 'B', t: '1/3' }, { k: 'C', t: '1/2' }, { k: 'D', t: '2/3' }], answer: 'B',
        baby: { ask: '随便取一个，是 3 的倍数的机会。', idea: '概率 = 符合的个数 ÷ 总个数。', steps: ['3 的倍数：3、6，共 2 个', '总共 6 个', '2/6 = 1/3'], trap: '6 也是 3 的倍数，别只数 3。' } }
    ],
    big: [
      { no: 11, score: 10, stem: '求 lim(x→0) (1 − cos2x) / (x·sinx)', answer: '2',
        steps: ['先代 0：分子 0，分母 0，是 0/0', '分子：1 − cos2x ~ (2x)²/2 = 2x²', '分母：x·sinx ~ x·x = x²', '原式 = 2x²/x² = 2'],
        baby: { ask: 'x 靠近 0 时，这个比值稳定到几。', idea: '分子分母各用等价无穷小，再约分。', trap: '(2x)² = 4x²，除以 2 才是 2x²。' } },
      { no: 12, score: 12, stem: '设 f(x) = x³ − 6x² + 5，求单调区间与极值', answer: '增区间 (−∞,0) 与 (4,+∞)，减区间 (0,4)；极大值 f(0) = 5，极小值 f(4) = −27',
        steps: ['求导：f′(x) = 3x² − 12x = 3x(x − 4)', '驻点：x = 0 与 x = 4', '判号：x < 0 增；0 < x < 4 减；x > 4 增', '极大：f(0) = 5', '极小：f(4) = 64 − 96 + 5 = −27'],
        baby: { ask: '曲线的升降段和山顶谷底。', idea: '求导 → 驻点 → 判号，三步。', trap: '把「减区间」写成 (4,0)；区间永远从小到大。' } },
      { no: 13, score: 12, stem: '求 ∫ x²·eˣ dx', answer: '(x² − 2x + 2)eˣ + C',
        steps: ['分部积分两次：u = x²，dv = eˣdx', '第一次：= x²eˣ − ∫2x·eˣ dx', '对 ∫2x eˣ dx 再分部：= 2xeˣ − 2eˣ', '合并：= x²eˣ − 2xeˣ + 2eˣ + C', '提公因式：(x² − 2x + 2)eˣ + C'],
        baby: { ask: '谁求导等于 x² 乘 eˣ。', idea: '多项式乘指数要分部两次，每分部一次多项式降一阶，降到常数停手。', trap: '只分部一次就以为完事，会留下 ∫2x eˣ 没算。' } },
      { no: 14, score: 10, stem: '求微分方程 y″ − 4y = 0 的通解', answer: 'y = C₁e²ˣ + C₂e⁻²ˣ',
        steps: ['特征方程：r² − 4 = 0', 'r = ±2（两个相异实根）', '通解：y = C₁e^(2x) + C₂e^(−2x)'],
        baby: { ask: '哪个函数，两次求导后等于自己的 4 倍。', idea: '把求导换成乘 r，解方程。', trap: 'r² = 4 的根是 ±2，不是只有 2。' } },
      { no: 15, score: 12, stem: '求曲线 y = x² 与直线 y = x + 2 围成的面积', answer: '9/2',
        steps: ['交点：x² = x + 2 → x² − x − 2 = 0 → (x−2)(x+1) = 0 → x = −1、2', '在 (−1,2) 内直线在上（试 x = 0：2 > 0）', '面积 = ∫₋₁² (x + 2 − x²) dx', '原函数：[x²/2 + 2x − x³/3]₋₁²', '代入：= (2 + 4 − 8/3) − (1/2 − 2 + 1/3) = 10/3 + 7/6 = 9/2'],
        baby: { ask: '直线和抛物线夹的那块。', idea: '交点 → 判上下 → 上减下积分。', trap: '下限 −1 代入时的符号，最容易算错。' } }
    ]
  });
  if (typeof module === 'object' && module.exports) { module.exports = root.PAPERS; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
