'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../source/js/blog-style.js'), 'utf8');
function environment(saved, blocked = false) {
  const items = [], docEvents = {}, windowEvents = {}, storage = new Map();
  if (saved) storage.set('boki-blog-style', saved);
  let loads = 0;
  class Element {
    constructor() { this.attrs = {}; this.events = {}; this.label = {textContent:''}; }
    setAttribute(k,v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k,fn) { this.events[k] = fn; }
    querySelector() { return this.label; }
  }
  const root = {dataset:{}};
  const document = {
    documentElement:root, readyState:'loading',
    querySelector:selector => items.find(item => '.' + item.className === selector) || null,
    createElement:() => new Element(),
    addEventListener:(name,fn) => { docEvents[name] = fn; },
    body:{prepend:element => items.unshift(element),append:element => items.push(element)}
  };
  const localStorage = {getItem:k => {if(blocked) throw Error('blocked'); return storage.get(k);},setItem:(k,v)=>{if(blocked) throw Error('blocked'); storage.set(k,v);}};
  const pendingImages = [];
  const window = {addEventListener:(name,fn) => {windowEvents[name] = fn;}};
  const context = vm.createContext({window,document,localStorage,Image:class {set src(value) {loads++; pendingImages.push(this);}}});
  vm.runInContext(source, context);
  docEvents.DOMContentLoaded();
  return {root,items,storage,docEvents,windowEvents,pendingImages,get loads(){return loads;},button:()=>document.querySelector('.blog-style-toggle'),runAgain:()=>vm.runInContext(source,context)};
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
(async () => {
  const page = environment();
  assert.equal(page.root.dataset.blogStyle,'journal');
  assert.equal(page.loads,0,'Default journal must not request anime art');
  assert.equal(page.button().attrs['aria-pressed'],'false');
  page.button().events.click();
  assert.equal(page.root.dataset.blogStyle,'anime');
  assert.equal(page.storage.get('boki-blog-style'),'anime');
  assert.equal(page.loads,1);
  page.pendingImages[0].onload(); await flush();
  assert.equal(page.root.dataset.animeReady,'true');
  assert.equal(page.button().attrs['aria-label'],'切换为手账风格');
  assert.equal(page.button().attrs['aria-busy'],undefined);
  const nextPage = environment(page.storage.get('boki-blog-style'));
  assert.equal(nextPage.root.dataset.blogStyle,'anime','Preference survives page navigation/reload');
  page.button().events.click();
  assert.equal(page.root.dataset.blogStyle,'journal');
  assert.equal(page.storage.get('boki-blog-style'),'journal');
  page.runAgain(); page.docEvents['pjax:complete']();
  assert.equal(page.items.filter(e=>e.className==='blog-style-toggle').length,1,'No duplicate switch');
  const rapid = environment(); rapid.button().events.click(); rapid.button().events.click(); rapid.pendingImages[0].onload(); await flush();
  assert.equal(rapid.root.dataset.blogStyle,'journal','Late image cannot override a newer selection');
  const failure = environment(); failure.button().events.click(); failure.pendingImages[0].onerror(); await flush();
  assert.equal(failure.root.dataset.blogStyle,'journal','Failed art returns to readable default');
  assert(failure.items.find(e=>e.className==='blog-style-status').textContent.includes('失败'));
  const privatePage = environment(null,true); privatePage.button().events.click(); privatePage.pendingImages[0].onload(); await flush();
  assert.equal(privatePage.root.dataset.blogStyle,'anime','Works when storage is unavailable');
  page.windowEvents.storage({key:'boki-blog-style',newValue:'anime'}); await flush();
  assert.equal(page.root.dataset.blogStyle,'anime','Other-tab preference is synced');
  console.log('PASS: default, toggle, image load, persistence, return, duplicate guard, race, failure, blocked storage, storage sync');
})().catch(error => { console.error(error); process.exitCode=1; });
