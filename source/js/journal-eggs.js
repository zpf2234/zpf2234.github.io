(function () {
  'use strict';
  const hero = document.querySelector('.hero-scene');
  const effects = hero?.querySelector('.egg-effects');
  const message = hero?.querySelector('.egg-message');
  const seed = hero?.querySelector('.sun-seed');
  if (!hero || !effects || !message || !seed) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const greetings = ['你好，今天也请保持一点好奇。','给认真生活的你，留一束光。','偶尔停一下，也是在向前。','不必闪耀，微微发光也很好。','你发现了这里的一点小心意。'];
  const timers = new Set();
  let toastTimer = 0, buffer = '', keyTime = 0, lastEffect = -Infinity, lastGreeting = -1;
  let helloAnimation = null;
  const interactive = target => target.closest('a,button,input,select,textarea,summary,dialog,[contenteditable]:not([contenteditable=false]),[role=textbox]');
  const canMove = () => !reduced.matches && !document.body.classList.contains('motion-paused') && !document.hidden;
  const inView = () => { const rect = hero.getBoundingClientRect(); return rect.bottom > innerHeight*.35 && rect.top < innerHeight*.5; };
  function say(text) {
    clearTimeout(toastTimer);
    message.textContent = text; message.classList.add('is-visible');
    toastTimer = setTimeout(() => message.classList.remove('is-visible'), 4800);
  }
  function greeting() {
    let index = Math.floor(Math.random()*greetings.length);
    if (index === lastGreeting) index = (index+1)%greetings.length;
    lastGreeting = index; say(greetings[index]);
  }
  function add(className,x,y,dx,dy,delay=0) {
    if (effects.children.length >= 30) return;
    const node = document.createElement('span'); node.className=className;
    node.style.left=x+'px';node.style.top=y+'px';
    node.style.animationDelay=delay+'ms';
    if(dx!==undefined) {node.style.setProperty('--dx',dx+'px');node.style.setProperty('--dy',dy+'px');}
    effects.append(node);
    const timer=setTimeout(()=>{node.remove();timers.delete(timer);},2600+delay);timers.add(timer);
  }
  function burst(x,y) {
    if(!canMove() || performance.now()-lastEffect<500) return;
    lastEffect=performance.now();add('egg-ring',x,y);
    for(let i=0;i<8;i++){const angle=i*Math.PI/4;add('egg-spark',x,y,Math.cos(angle)*85,Math.sin(angle)*85);}
  }
  hero.addEventListener('dblclick',event=>{
    if(interactive(event.target) || window.getSelection()?.toString()) return;
    const rect=hero.getBoundingClientRect();burst(event.clientX-rect.left,event.clientY-rect.top);
    say('涟漪很轻，好奇心也是。');
  });
  seed.addEventListener('click',()=>{
    greeting();
    if(!canMove() || performance.now()-lastEffect<500) return;
    lastEffect=performance.now();
    const width=hero.clientWidth, height=hero.clientHeight;
    // A staggered shower spans the whole opening, with bounded transient nodes.
    for(let i=0;i<12;i++) {
      const startX=width*((i*0.173)%1)-width*.3;
      const startY=height*((i*0.113)%.55);
      add('egg-meteor',startX,startY,width*.72,height*.52,i*125);
    }
    say('这一场流星雨，送给刚好路过的你。');
  });
  hero.addEventListener('journal:lightchange',event=>{
    helloAnimation?.cancel();helloAnimation=null;
    if(!canMove()) return;
    add('egg-sweep',event.detail.x,event.detail.y);
    const lettering=hero.querySelector('.glass-lettering');
    if(lettering?.animate) helloAnimation=lettering.animate([
      {transform:'translateY(0) scale(1)'},
      {transform:'translateY(-32px) scale(1.12) rotate(4deg)',offset:.38},
      {transform:'translateY(0) scale(1)'}
    ],{duration:1550,easing:'cubic-bezier(.2,.7,.2,1)'});
  });
  document.addEventListener('keydown',event=>{
    if(event.isComposing || event.repeat || event.ctrlKey || event.altKey || event.metaKey || interactive(event.target) || !inView()) {buffer='';return;}
    if(event.key==='Escape') {message.classList.remove('is-visible');buffer='';return;}
    if(event.key.length!==1) return;
    const now=performance.now(); if(now-keyTime>2200) buffer='';keyTime=now;
    buffer=(buffer+event.key.toLowerCase()).slice(-5);
    if(buffer==='hello') {buffer='';greeting();burst(hero.clientWidth*.65,hero.clientHeight*.4);}
  });
  function clearEffects() {timers.forEach(clearTimeout);timers.clear();effects.replaceChildren();helloAnimation?.cancel();helloAnimation=null;}
  document.querySelector('.motion-toggle')?.addEventListener('click',clearEffects);
  reduced.addEventListener('change',clearEffects);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearEffects();clearTimeout(toastTimer);message.classList.remove('is-visible');buffer='';}});
}());
