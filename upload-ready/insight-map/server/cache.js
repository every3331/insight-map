'use strict';
/* 诊断缓存：sha256(题目文本) 前 16 位做键，落盘成 JSON。
 * 演示现场最稳的一条路 —— 同一道题第二次点必然是「缓存命中」。
 */

const fs = require('fs');
const crypto = require('crypto');

function createCache(file) {
  let store = {};
  try { store = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { store = {}; }

  function keyOf(text) {
    return crypto.createHash('sha256').update(String(text).replace(/\s+/g, '')).digest('hex').slice(0, 16);
  }
  function get(key) { return store[key]; }
  function set(key, value) {
    store[key] = value;
    save();
  }
  function size() { return Object.keys(store).length; }
  function save() {
    try { fs.writeFileSync(file, JSON.stringify(store, null, 2), 'utf8'); } catch (e) { /* 只读盘就算了 */ }
  }
  return { keyOf, get, set, size, save, all: () => store };
}

module.exports = { createCache };
