'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const links = [...new Set([...html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)].map(match => match[1]))];
const missing = links.filter(link => !fs.existsSync(path.join(root, link.endsWith('/') ? link + 'index.html' : link)));
assert.deepEqual(missing, [], 'Homepage links and local resources must exist');
assert(html.includes('/css/journal.css') && html.includes('/js/journal.js'), 'New visual system must be loaded');
assert(!/<img\b/.test(html), 'Homepage must not rely on the former anime images');
assert(html.includes('studio-word') && html.includes('music-widget'), 'Keep glass hello and music');
assert(html.includes('/css/anime-chapter.css') && html.includes('class="anime-poetry"'), 'Anime chapter and poem must be present');
assert(html.includes('class="ambient-meteors"'), 'Homepage ambient meteor layer must be present');
assert(html.includes('music-minimal') && html.includes('music-lyrics-preview'), 'Homepage music card must keep a compact control layout and lyric preview');
assert(html.includes('class="lyric-flow"') && html.includes('lyric-flow-now-text'), 'Homepage full-screen lyric flow and current-line cue must be present');
assert(html.includes('data-src="/music/rasen-acoustic.mp3"') && html.includes('data-lyrics="/music/lyrics/rasen-acoustic.lrc"'), 'Rasen acoustic track and built-in lyrics must be wired');
assert(fs.existsSync(path.join(root, 'music', 'rasen-acoustic.mp3')) && fs.existsSync(path.join(root, 'music', 'lyrics', 'rasen-acoustic.lrc')), 'Rasen acoustic media assets must be generated');
assert(html.includes('雨だったなら') && html.includes('心臓の場所にある') && html.includes('久保帯人 · BLEACH 27') && html.includes('class="journal-only"') && html.includes('class="anime-only"'), 'Keep both Orihime poems and distinct style content');
assert(html.includes('property="og:title"') && html.includes('name="twitter:card"'), 'Homepage social preview metadata must be present');
assert(html.includes('application/atom+xml') && fs.existsSync(path.join(root, 'atom.xml')), 'Atom feed must be generated');
assert(fs.existsSync(path.join(root, 'sitemap.xml')), 'Sitemap must be generated');
const chapterCss = fs.readFileSync(path.join(root, 'css/anime-chapter.css'), 'utf8');
const chapterAssets = [...chapterCss.matchAll(/url\(['"]?(\/[^)'" ]+)/g)].map(match => match[1]);
for (const asset of chapterAssets) assert(fs.existsSync(path.join(root, asset)), 'Missing anime chapter artwork: ' + asset);
const interactionCss = fs.readFileSync(path.join(root, 'css/journal-eggs.css'), 'utf8');
assert(interactionCss.includes('@keyframes ambient-meteor'), 'Continuous meteor animation must be present');
const lyricsJs = fs.readFileSync(path.join(root, 'js/music-lyrics.js'), 'utf8');
assert(lyricsJs.includes('loadBuiltInLyrics') && fs.readFileSync(path.join(root, 'music', 'lyrics', 'rasen-acoustic.lrc'), 'utf8').includes('[03:23.491]'), 'Built-in Rasen lyrics loader and tail timestamp must be present');
const pages = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, {withFileTypes:true})) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.html')) pages.push(file);
  }
}
walk(root);
const formerArt = /\/img\/(?:orihime-[\w-]+|covers\/(?:red-scene|red-closeup|light-closeup|defend-you|bleach-poster))\.(?:jpg|png)/;
for (const page of pages) {
  const pageHtml = fs.readFileSync(page, 'utf8');
  assert(!formerArt.test(pageHtml), 'Anime artwork must stay opt-in, not hardcoded in ' + page);
  assert(pageHtml.includes('/js/blog-style.js') && pageHtml.includes('/css/blog-style.css'), 'Style switch missing on ' + page);
}
console.log(JSON.stringify({checkedPages:pages.length,checkedLocalLinks:links.length,missing,formerArtworkReferences:0,layout:'journal'},null,2));
