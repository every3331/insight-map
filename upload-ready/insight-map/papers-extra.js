/* 洞见 · 试卷补充题型（填空 / 判断 / 多选）
 * 追加到各卷的 objective 数组，题号从 16 起；每条都带 nodeId，可直接参与"按断点抽题"。
 * 全是可判分的客观题：填空按 accept 列表比对，判断 T/F，多选按字母集合比对。
 */
(function (root) {
  'use strict';
  var EXTRA = {
  "gd-2019-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→0) sin2x / x = ______",
      "accept": [
        "2"
      ],
      "answer": "2",
      "nodeId": "limit-method",
      "baby": {
        "ask": "x 靠近 0 时，这个比值稳定到几。",
        "idea": "把分母凑成 sin 里面的 2x。",
        "steps": [
          "sin2x/x = 2·(sin2x/2x)",
          "括号趋于 1",
          "答案 2"
        ],
        "trap": "漏掉外面的 2。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "∫₀^π sinx dx = ______",
      "accept": [
        "2"
      ],
      "answer": "2",
      "nodeId": "def-int",
      "baby": {
        "ask": "从 0 到 π 把 sinx 累加起来。",
        "idea": "原函数是 −cosx，代上下限。",
        "steps": [
          "[−cosx]₀^π",
          "= 1 + 1 = 2"
        ],
        "trap": "两层负号少一个就成 0。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "若 f(x) = x²，则 f′(3) = ______",
      "accept": [
        "6"
      ],
      "answer": "6",
      "nodeId": "der-con",
      "baby": {
        "ask": "x=3 处的切线斜率。",
        "idea": "先求导再代值。",
        "steps": [
          "f′(x)=2x",
          "f′(3)=6"
        ],
        "trap": "写成 f(3)=9。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "若 f 在 x₀ 处连续，则 f 在 x₀ 处一定可导。",
      "answer": "F",
      "nodeId": "continuous",
      "baby": {
        "ask": "连续能不能推出可导。",
        "idea": "反例最省事：|x| 在 0 处连续但左右导数不等。",
        "trap": "把「可导 ⇒ 连续」倒过来用。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "行列式交换两行，其值变号。",
      "answer": "T",
      "nodeId": "det",
      "baby": {
        "ask": "行列式的这条基本性质对不对。",
        "idea": "这是行列式的六条基本性质之一，翻书就能对上。",
        "trap": "记成「交换两行值不变」。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列函数中是奇函数的有",
      "options": [
        {
          "k": "A",
          "t": "x³"
        },
        {
          "k": "B",
          "t": "sinx"
        },
        {
          "k": "C",
          "t": "x²"
        },
        {
          "k": "D",
          "t": "x"
        }
      ],
      "answer": "ABD",
      "nodeId": "func-prop",
      "baby": {
        "ask": "哪些函数满足 f(−x) = −f(x)。",
        "idea": "奇函数图像关于原点对称；偶函数关于 y 轴对称。",
        "steps": [
          "x³：f(−x)=−x³=−f(x) ✔",
          "sinx：sin(−x)=−sinx ✔",
          "x²：f(−x)=x²=f(x)，是偶函数 ✘",
          "x：✔"
        ],
        "trap": "多选题漏选或多选都算错，x² 是偶函数别选。"
      }
    }
  ],
  "gd-2020-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→0) (1 − cosx) / x² = ______",
      "accept": [
        "1/2",
        "0.5"
      ],
      "answer": "1/2",
      "nodeId": "limit-method",
      "baby": {
        "ask": "这个比值稳定到几。",
        "idea": "1 − cosx ~ x²/2。",
        "steps": [
          "分子换成 x²/2",
          "除以 x² 得 1/2"
        ],
        "trap": "漏掉 1/2。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "∫ cosx dx = ______",
      "accept": [
        "sinx+C",
        "sinx+c",
        "sinx + C"
      ],
      "answer": "sinx+C",
      "nodeId": "indef-int",
      "baby": {
        "ask": "谁求导等于 cosx。",
        "idea": "(sinx)′=cosx。",
        "steps": [
          "原函数 sinx",
          "不定积分加 C"
        ],
        "trap": "漏 C，或写成 −sinx。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "若 f(x) = lnx，则 f′(1) = ______",
      "accept": [
        "1"
      ],
      "answer": "1",
      "nodeId": "der-con",
      "baby": {
        "ask": "x=1 处切线斜率。",
        "idea": "(lnx)′=1/x。",
        "steps": [
          "f′(x)=1/x",
          "f′(1)=1"
        ],
        "trap": "写成 ln1=0。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "0/0 型的极限一定等于 0。",
      "answer": "F",
      "nodeId": "limit",
      "baby": {
        "ask": "这个说法对不对。",
        "idea": "0/0 只是「还没算完」的信号，结果可以是任何数。",
        "trap": "把「未定式」当成「等于 0」。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "两个可导函数的乘积一定可导。",
      "answer": "T",
      "nodeId": "der-rule",
      "baby": {
        "ask": "可导性对乘法是否封闭。",
        "idea": "乘积法则 (uv)′=u′v+uv′，右边存在就说明可导。",
        "trap": "把「可导」和「连续」的条件搞混。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列函数在 [−1, 1] 上连续的有",
      "options": [
        {
          "k": "A",
          "t": "x²"
        },
        {
          "k": "B",
          "t": "|x|"
        },
        {
          "k": "C",
          "t": "1/x"
        },
        {
          "k": "D",
          "t": "sinx"
        }
      ],
      "answer": "ABD",
      "nodeId": "continuous",
      "baby": {
        "ask": "哪些在闭区间上处处连续。",
        "idea": "先找「有没有断点」：1/x 在 0 处没定义。",
        "steps": [
          "x²、|x|、sinx 在 [−1,1] 上都连续 ✔",
          "1/x 在 x=0 无定义 ✘"
        ],
        "trap": "把 |x| 当不可导就不连续——可导推连续，反之不成立。"
      }
    }
  ],
  "gd-2021-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→∞) (3x + 1) / (x − 2) = ______",
      "accept": [
        "3"
      ],
      "answer": "3",
      "nodeId": "limit",
      "baby": {
        "ask": "x 很大时的稳定值。",
        "idea": "同次式看系数比。",
        "steps": [
          "上下同除 x",
          "得 3/1 = 3"
        ],
        "trap": "用「∞/∞=1」。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "若 y = x²，则 dy = ______",
      "accept": [
        "2x dx",
        "2xdx",
        "2x·dx"
      ],
      "answer": "2x dx",
      "nodeId": "diff-diff",
      "baby": {
        "ask": "微分 dy 等于什么。",
        "idea": "dy = y′ dx，先把导数求出来。",
        "steps": [
          "y′ = 2x",
          "dy = 2x dx"
        ],
        "trap": "只写 2x，漏掉 dx。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "矩阵 [1 0; 0 2] 的行列式 = ______",
      "accept": [
        "2"
      ],
      "answer": "2",
      "nodeId": "det",
      "baby": {
        "ask": "这个对角矩阵的行列式。",
        "idea": "对角矩阵行列式 = 对角元相乘。",
        "steps": [
          "1 × 2 = 2"
        ],
        "trap": "去套二阶展开，白算。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "极大值一定大于极小值。",
      "answer": "F",
      "nodeId": "monotone-ext",
      "baby": {
        "ask": "这句话对不对。",
        "idea": "极值是「局部」的：某段曲线的山顶可能比另一段的谷底还低。",
        "trap": "把「极大/极小」和「最大/最小」混为一谈。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "若 f 在闭区间 [a,b] 上连续，则 f 在 [a,b] 上必有最大值和最小值。",
      "answer": "T",
      "nodeId": "continuous",
      "baby": {
        "ask": "闭区间连续函数的最值存在性。",
        "idea": "这是闭区间上连续函数的基本性质（最值定理）。",
        "trap": "把「开区间」也当成立——开区间可能取不到。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列求导结果正确的有",
      "options": [
        {
          "k": "A",
          "t": "(x³)′ = 3x²"
        },
        {
          "k": "B",
          "t": "(sinx)′ = cosx"
        },
        {
          "k": "C",
          "t": "(eˣ)′ = eˣ"
        },
        {
          "k": "D",
          "t": "(lnx)′ = 1/x"
        }
      ],
      "answer": "ABCD",
      "nodeId": "der-rule",
      "baby": {
        "ask": "四个基本求导公式哪个对。",
        "idea": "这四条都是课本上的基本公式，逐个核对。",
        "trap": "多选别只敢选两个——四条都对。"
      }
    }
  ],
  "gd-2022-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→0) sin3x / x = ______",
      "accept": [
        "3"
      ],
      "answer": "3",
      "nodeId": "limit-method",
      "baby": {
        "ask": "这个比值稳定到几。",
        "idea": "凑成 sin3x/3x。",
        "steps": [
          "= 3·(sin3x/3x)",
          "→ 3"
        ],
        "trap": "写成 1/3。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "∫ (1/x) dx = ______",
      "accept": [
        "ln|x|+C",
        "ln|x|+c",
        "lnx+C"
      ],
      "answer": "ln|x|+C",
      "nodeId": "indef-int",
      "baby": {
        "ask": "谁求导等于 1/x。",
        "idea": "ln|x| 的导数是 1/x。",
        "steps": [
          "原函数 ln|x|",
          "加 C"
        ],
        "trap": "漏绝对值或漏 C。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "设 A 为二阶矩阵，|A| = 3，则 |2A| = ______",
      "accept": [
        "12"
      ],
      "answer": "12",
      "nodeId": "det",
      "baby": {
        "ask": "矩阵整体乘 2，行列式变几倍。",
        "idea": "二阶矩阵乘 k，行列式乘 k²。",
        "steps": [
          "|2A| = 2² × |A|",
          "= 4 × 3 = 12"
        ],
        "trap": "错写成 2×3=6，忘了是 kⁿ。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "连续函数一定可导。",
      "answer": "F",
      "nodeId": "continuous",
      "baby": {
        "ask": "连续能不能推出可导。",
        "idea": "|x| 在 0 处连续但不可导。",
        "trap": "把方向搞反。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "若级数收敛，则其通项趋于 0。",
      "answer": "T",
      "nodeId": "series",
      "baby": {
        "ask": "收敛级数的必要条件。",
        "idea": "这是级数收敛的必要条件（反之不成立）。",
        "trap": "把「必要条件」当「充分条件」。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列等式成立的有",
      "options": [
        {
          "k": "A",
          "t": "∫f′(x)dx = f(x) + C"
        },
        {
          "k": "B",
          "t": "(∫f(x)dx)′ = f(x)"
        },
        {
          "k": "C",
          "t": "∫f(x)dx = f′(x)"
        },
        {
          "k": "D",
          "t": "d∫f(x)dx = f(x)dx"
        }
      ],
      "answer": "ABD",
      "nodeId": "indef-int",
      "baby": {
        "ask": "积分与求导的互逆关系。",
        "idea": "「先积后导」回原函数，「先导后积」差一个常数。",
        "steps": [
          "A ✔ 差常数",
          "B ✔ 变上限/不定积分求导回原函数",
          "C ✘ 积分不是求导",
          "D ✔ 微分形式"
        ],
        "trap": "C 看着像但其实完全不对。"
      }
    }
  ],
  "gd-2023-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→∞) (1 + 1/x)ˣ = ______",
      "accept": [
        "e"
      ],
      "answer": "e",
      "nodeId": "limit-method",
      "baby": {
        "ask": "这个经典极限等于几。",
        "idea": "第二个重要极限，答案就是自然常数 e。",
        "steps": [
          "换元 t = 1/x",
          "原式 = lim(t→0)(1+t)^(1/t) = e"
        ],
        "trap": "写成 1。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "d/dx ∫₀ˣ t dt = ______",
      "accept": [
        "x"
      ],
      "answer": "x",
      "nodeId": "ftc",
      "baby": {
        "ask": "变上限积分再求导。",
        "idea": "把上限 x 代进被积函数。",
        "steps": [
          "被积函数是 t",
          "换成 x → x"
        ],
        "trap": "写成 x²/2（那是积分结果）。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "行列式 |2 0; 0 3| = ______",
      "accept": [
        "6"
      ],
      "answer": "6",
      "nodeId": "det",
      "baby": {
        "ask": "对角行列式的值。",
        "idea": "对角元相乘。",
        "steps": [
          "2 × 3 = 6"
        ],
        "trap": "用 2+3=5。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "两个无穷小之和仍是无穷小。",
      "answer": "T",
      "nodeId": "limit",
      "baby": {
        "ask": "无穷小的加法封闭性。",
        "idea": "两个趋近 0 的量相加，仍然趋近 0。",
        "trap": "把它和「无穷小之比」搞混——商不一定。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "若 f′(x) = 0 在某一点成立，则 f 在该点附近为常数。",
      "answer": "F",
      "nodeId": "der-app",
      "baby": {
        "ask": "单点导数为 0 能否说明常值。",
        "idea": "只有在一个区间上处处为 0，才能推出常值。",
        "trap": "把「某点」当成「整个区间」。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列函数是奇函数的有",
      "options": [
        {
          "k": "A",
          "t": "x³"
        },
        {
          "k": "B",
          "t": "cosx"
        },
        {
          "k": "C",
          "t": "sinx"
        },
        {
          "k": "D",
          "t": "x² + 1"
        }
      ],
      "answer": "AC",
      "nodeId": "func-prop",
      "baby": {
        "ask": "哪些满足 f(−x) = −f(x)。",
        "idea": "代 −x 试一遍最快。",
        "steps": [
          "x³ ✔",
          "cosx：偶 ✘",
          "sinx ✔",
          "x²+1：偶 ✘"
        ],
        "trap": "把偶函数也选进来。"
      }
    }
  ],
  "gd-2024-demo": [
    {
      "type": "fill",
      "no": 16,
      "score": 4,
      "stem": "lim(x→0) (eˣ − 1) / x = ______",
      "accept": [
        "1"
      ],
      "answer": "1",
      "nodeId": "limit-method",
      "baby": {
        "ask": "这个经典极限。",
        "idea": "eˣ − 1 ~ x。",
        "steps": [
          "换成 x/x",
          "= 1"
        ],
        "trap": "写 0。"
      }
    },
    {
      "type": "fill",
      "no": 17,
      "score": 4,
      "stem": "∫₀¹ x dx = ______",
      "accept": [
        "1/2",
        "0.5"
      ],
      "answer": "1/2",
      "nodeId": "def-int",
      "baby": {
        "ask": "从 0 到 1 把 x 累加。",
        "idea": "原函数 x²/2。",
        "steps": [
          "[x²/2]₀¹",
          "= 1/2"
        ],
        "trap": "写 1（忘了除以 2）。"
      }
    },
    {
      "type": "fill",
      "no": 18,
      "score": 4,
      "stem": "若 f(x) = x³，则 f′(2) = ______",
      "accept": [
        "12"
      ],
      "answer": "12",
      "nodeId": "der-con",
      "baby": {
        "ask": "x=2 处切线斜率。",
        "idea": "f′(x)=3x²。",
        "steps": [
          "3 × 4 = 12"
        ],
        "trap": "写 f(2)=8。"
      }
    },
    {
      "type": "judge",
      "no": 19,
      "score": 4,
      "stem": "若 f 在 x₀ 可导，则 f 在 x₀ 必连续。",
      "answer": "T",
      "nodeId": "der-def",
      "baby": {
        "ask": "可导与连续的关系。",
        "idea": "可导 ⇒ 连续，这是定理（反之不成立）。",
        "trap": "方向记反。"
      }
    },
    {
      "type": "judge",
      "no": 20,
      "score": 4,
      "stem": "定积分的值一定大于 0。",
      "answer": "F",
      "nodeId": "def-int",
      "baby": {
        "ask": "定积分能不能是负数或 0。",
        "idea": "被积函数在 x 轴下方时，面积为「负」；奇函数对称区间还为 0。",
        "trap": "把定积分等同于面积。"
      }
    },
    {
      "type": "multi",
      "no": 21,
      "score": 6,
      "stem": "下列在 x = 0 处极限存在的是",
      "options": [
        {
          "k": "A",
          "t": "sinx / x"
        },
        {
          "k": "B",
          "t": "1 / x"
        },
        {
          "k": "C",
          "t": "(eˣ − 1) / x"
        },
        {
          "k": "D",
          "t": "|x| / x"
        }
      ],
      "answer": "AC",
      "nodeId": "limit",
      "baby": {
        "ask": "哪些在 0 附近有确定的极限值。",
        "idea": "分别看左右两侧是否收敛到同一个数。",
        "steps": [
          "sinx/x → 1 ✔",
          "1/x → ∞ ✘",
          "(eˣ−1)/x → 1 ✔",
          "|x|/x 左右分别是 −1 和 1，不存在 ✘"
        ],
        "trap": "|x|/x 这种「左右不等」最容易被忽略。"
      }
    }
  ]
};
  (root.PAPERS || []).forEach(function (p) {
    if (EXTRA[p.id]) { p.objective = EXTRA[p.id]; }
    else { p.objective = []; }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
