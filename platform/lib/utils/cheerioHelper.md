```javascript
function htmlContent(dom) {
  let html = dom.html();
  html = html.replace(
    'xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink"',
    'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
  );
  html = html.replace(
    /xlink="http:\/\/www\.w3\.org\/1999\/xlink" href=/gm,
    'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href='
  );

  // Ensure doctype has a line break before and after
  html = html.replace(/\s*<!doctype([^>]+)>\s*/i, '\n<!doctype$1>\n');
  // Ensure <head> has a line break before and after
  html = html.replace(/\s*<(\/?head)>\s*/i, '\n<$1>\n');
  // Remove empty lines
  html = html.replace(/\n\s+\n/g, '\n');
  return html;
}

module.exports = {
  htmlContent,
};
```