const fs = require('fs');
const repo = require('path').join(__dirname, '..');
let src = fs.readFileSync(__dirname + '/bookmarklet.src.html', 'utf8');
const css = fs.readFileSync(repo + '/unpacked.css', 'utf8');
const fav = fs.readFileSync(__dirname + '/favicon.txt', 'utf8').trim();
const bad = [];
if (/[^\x00-\x7f]/.test(src)) bad.push('non-ASCII in source: ' + src.match(/.{0,30}[^\x00-\x7f].{0,10}/)[0]);
if (/%[0-9a-fA-F]{2}/.test(src)) bad.push('percent-escape in source: ' + src.match(/.{0,20}%[0-9a-fA-F]{2}/)[0]);
const js = src.slice(src.indexOf('<script'));
const cm = js.split('\n').filter(l => /(^|[^:'"\\])\/\/(?!.*['"])/.test(l) && !/https?:\/\//.test(l));
if (cm.length) bad.push('possible // comments: ' + cm.join(' | '));
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
src = src.replace('{{FAVICON}}', fav).replace(/#/g, '%23').replace('{{CSS}}', encodeURIComponent(css));
const out = 'data:text/html,' + src;
fs.writeFileSync(repo + '/bookmarklet.html', out);
console.log('built', out.length, 'bytes');
