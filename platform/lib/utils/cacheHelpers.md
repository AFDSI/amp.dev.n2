```javascript
function setNoCache(response) {
  response.setHeader(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate'
  );
}

function setMaxAge(response, maxAge, cdnMaxAge = '') {
  if (cdnMaxAge) {
    cdnMaxAge = `s-max-age=${cdnMaxAge}, `;
  }
  response.setHeader(
    'Cache-Control',
    `public, max-age=${maxAge}, ${cdnMaxAge}stale-while-revalidate=${Math.floor(
      maxAge * 2
    )}`
  );
}

function setImmutable(response) {
  response.setHeader('Cache-Control', 'max-age=365000000, immutable');
}

function setNoSniff(response) {
  response.setHeader('x-content-type-options', 'nosniff');
}

function setHsts(response) {
  response.setHeader(
    'strict-transport-security',
    'max-age=31536000; includeSubDomains; preload'
  );
}

function setXssProtection(response) {
  response.setHeader('x-xss-protection', '1; mode=block');
}

function setAmpCSP(response) {
  response.setHeader(
    'content-security-policy',
    "default-src * blob: data:; script-src blob: https://cdn.ampproject.org/esm/ https://cdn.ampproject.org/mp/ https://cdn.ampproject.org/rtv/ https://cdn.ampproject.org/sp/ https://cdn.ampproject.org/sw/ https://cdn.ampproject.org/v0.js https://cdn.ampproject.org/v0/ https://cdn.ampproject.org/viewer/; object-src 'none'; style-src 'unsafe-inline' https://cdn.ampproject.org/rtv/ https://cdn.materialdesignicons.com https://cloud.typography.com https://fast.fonts.net https://fonts.googleapis.com https://maxcdn.bootstrapcdn.com https://p.typekit.net https://pro.fontawesome.com https://use.fontawesome.com https://use.typekit.net; report-uri https://csp-collector.appspot.com/csp/amp"
  );
}

module.exports = {
  setNoCache,
  setMaxAge,
  setImmutable,
  setNoSniff,
  setXssProtection,
  setAmpCSP,
  setHsts,
};
```