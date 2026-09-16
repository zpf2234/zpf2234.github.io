'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const nodes={},timers=new Map();let now=1000,id=0,animations=0,cancels=0;
class Element {
  constructor(){this.children=[];this.listeners={};this.attrs={};this.clientWidth=1200;this.clientHeight=700;this.style={setProperty:(k,v)=>{this.style[k]=v;}};const classes=new Set();this.classList={add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:(k,v)=>{const on=v??!classes.has(k);if(on)classes.add(k);else classes.delete(k);return on;}};}
  querySelector(s){return get(s);}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  dispatchEvent(e){for(const fn of this.listeners[e.type]||[])fn(e);}
  closest(){return this.interactive?this:null;}
  setAttribute(k,v){this.attrs[k]=v;}
  append(n){n.parent=this;this.children.push(n);}
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  replaceChildren(){this.children=[];}
  getBoundingClientRect(){return{left:0,top:0,width:1200,height:700,bottom:700};}
  animate(){animations++;return{cancel:()=>cancels++};}
}
const get=s=>nodes[s]??=new Element();
const document=new Element();document.querySelector=get;document.createElement=()=>new Element();document.body=get('body');document.hidden=false;document.getElementById=id=>get('#'+id);
const reduced=new Element();reduced.matches=false;
const context=vm.createContext({document,window:{getSelection:()=>({toString:()=>''})},innerHeight:900,performance:{now:()=>now},matchMedia:()=>reduced,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key),CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
for(const name of ['journal.js','journal-eggs.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../source/js',name),'utf8'),context);
const hero=get('.hero-scene'),effects=get('.egg-effects'),hello=get('.studio-word');
hello.dispatchEvent({type:'click',detail:0});
assert(document.body.classList.contains('is-dusk'));assert.equal(hello.attrs['aria-pressed'],'true');assert.equal(animations,1);assert(effects.children.some(n=>n.className==='egg-sweep'));
hello.dispatchEvent({type:'click',detail:1,clientX:700,clientY:320});assert(!document.body.classList.contains('is-dusk'));assert(cancels>0);
get('.motion-toggle').dispatchEvent({type:'click'});assert.equal(effects.children.length,0);
get('.sun-seed').dispatchEvent({type:'click'});assert.equal(effects.children.length,12,'One shower contains twelve staggered meteors');
get('.sun-seed').dispatchEvent({type:'click'});assert.equal(effects.children.length,12,'Rapid input must be throttled');
for(let i=0;i<8;i++){now+=600;get('.sun-seed').dispatchEvent({type:'click'});}assert(effects.children.length<=30,'Transient node cap');
reduced.matches=true;reduced.dispatchEvent({type:'change'});assert.equal(effects.children.length,0);now+=1000;
get('.sun-seed').dispatchEvent({type:'click'});assert.equal(effects.children.length,0);assert(get('.egg-message').textContent,'Reduced motion keeps textual response');
hello.dispatchEvent({type:'click',detail:0});assert(document.body.classList.contains('is-dusk'));assert.equal(effects.children.length,0);
reduced.matches=false;document.body.classList.add('motion-paused');get('.sun-seed').dispatchEvent({type:'click'});assert.equal(effects.children.length,0);
document.body.classList.remove('motion-paused');now+=1000;
const editor=new Element();editor.interactive=true;
for(const key of 'hello')document.dispatchEvent({type:'keydown',key,target:editor});assert.equal(effects.children.length,0,'Typing in editors must not trigger eggs');
for(const key of 'hello')document.dispatchEvent({type:'keydown',key,target:hero});assert.equal(effects.children.length,9);
document.hidden=true;document.dispatchEvent({type:'visibilitychange'});assert.equal(effects.children.length,0);assert(!get('.egg-message').classList.contains('is-visible'));
console.log('PASS: reversible day/night, keyboard activation, full-scene shower, throttle, node cap, reduced motion, pause, editor exclusion, hidden-page cleanup');
