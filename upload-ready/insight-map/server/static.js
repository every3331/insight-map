'use strict';
/* 静态托管 + 统一的响应封装（零依赖）。 */

const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon'
};

function send(res, code, type, body) {
  res.writeHead(code, {
    'content-type': type,
    'cache-control': 'no-store',
    'access-control-allow-origin': '*'
  });
  res.end(body);
}

function sendJson(res, code, obj) {
  send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj));
}

function createStatic(root) {
  return function serveStatic(req, res) {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') { p = '/index.html'; }

    const file = path.join(root, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
    if (!file.startsWith(root)) { return send(res, 403, 'text/plain', 'forbidden'); }

    fs.readFile(file, (err, buf) => {
      if (err) { return send(res, 404, 'text/plain; charset=utf-8', 'not found'); }
      const ext = path.extname(file).toLowerCase();
      send(res, 200, MIME[ext] || 'application/octet-stream', buf);
    });
  };
}

module.exports = { createStatic, send, sendJson, MIME };
