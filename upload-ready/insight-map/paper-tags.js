/* 洞见 · 试卷题目 → 知识点 映射
 * 按「卷 id + 题型 + 题号(从 1 开始)」对齐，集中维护，不动题目本体。
 * 有了它：① 组卷可以按知识点抽题 ② 交卷后错题能直接进错题本并计入证据。
 */
(function (root) {
  'use strict';
  root.PAPER_TAGS = {
    'gd-2019-demo': {
      c: ['limit', 'limit', 'der-con', 'indef-int', 'ftc', 'det', 'matrix', 'der-con', 'def-int', 'prob-basic'],
      b: ['limit-method', 'der-app', 'int-parts', 'diff-eq1', 'int-app']
    },
    'gd-2020-demo': {
      c: ['limit-method', 'limit-method', 'der-con', 'indef-int', 'ftc', 'det', 'matrix', 'der-con', 'def-int', 'prob-basic'],
      b: ['limit-method', 'der-app', 'int-parts', 'diff-eq2', 'int-app']
    },
    'gd-2021-demo': {
      c: ['limit', 'limit-method', 'indef-int', 'indef-int', 'ftc', 'det', 'matrix', 'der-con', 'def-int', 'prob-basic'],
      b: ['lhopital', 'der-app', 'int-parts', 'diff-eq1', 'int-app']
    },
    'gd-2022-demo': {
      c: ['limit-method', 'limit', 'der-con', 'indef-int', 'ftc', 'det', 'matrix', 'der-con', 'def-int', 'prob-basic'],
      b: ['limit-method', 'der-app', 'int-parts', 'diff-eq2', 'int-app']
    },
    'gd-2023-demo': {
      c: ['limit-method', 'limit-method', 'der-con', 'indef-int', 'ftc', 'det', 'det', 'der-con', 'def-int', 'prob-basic'],
      b: ['lhopital', 'der-app', 'int-parts', 'diff-eq1', 'int-app']
    },
    'gd-2024-demo': {
      c: ['limit-method', 'limit', 'der-app', 'indef-int', 'ftc', 'det', 'matrix', 'der-con', 'def-int', 'prob-basic'],
      b: ['limit-method', 'der-app', 'int-parts', 'diff-eq2', 'int-app']
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
