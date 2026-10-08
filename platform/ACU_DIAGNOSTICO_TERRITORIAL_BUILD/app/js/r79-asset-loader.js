/* R79 transport only: byte-verified chunks, native JSON parsing, no data transforms. */
(function () {
  'use strict';
  const jobs = new Map(), loaded = new Map();
  const hex = bytes => [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
  async function digest(bytes) { return hex(await crypto.subtle.digest('SHA-256', bytes)); }
  function register(key, source, parts, expected, prefix, suffix) {
    if (jobs.has(key)) return jobs.get(key);
    const pending = (async () => {
      const chunks = [];
      for (const part of parts) {
        const url = new URL(part.path, source);
        if (url.origin !== location.origin) throw Error('R79_CROSS_ORIGIN_ASSET');
        const response = await fetch(url, {credentials:'same-origin', cache:'no-store'});
        if (!response.ok) throw Error('R79_ASSET_HTTP_' + response.status);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (await digest(bytes) !== part.sha256) throw Error('R79_CHUNK_INTEGRITY');
        chunks.push(bytes);
      }
      const bytes = new Uint8Array(chunks.reduce((n, b) => n + b.length, 0));
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      if (await digest(bytes) !== expected) throw Error('R79_SOURCE_INTEGRITY');
      const text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
      if (!text.startsWith(prefix) || !text.endsWith(suffix)) throw Error('R79_SOURCE_ENVELOPE');
      window[key] = JSON.parse(text.slice(prefix.length, suffix.length ? -suffix.length : undefined));
      loaded.set(key, {sha256:expected, bytes:bytes.length, parts:parts.length});
      return window[key];
    })();
    jobs.set(key, pending);
    return pending;
  }
  window.ACU_R79_ASSETS = Object.freeze({
    register,
    ready: key => jobs.get(key) || Promise.resolve(window[key]),
    snapshot: () => Object.fromEntries(loaded)
  });
})();

