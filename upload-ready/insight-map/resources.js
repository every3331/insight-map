/* 洞见 · 教学资源（多来源，自挂载到教学页） */
(function (root) {
  'use strict';
  var SRC = {
    bili: { label: 'B 站', kind: 'search', tpl: 'https://search.bilibili.com/all?keyword=' },
    mooc: { label: '中国大学MOOC', kind: 'search', tpl: 'https://www.icourse163.org/search.htm?search=' },
    xuetang: { label: '学堂在线', kind: 'search', tpl: 'https://www.xuetangx.com/search?query=' },
    smartedu: { label: '国家高等教育智慧教育平台', kind: 'site', site: 'smartedu.cn' },
    basic: { label: '国家中小学智慧教育平台', kind: 'site', site: 'basic.smartedu.cn' },
    icve: { label: '智慧职教', kind: 'site', site: 'icve.com.cn' },
    open163: { label: '网易公开课', kind: 'site', site: 'open.163.com' }
  };
  var ORDER = {
    sen: ['bili', 'basic', 'mooc', 'icve', 'xuetang', 'open163'],
    uni: ['mooc', 'xuetang', 'smartedu', 'icve', 'bili', 'open163']
  };
  function urlOf(k, kw) {
    var s = SRC[k]; if (!s) { return null; }
    if (s.kind === 'search') { return s.tpl + encodeURIComponent(kw); }
    return 'https://www.bing.com/search?q=' + encodeURIComponent('site:' + s.site + ' ' + kw);
  }
  function listOf(node) {
    if (!node) { return []; }
    var kw = (node.level === 'uni' ? '' : '一数 ') + node.label + ' ' + (node.book || '');
    return (ORDER[node.level] || ORDER.uni).map(function (k) { return { key: k, label: SRC[k].label, url: urlOf(k, kw), sub: kw }; });
  }
  function mount(node) {
    var host = document.getElementById('moocList');
    if (!node) { return; }
    if (!host) {
      var dl = document.querySelector('#view-teach .teach-main') || document.getElementById('videoList');
      if (!dl) { return; }
      host = document.createElement('div');
      host.id = 'moocList';
      if (dl.id === 'videoList') { dl.parentNode.insertBefore(host, dl.nextSibling); } else { dl.appendChild(host); }
    }
    var list = listOf(node);
    var bv = (root.BILI && root.BILI[node.id]) || [];
    if (bv.length) {
      list = bv.map(function (v) {
        return { key: 'bv', label: 'B 站 · ' + (v.up || 'UP 主'), url: 'https://www.bilibili.com/video/' + v.bvid,
                 sub: v.title + '（' + Math.round((v.dur || 0) / 60) + ' 分钟）' };
      }).concat(list.filter(function (x) { return x.key !== 'bili'; }));
    }
    host.innerHTML = '<div class="mooc-head">这个知识点的更多来源 <em>' +
      (bv.length ? 'B站已核实 ' + bv.length + ' 个具体视频 · ' : '') +
      '其余为站内检索，不会失效</em></div>' +
      '<div class="mooc-grid">' + list.map(function (r) {
        return '<a class="mooc-card" href="' + r.url + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="mc-src">' + r.label + '</span><span class="mc-kw">' + r.sub + '</span><span class="mc-go">去找 →</span></a>';
      }).join('') + '</div>';
  }
  root.Resources = { mount: mount, listOf: listOf, SRC: SRC };
})(typeof globalThis !== 'undefined' ? globalThis : this);
