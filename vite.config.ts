// codeam preview host-allow shim — auto-generated, restored on preview stop.
import __codeamUser from './vite.config.codeam-orig.ts';

function __codeamWithAllow(cfg) {
  var c = cfg && typeof cfg === 'object' ? Object.assign({}, cfg) : {};
  var server = Object.assign({}, c.server || {});
  if (server.allowedHosts === true) { c.server = server; return c; }
  var existing = Array.isArray(server.allowedHosts) ? server.allowedHosts : [];
  server.allowedHosts = Array.from(new Set(existing.concat([".trycloudflare.com",".preview.codeagent-mobile.com",".codeagent-mobile.com"])));
  c.server = server;
  return c;
}
function __codeamMerge(base) {
  if (typeof base === 'function') {
    return function () {
      var r = base.apply(null, arguments);
      return r && typeof r.then === 'function' ? r.then(__codeamWithAllow) : __codeamWithAllow(r);
    };
  }
  return base && typeof base.then === 'function' ? base.then(__codeamWithAllow) : __codeamWithAllow(base);
}
export default __codeamMerge(__codeamUser);
