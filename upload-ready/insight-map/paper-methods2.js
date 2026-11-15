/* 洞见 · 大题多解法（补全 2019–2021）
 * 与 paper-methods.js 合并进同一个 window.PAPER_METHODS 表。
 */
(function (root) {
  'use strict';
  var M = root.PAPER_METHODS = root.PAPER_METHODS || {};
  var ADD = {
  "gd-2019-demo:11": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "先代 0：e⁰−1=0，分母 0，0/0 型",
          "用等价无穷小 eˣ−1 ~ x",
          "原式 = x/x = 1"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "洛必达：分子求导 eˣ，分母 1",
          "代 x=0：e⁰/1 = 1"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "0",
        "why": "把「分子趋于 0」当成答案；0/0 是未定式，还要继续算"
      }
    ]
  },
  "gd-2019-demo:12": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "f′=3x²−6x=3x(x−2)，驻点 0、2",
          "判号：x<0 增，0<x<2 减，x>2 增",
          "极大 f(0)=2，极小 f(2)=−2"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "二阶导 f″=6x−6：f″(0)=−6<0 → 极大；f″(2)=6>0 → 极小",
          "代值同上"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "极大值 f(2)=−2",
        "why": "极大极小弄反：x=2 是「先减后增」的谷底"
      }
    ]
  },
  "gd-2019-demo:13": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "u=x，dv=eˣdx → du=dx，v=eˣ",
          "∫x eˣ = x eˣ − ∫eˣ = (x−1)eˣ + C"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "待定系数：设 ∫x eˣdx = (ax+b)eˣ，求导比对得 a=1、b=−1"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "(x+1)eˣ + C",
        "why": "中间符号错；把它求导得 (x+2)eˣ，回不到 x eˣ"
      }
    ]
  },
  "gd-2019-demo:14": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "直接积分：y=∫2x dx = x²+C",
          "代入 y(0)=1 得 C=1 → y=x²+1"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "先猜形式：右边只含 x，所以解是 x² 加常数",
          "用初值定常数：0+C=1"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "y = x²",
        "why": "漏了常数 C；代回 y(0)=0≠1"
      }
    ]
  },
  "gd-2019-demo:15": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "交点 x²=x → 0、1；直线在上",
          "S=∫₀¹(x−x²)dx=[x²/2−x³/3]₀¹=1/6"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "用抛物线弓形公式：S=|a|(β−α)³/6=1×(1−0)³/6=1/6"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "1/3",
        "why": "只算了一块（∫x 或 ∫x²），忘了「上减下」"
      }
    ]
  },
  "gd-2020-demo:11": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "凑形：sin3x/(2x) = (3/2)·(sin3x/3x)",
          "括号趋于 1 → 3/2"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "洛必达：3cos3x/2，代 0 得 3/2"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "2/3",
        "why": "系数颠倒：分母是 2x，别把 2 和 3 的位置写反"
      }
    ]
  },
  "gd-2020-demo:12": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "f′=3x²−3=3(x−1)(x+1)，驻点 ±1",
          "判号：x<−1 增，−1<x<1 减，x>1 增",
          "极大 f(−1)=2，极小 f(1)=−2"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "二阶导 f″=6x：f″(−1)=−6<0 极大；f″(1)=6>0 极小"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "极大值 −2",
        "why": "只看了数值大小：极值是局部概念，x=1 处是谷底"
      }
    ]
  },
  "gd-2020-demo:13": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "u=lnx，dv=x²dx → v=x³/3",
          "= (x³/3)lnx − (1/3)∫x²dx = (x³/3)lnx − x³/9 + C"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "待定系数：设结果 = (ax³lnx + bx³)，求导比对得 a=1/3、b=−1/9"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "(x³/3)lnx − x³/3 + C",
        "why": "第二项系数错：∫x² 得 x³/3，再乘外面的 1/3 是 x³/9"
      }
    ]
  },
  "gd-2020-demo:14": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "特征方程 r²−1=0 → r=±1",
          "通解 y=C₁eˣ+C₂e⁻ˣ"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "直接验证：eˣ 与 e⁻ˣ 两次求导都回到自己，两者线性无关"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "C₁cosx + C₂sinx",
        "why": "套错情形：那是 r²+1=0 的答案，代回去等于 −y 不是 +y"
      }
    ]
  },
  "gd-2020-demo:15": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "交点 0、2；2x 在上",
          "S=∫₀²(2x−x²)dx=[x²−x³/3]₀²=4−8/3=4/3"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "对称/几何：先算三角形 4，再减抛物线下的 8/3，得 4/3"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "8/3",
        "why": "只算了抛物线下的面积，忘了减"
      }
    ]
  },
  "gd-2021-demo:11": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "洛必达两次：→ (eˣ−1)/(2x) → eˣ/2",
          "代 0：1/2"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "泰勒：eˣ=1+x+x²/2+…，分子减掉 1+x 后剩 x²/2，除以 x² 得 1/2"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "0",
        "why": "只洛一次就停：第一次之后还是 0/0"
      }
    ]
  },
  "gd-2021-demo:12": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "f′=3x²−12x+9=3(x−1)(x−3)，驻点 1、3",
          "判号：x<1 增，1<x<3 减，x>3 增",
          "极大 f(1)=4，极小 f(3)=0"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "二阶导 f″=6x−12：f″(1)=−6<0 极大；f″(3)=6>0 极小"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "极小值 4",
        "why": "把极大值 4 当成了极小；x=3 处 f(3)=0"
      }
    ]
  },
  "gd-2021-demo:13": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "u=x，dv=cosx dx → v=sinx",
          "= x sinx − ∫sinx dx = x sinx + cosx + C"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "表格法：D 列 x→1→0，I 列 cosx→sinx→−cosx，对角相乘：x sinx + cosx"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "x sinx − cosx + C",
        "why": "符号错：∫sinx = −cosx，负负得正"
      }
    ]
  },
  "gd-2021-demo:14": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "分离变量 dy/y=dx → ln|y|=x+C → y=C₁eˣ",
          "代 y(0)=2 得 C₁=2"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "特征方程 r−1=0 → r=1，通解 y=Ceˣ；再用初值"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "y = 2eˣ + C",
        "why": "通解已经定完常数，不该再留 C；代回 y(0)=2+C≠2"
      }
    ]
  },
  "gd-2021-demo:15": {
    "methods": [
      {
        "name": "方法一",
        "steps": [
          "交点 0、1；√x 在上",
          "S=∫₀¹(√x−x²)dx=[2x^{3/2}/3−x³/3]₀¹=1/3"
        ]
      },
      {
        "name": "方法二",
        "steps": [
          "两块面积相减：∫₀¹√x=2/3，∫₀¹x²=1/3，差为 1/3"
        ]
      }
    ],
    "wrong": [
      {
        "ans": "2/3",
        "why": "只算了 ∫√x，忘了减抛物线那块"
      }
    ]
  }
};
  Object.keys(ADD).forEach(function (k) { M[k] = ADD[k]; });
})(typeof globalThis !== 'undefined' ? globalThis : this);
