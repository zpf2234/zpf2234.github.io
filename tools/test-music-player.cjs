'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
class Element {
  constructor() { this.listeners={}; this.attrs={}; this.children=[]; this.dataset={}; this.value=''; this.checked=true; this.style={setProperty:(k,v)=>{this.style[k]=v;}}; const classes=new Set(); this.classList={toggle:(k,v)=>v?classes.add(k):classes.delete(k),contains:k=>classes.has(k),remove:k=>classes.delete(k)}; }
  addEventListener(k,fn) { (this.listeners[k] ||= []).push(fn); }
  dispatchEvent(event) { for(const fn of this.listeners[event.type]||[]) fn(event); }
  fire(type) { this.dispatchEvent({type}); }
  click() { if(!this.disabled) this.fire('click'); }
  setAttribute(k,v) { this.attrs[k]=v; }
  removeAttribute(k) { delete this.attrs[k]; }
  querySelector(k) { return nodes[k] ||= new Element(); }
  append(node) { this.children.push(node); }
  replaceChildren() { this.children=[]; }
  scrollTo() {}
  showModal() { this.open=true; }
  close() { this.open=false; }
}
const nodes={};
const get=selector=>nodes[selector] ||= new Element();
const widget=get('.music-widget'),audio=get('audio');
Object.assign(audio,{dataset:{src:'/music/output.mp3',title:'螺旋'},paused:true,ended:false,currentTime:0,duration:233.258667,volume:.35,muted:false,
  play(){this.paused=false; this.ended=false; this.fire('play'); return Promise.resolve();},
  pause(){this.paused=true;this.fire('pause');},
  load(){this.currentTime=0;this.fire('loadedmetadata');}
});
get('.lyrics-font').value='sans';get('.lyrics-size').value='22';get('#music-title').textContent='螺旋';
const storage=new Map();
const context=vm.createContext({document:{querySelector:get,createElement:()=>new Element()},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},fetch:async()=>({ok:true,blob:async()=>({})}),URL:{createObjectURL:()=> 'blob:test'},CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}},TextDecoder,matchMedia:()=>({matches:false})});
for(const file of ['journey-music.js','music-lyrics.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../source/js',file),'utf8'),context);
const flush=async()=>{for(let i=0;i<12;i++) await Promise.resolve();};
(async()=>{
  await flush();
  assert.equal(get('#music-title').textContent,'螺旋');
  assert.equal(audio.paused,true,'Never autoplay on load');
  assert.equal(get('.music-play').disabled,false);
  assert.equal(get('.music-time').textContent,'0:00 / 3:53');
  get('.music-play').click(); await flush(); assert.equal(audio.paused,false);
  get('.music-play').click(); assert.equal(audio.paused,true);
  get('.music-seek').value='50';get('.music-seek').fire('input');assert(Math.abs(audio.currentTime-116.6293335)<.001);
  get('.music-volume input').value='0';get('.music-volume input').fire('input');get('.music-mute').click();assert(audio.volume>0);
  get('.music-mute').click();assert.equal(audio.muted,true);
  get('.music-speed').value='1.5';get('.music-speed').fire('change');assert.equal(audio.playbackRate,1);
  assert.equal(audio.loop,false,'Homepage playback is always random, not a loop mode');
  assert.equal(audio.playbackRate,1,'Homepage playback stays at normal speed');
  get('.music-lyrics-open').click();assert.equal(get('.lyrics-dialog').open,true);
  const lyrics='[00:01.00]测试第一行\n[00:05.00]测试第二行';
  const bytes=new TextEncoder().encode(lyrics);
  get('.lyrics-file').files=[{name:'test.lrc',size:bytes.length,arrayBuffer:async()=>bytes.buffer}];get('.lyrics-file').fire('change');await flush();
  assert.equal(get('.lyrics-body').children.length,2);
  audio.currentTime=6;audio.fire('timeupdate');assert.equal(get('.lyrics-body').children[1].attrs['aria-current'],'true');
  get('.lyrics-body').children[0].click();assert.equal(audio.currentTime,1);
  get('.lyrics-font').value='serif';get('.lyrics-font').fire('change');get('.lyrics-size').value='30';get('.lyrics-size').fire('input');assert.equal(get('.lyrics-dialog').style['--lyrics-size'],'30px');assert(storage.has('boki-lyrics-type'));
  get('.music-file').files=[{name:'local.mp3',type:'audio/mpeg'}];get('.music-file').fire('change');await flush();assert.equal(get('#music-title').textContent,'local');assert.equal(get('.music-next').disabled,false);
  assert.equal(get('.lyrics-body').children.length,1,'Different tracks must not reuse wrong lyrics');
  get('.music-prev').click();await flush();assert.equal(get('#music-title').textContent,'螺旋');assert.equal(get('.lyrics-body').children.length,2);
  get('.music-next').click();await flush();audio.ended=true;audio.paused=true;audio.fire('ended');await flush();assert.equal(get('#music-title').textContent,'螺旋','Random mode chooses another track when the list has multiple songs');
  get('.lyrics-close').click();assert.equal(get('.lyrics-dialog').open,false);
  console.log('PASS: random normal-speed minimal player, no autoplay, play/pause, local playlist, LRC highlight/seek, track isolation, typography persistence');
})().catch(error=>{console.error(error);process.exitCode=1;});
