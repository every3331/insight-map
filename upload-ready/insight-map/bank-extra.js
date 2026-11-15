/* 洞见 · 刷题题库扩充（+20 道）
 * 直接 push 进 APP_DATA.GEN_BANK；app.js 持有的是同一个数组引用，所以能被刷题页读到。
 */
(function (root) {
  'use strict';
  var D = root.APP_DATA;
  if (!D || !D.GEN_BANK) { return; }
  var ADD = [
  {
    "id": "x1",
    "nodeId": "limit-method",
    "errorType": "概念混淆",
    "stem": "lim(x→0) sin3x / sin5x =",
    "options": [
      {
        "k": "A",
        "t": "3/5"
      },
      {
        "k": "B",
        "t": "5/3"
      },
      {
        "k": "C",
        "t": "1"
      },
      {
        "k": "D",
        "t": "0"
      }
    ],
    "answer": "A",
    "steps": [
      "把两个 sin 各自换成自己的角度：sin3x ~ 3x，sin5x ~ 5x",
      "原式 = 3x/5x = 3/5",
      "答案 3/5"
    ]
  },
  {
    "id": "x2",
    "nodeId": "limit-method",
    "errorType": "运算跳步",
    "stem": "lim(x→0) (1 − cos2x) / (x·sinx) =",
    "options": [
      {
        "k": "A",
        "t": "1"
      },
      {
        "k": "B",
        "t": "2"
      },
      {
        "k": "C",
        "t": "1/2"
      },
      {
        "k": "D",
        "t": "4"
      }
    ],
    "answer": "B",
    "steps": [
      "分子 1−cos2x ~ (2x)²/2 = 2x²",
      "分母 x·sinx ~ x²",
      "原式 = 2x²/x² = 2"
    ]
  },
  {
    "id": "x3",
    "nodeId": "der-rule",
    "errorType": "概念混淆",
    "stem": "f(x) = e^(2x) 的导数是",
    "options": [
      {
        "k": "A",
        "t": "e^(2x)"
      },
      {
        "k": "B",
        "t": "2e^(2x)"
      },
      {
        "k": "C",
        "t": "e^(2x)/2"
      },
      {
        "k": "D",
        "t": "2x·e^(2x)"
      }
    ],
    "answer": "B",
    "steps": [
      "复合函数：外层 e^u，内层 u=2x",
      "f′ = e^(2x) · (2x)′ = 2e^(2x)"
    ]
  },
  {
    "id": "x4",
    "nodeId": "der-rule",
    "errorType": "运算跳步",
    "stem": "f(x) = ln(3x) 的导数是",
    "options": [
      {
        "k": "A",
        "t": "1/(3x)"
      },
      {
        "k": "B",
        "t": "3/x"
      },
      {
        "k": "C",
        "t": "1/x"
      },
      {
        "k": "D",
        "t": "ln3/x"
      }
    ],
    "answer": "C",
    "steps": [
      "ln(3x) = ln3 + lnx",
      "ln3 是常数，导数为 0；lnx 导数为 1/x",
      "所以 f′ = 1/x（注意它和 ln(3x) 的系数无关）"
    ]
  },
  {
    "id": "x5",
    "nodeId": "indef-int",
    "errorType": "换元不当",
    "stem": "∫ 2x·e^(x²) dx =",
    "options": [
      {
        "k": "A",
        "t": "e^(x²) + C"
      },
      {
        "k": "B",
        "t": "2e^(x²) + C"
      },
      {
        "k": "C",
        "t": "x²e^(x²) + C"
      },
      {
        "k": "D",
        "t": "e^(2x) + C"
      }
    ],
    "answer": "A",
    "steps": [
      "凑微分：令 u = x²，则 du = 2x dx",
      "原式 = ∫ e^u du = e^u + C",
      "回代：e^(x²) + C"
    ]
  },
  {
    "id": "x6",
    "nodeId": "int-sub",
    "errorType": "换元不当",
    "stem": "∫ cos(3x) dx =",
    "options": [
      {
        "k": "A",
        "t": "sin(3x) + C"
      },
      {
        "k": "B",
        "t": "sin(3x)/3 + C"
      },
      {
        "k": "C",
        "t": "3sin(3x) + C"
      },
      {
        "k": "D",
        "t": "−sin(3x)/3 + C"
      }
    ],
    "answer": "B",
    "steps": [
      "令 u = 3x，du = 3dx，dx = du/3",
      "原式 = (1/3)∫cos u du = sin(3x)/3 + C"
    ]
  },
  {
    "id": "x7",
    "nodeId": "def-int",
    "errorType": "概念混淆",
    "stem": "∫₀² (2x + 1) dx =",
    "options": [
      {
        "k": "A",
        "t": "4"
      },
      {
        "k": "B",
        "t": "6"
      },
      {
        "k": "C",
        "t": "8"
      },
      {
        "k": "D",
        "t": "5"
      }
    ],
    "answer": "B",
    "steps": [
      "原函数 x² + x",
      "代上限 2：4 + 2 = 6",
      "代下限 0：0；相减得 6"
    ]
  },
  {
    "id": "x8",
    "nodeId": "def-int",
    "errorType": "符号错误",
    "stem": "∫₋₂² x³ dx =",
    "options": [
      {
        "k": "A",
        "t": "0"
      },
      {
        "k": "B",
        "t": "8"
      },
      {
        "k": "C",
        "t": "16"
      },
      {
        "k": "D",
        "t": "−8"
      }
    ],
    "answer": "A",
    "steps": [
      "x³ 是奇函数，区间关于原点对称",
      "正负两块互相抵消，积分为 0"
    ]
  },
  {
    "id": "x9",
    "nodeId": "ftc",
    "errorType": "定理误用",
    "stem": "d/dx ∫₀^(x²) sin t dt =",
    "options": [
      {
        "k": "A",
        "t": "sin(x²)"
      },
      {
        "k": "B",
        "t": "2x·sin(x²)"
      },
      {
        "k": "C",
        "t": "cos(x²)"
      },
      {
        "k": "D",
        "t": "sin(x)"
      }
    ],
    "answer": "B",
    "steps": [
      "上限是复合函数 x²，要用链式法则",
      "结果 = sin(x²) · (x²)′ = 2x·sin(x²)"
    ]
  },
  {
    "id": "x10",
    "nodeId": "int-parts",
    "errorType": "运算跳步",
    "stem": "∫ x·cosx dx =",
    "options": [
      {
        "k": "A",
        "t": "x·sinx + cosx + C"
      },
      {
        "k": "B",
        "t": "x·sinx − cosx + C"
      },
      {
        "k": "C",
        "t": "−x·sinx + cosx + C"
      },
      {
        "k": "D",
        "t": "x·cosx + sinx + C"
      }
    ],
    "answer": "A",
    "steps": [
      "u=x，dv=cosx dx → v=sinx",
      "= x sinx − ∫sinx dx",
      "= x sinx + cosx + C"
    ]
  },
  {
    "id": "x11",
    "nodeId": "der-app",
    "errorType": "分类讨论不全",
    "stem": "f(x) = x⁴ − 2x² 的极小值是",
    "options": [
      {
        "k": "A",
        "t": "0"
      },
      {
        "k": "B",
        "t": "−1"
      },
      {
        "k": "C",
        "t": "1"
      },
      {
        "k": "D",
        "t": "−2"
      }
    ],
    "answer": "B",
    "steps": [
      "f′=4x³−4x=4x(x−1)(x+1)",
      "驻点 −1、0、1；x=±1 处先减后增 → 极小",
      "f(±1)=1−2=−1"
    ]
  },
  {
    "id": "x12",
    "nodeId": "monotone-ext",
    "errorType": "概念混淆",
    "stem": "若 f′(x₀)=0 且 f″(x₀)<0，则 x₀ 处是",
    "options": [
      {
        "k": "A",
        "t": "极大值点"
      },
      {
        "k": "B",
        "t": "极小值点"
      },
      {
        "k": "C",
        "t": "拐点"
      },
      {
        "k": "D",
        "t": "不是极值点"
      }
    ],
    "answer": "A",
    "steps": [
      "二阶导为负 → 曲线开口向下",
      "开口向下的顶点是极大值点"
    ]
  },
  {
    "id": "x13",
    "nodeId": "concavity",
    "errorType": "概念混淆",
    "stem": "f″(x) > 0 的区间上，曲线是",
    "options": [
      {
        "k": "A",
        "t": "凹的（开口向上）"
      },
      {
        "k": "B",
        "t": "凸的（开口向下）"
      },
      {
        "k": "C",
        "t": "直线"
      },
      {
        "k": "D",
        "t": "无法判断"
      }
    ],
    "answer": "A",
    "steps": [
      "二阶导正 → 一阶导递增 → 曲线开口向上，即凹（下凸）",
      "记住：f″>0 像碗，f″<0 像帽"
    ]
  },
  {
    "id": "x14",
    "nodeId": "diff-diff",
    "errorType": "概念混淆",
    "stem": "若 y = x³，则 dy =",
    "options": [
      {
        "k": "A",
        "t": "3x²"
      },
      {
        "k": "B",
        "t": "3x² dx"
      },
      {
        "k": "C",
        "t": "x³ dx"
      },
      {
        "k": "D",
        "t": "3x dx"
      }
    ],
    "answer": "B",
    "steps": [
      "微分公式 dy = y′ dx",
      "y′=3x²，所以 dy = 3x² dx",
      "dx 不能丢"
    ]
  },
  {
    "id": "x15",
    "nodeId": "high-deriv",
    "errorType": "运算跳步",
    "stem": "f(x) = sinx 的 f″(x) =",
    "options": [
      {
        "k": "A",
        "t": "sinx"
      },
      {
        "k": "B",
        "t": "−sinx"
      },
      {
        "k": "C",
        "t": "cosx"
      },
      {
        "k": "D",
        "t": "−cosx"
      }
    ],
    "answer": "B",
    "steps": [
      "f′=cosx",
      "f″=−sinx"
    ]
  },
  {
    "id": "x16",
    "nodeId": "seq",
    "errorType": "运算跳步",
    "stem": "等比数列 {aₙ} 中 a₁=2，公比 q=3，则 a₄ =",
    "options": [
      {
        "k": "A",
        "t": "18"
      },
      {
        "k": "B",
        "t": "54"
      },
      {
        "k": "C",
        "t": "6"
      },
      {
        "k": "D",
        "t": "162"
      }
    ],
    "answer": "B",
    "steps": [
      "通项 aₙ = a₁q^(n−1)",
      "a₄ = 2×3³ = 54"
    ]
  },
  {
    "id": "x17",
    "nodeId": "count-principle",
    "errorType": "概念混淆",
    "stem": "从 5 人中选 2 人排成一列，共有多少种排法",
    "options": [
      {
        "k": "A",
        "t": "10"
      },
      {
        "k": "B",
        "t": "20"
      },
      {
        "k": "C",
        "t": "25"
      },
      {
        "k": "D",
        "t": "5"
      }
    ],
    "answer": "B",
    "steps": [
      "排列：A(5,2) = 5×4 = 20",
      "若问「选 2 人」不分顺序才是 C(5,2)=10"
    ]
  },
  {
    "id": "x18",
    "nodeId": "prob-basic",
    "errorType": "分类讨论不全",
    "stem": "从 1~10 中任取一数，取到 3 的倍数或 5 的倍数的概率是",
    "options": [
      {
        "k": "A",
        "t": "0.3"
      },
      {
        "k": "B",
        "t": "0.4"
      },
      {
        "k": "C",
        "t": "0.5"
      },
      {
        "k": "D",
        "t": "0.2"
      }
    ],
    "answer": "B",
    "steps": [
      "3 的倍数：3,6,9（3 个）；5 的倍数：5,10（2 个）",
      "没有重叠（15 不在范围内）",
      "(3+2)/10 = 0.4"
    ]
  },
  {
    "id": "x19",
    "nodeId": "ellipse",
    "errorType": "概念混淆",
    "stem": "椭圆 x²/25 + y²/9 = 1 的焦距（两焦点间距离）是",
    "options": [
      {
        "k": "A",
        "t": "4"
      },
      {
        "k": "B",
        "t": "8"
      },
      {
        "k": "C",
        "t": "16"
      },
      {
        "k": "D",
        "t": "6"
      }
    ],
    "answer": "B",
    "steps": [
      "a²=25 → a=5；b²=9 → b=3",
      "c² = a²−b² = 16 → c=4",
      "焦距 = 2c = 8"
    ]
  },
  {
    "id": "x20",
    "nodeId": "circle-eq",
    "errorType": "概念混淆",
    "stem": "圆 x² + y² − 4x = 0 的圆心与半径是",
    "options": [
      {
        "k": "A",
        "t": "(2,0)，r=2"
      },
      {
        "k": "B",
        "t": "(−2,0)，r=2"
      },
      {
        "k": "C",
        "t": "(2,0)，r=4"
      },
      {
        "k": "D",
        "t": "(0,2)，r=2"
      }
    ],
    "answer": "A",
    "steps": [
      "配方：(x−2)² + y² = 4",
      "圆心 (2,0)，半径 √4 = 2"
    ]
  }
];
  ADD.forEach(function (q) { D.GEN_BANK.push(q); });
})(typeof globalThis !== 'undefined' ? globalThis : this);
