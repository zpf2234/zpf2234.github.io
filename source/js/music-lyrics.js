(function () {
  'use strict';
  const widget = document.querySelector('.music-widget');
  if (!widget) return;
  const find = selector => widget.querySelector(selector);
  const dialog = find('.lyrics-dialog'), audio = find('audio'), panel = find('.lyrics-body');
  if (!dialog || !audio) return;
  const font = find('.lyrics-font'), size = find('.lyrics-size'), output = find('.lyrics-size-value');
  const input = find('.lyrics-file'), status = find('.lyrics-status'), follow = find('.lyrics-follow');
  const preview = {prev:find('.music-lyric-prev'), current:find('.music-lyric-current'), next:find('.music-lyric-next')};
  const flow = document.querySelector('.lyric-flow'), flowTrack = flow?.querySelector('.lyric-flow-track');
  const flowNow = flow?.querySelector('.lyric-flow-now-text');
  const tracks = new Map();
  let trackId = audio.dataset.trackId || '0', active = -1, importVersion = 0, flowEntry = null;
  const families = {sans:'"Microsoft YaHei", "PingFang SC", sans-serif',serif:'"Songti SC", SimSun, Georgia, serif',kai:'KaiTi, STKaiti, "Songti SC", serif'};
  const format = seconds => Number.isFinite(seconds) ? Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0') : '0:00';
  function typography(save) {
    if (!(font.value in families)) font.value = 'sans';
    const pixels = Math.max(16,Math.min(34,Number(size.value)||22));
    size.value = pixels; output.value = String(pixels);
    dialog.style.setProperty('--lyrics-font', families[font.value]);
    dialog.style.setProperty('--lyrics-size', pixels+'px');
    if (save) try { localStorage.setItem('boki-lyrics-type',JSON.stringify({font:font.value,size:pixels})); } catch (_) {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem('boki-lyrics-type') || 'null');
    if (saved) { font.value = saved.font; size.value = saved.size; }
  } catch (_) {}
  typography(false);
  font.addEventListener('change',()=>typography(true));
  size.addEventListener('input',()=>typography(true));
  function parse(text) {
    const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0)/1000;
    const lines = [], plain = [];
    for (const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)) {
      const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const lyric = raw.replace(/\[[^\]]*\]/g,'').trim();
      if (stamps.length) for (const stamp of stamps) {
        const seconds = Number(stamp[2]);
        if (seconds < 60) lines.push({time:Math.max(0,Number(stamp[1])*60+seconds+Number('0.'+(stamp[3]||'0'))-offset),text:lyric});
      }
      else if (lyric) plain.push({time:null,text:lyric});
    }
    return {timed:lines.length>0,lines:lines.length ? lines.sort((a,b)=>a.time-b.time) : plain};
  }
  function scrollActive(node) {
    if (!dialog.open || !follow.checked || !node) return;
    panel.scrollTo({top:Math.max(0,node.offsetTop-panel.clientHeight/2+node.offsetHeight/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function updatePreview(entry, index) {
    if (!preview.current) return;
    if (!entry?.lines?.length) {
      preview.prev.textContent = '';
      preview.current.textContent = entry ? '暂无可同步歌词' : '正在加载歌词…';
      preview.next.textContent = '';
      preview.current.classList.toggle('is-placeholder', true);
      return;
    }
    const line = index >= 0 ? entry.lines[index] : null;
    const previous = index > 0 ? entry.lines[index - 1] : null;
    const next = index >= 0 ? entry.lines[index + 1] : entry.lines[0];
    preview.prev.textContent = previous?.text || '';
    preview.current.textContent = line?.text || '♪';
    preview.next.textContent = next?.text || '';
    preview.current.classList.toggle('is-placeholder', !line?.text);
  }
  function renderFlow(entry) {
    if (!flowTrack || entry === flowEntry) return;
    flowEntry = entry || null;
    flowTrack.replaceChildren();
    flow?.classList.toggle('has-lyrics', Boolean(entry?.lines?.length));
    if (!entry?.lines?.length) return;
    const lines = entry.lines.concat(entry.lines);
    lines.forEach((line, copyIndex) => {
      const node = document.createElement('span');
      node.className = 'lyric-flow-line';
      node.dataset.index = String(copyIndex % entry.lines.length);
      node.textContent = line.text || '♪';
      flowTrack.append(node);
    });
  }
  function updateFlow(index) {
    if (!flowTrack) return;
    Array.from(flowTrack.children).forEach(node => node.classList.toggle('is-current', Number(node.dataset.index) === index));
    const duration = Number(audio.duration);
    if (flow?.classList.contains('has-lyrics') && Number.isFinite(duration) && duration > 0) {
      const progress = Math.max(0, Math.min(1, Number(audio.currentTime) / duration));
      flow.classList.toggle('is-audio-sync', true);
      flowTrack.style.transform = 'translate3d(0,' + (-51 * progress).toFixed(3) + '%,0) rotate(-7deg)';
    } else {
      flow?.classList.toggle('is-audio-sync', false);
      flowTrack.style.removeProperty?.('transform');
    }
  }
  function moveFlow(event) {
    if (!flow || event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const x = Math.max(-1, Math.min(1, (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1));
    flow.style.setProperty('--lyric-shift-x', (x * 18).toFixed(1) + 'px');
    flow.style.setProperty('--lyric-shift-y', (y * 12).toFixed(1) + 'px');
  }
  function resetFlow() {
    if (!flow) return;
    flow.style.setProperty('--lyric-shift-x', '0px');
    flow.style.setProperty('--lyric-shift-y', '0px');
  }
  function pulseFlow(event) {
    if (!flow || document.body?.classList?.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = event.target;
    if (target?.closest?.('a,button,input,select,summary,dialog')) return;
    const pulse = document.createElement('span');
    pulse.className = 'lyric-flow-pulse';
    pulse.style.left = event.clientX + 'px';
    pulse.style.top = event.clientY + 'px';
    if (flow.querySelectorAll('.lyric-flow-pulse').length >= 2) flow.querySelector('.lyric-flow-pulse')?.remove();
    flow.append(pulse);
    window.setTimeout(() => pulse.remove(), 1200);
  }
  if (flow && typeof document.addEventListener === 'function') {
    document.addEventListener('pointermove', moveFlow, {passive:true});
    document.addEventListener('pointerleave', resetFlow, {passive:true});
    document.addEventListener('click', pulseFlow, {passive:true});
  }
  function sync(force) {
    const playing = !audio.paused && !audio.ended;
    flow?.classList.toggle('is-playing', playing);
    const button = find('.lyrics-play');
    button.textContent = playing ? '暂停' : '播放';
    button.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');
    button.disabled = find('.music-play').disabled;
    find('.lyrics-clock').textContent = format(audio.currentTime)+' / '+format(audio.duration);
    const entry = tracks.get(trackId);
    if (!entry?.timed) {
      updatePreview(entry, -1); updateFlow(-1);
      flow?.classList.toggle('has-current', false);
      if (flowNow) flowNow.textContent = '';
      return;
    }
    let index = -1;
    for (let i=0;i<entry.lines.length;i++) { if (entry.lines[i].time<=audio.currentTime) index=i; else break; }
    flow?.classList.toggle('has-current', index >= 0);
    if (flowNow) flowNow.textContent = index >= 0 ? (entry.lines[index].text || '♪') : '';
    if (index===active && !force) { updateFlow(index); return; }
    active=index;
    updatePreview(entry, index);
    updateFlow(index);
    if (!dialog.open) return;
    Array.from(panel.children).forEach((node,i)=>{node.classList.toggle('is-current',i===index); if(i===index) node.setAttribute('aria-current','true'); else node.removeAttribute('aria-current');});
    scrollActive(panel.children[index]);
  }
  function render() {
    panel.replaceChildren(); active=-1;
    find('#lyrics-title').textContent = find('#music-title').textContent;
    const entry=tracks.get(trackId);
    renderFlow(entry);
    if (!entry) {
      const empty=document.createElement('p'); empty.className='lyrics-empty';
      empty.textContent='还没有这首歌的歌词。导入 LRC 可同步高亮，TXT 可直接阅读。';
      panel.append(empty); status.textContent='歌词只在本页使用，不会上传。';
    } else {
      entry.lines.forEach(line=>{
        const node=document.createElement(entry.timed?'button':'p');
        node.className='lyric-line'; node.textContent=line.text || '♪';
        if(entry.timed) {node.type='button';node.setAttribute('aria-label',format(line.time)+' '+(line.text||'间奏'));node.addEventListener('click',()=>{if(Number.isFinite(audio.duration)) {audio.currentTime=Math.min(line.time,audio.duration);sync(true);}});}
        panel.append(node);
      });
      status.textContent=entry.timed?'点击歌词可跳转播放位置。':'纯文本歌词（无时间轴）。';
    }
    panel.scrollTop=0; sync(true);
  }
  async function loadBuiltInLyrics() {
    const source = audio.dataset.lyrics;
    if (!source || typeof fetch !== 'function') return;
    const selected = trackId, attempt = ++importVersion;
    try {
      const response = await fetch(source, {cache:'force-cache'});
      if (!response.ok || typeof response.text !== 'function') return;
      const entry = parse(await response.text());
      if (attempt !== importVersion || selected !== trackId || !entry.lines.length || tracks.has(selected)) return;
      tracks.set(selected, entry);
      renderFlow(entry);
      if (dialog.open) render();
      else sync(true);
    } catch (_) { /* Built-in lyrics are optional; the manual importer remains available. */ }
  }
  find('.music-lyrics-open').addEventListener('click',()=>{dialog.showModal();render();});
  find('.lyrics-close').addEventListener('click',()=>dialog.close());
  find('.lyrics-play').addEventListener('click',()=>find('.music-play').click());
  follow.addEventListener('change',()=>sync(true));
  find('.lyrics-import').addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    const file=input.files?.[0]; input.value=''; if(!file) return;
    if(!/\.(lrc|txt)$/i.test(file.name) || file.size>512*1024) {status.textContent='请选择小于 512 KB 的 LRC 或 TXT 文件。';return;}
    const selected=trackId, attempt=++importVersion;
    try {
      const bytes=await file.arrayBuffer(); let text;
      try {text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);} catch (_) {text=new TextDecoder('gb18030').decode(bytes);}
      if(attempt!==importVersion || selected!==trackId) return;
      const entry=parse(text);
      if(!entry.lines.length) {status.textContent='没有识别到歌词，请检查文件内容。';return;}
      tracks.set(selected,entry);renderFlow(entry);render();
    } catch (_) {if(selected===trackId) status.textContent='歌词读取失败，请重新选择文件。';}
  });
  widget.addEventListener('music:trackchange',event=>{trackId=event.detail.id;importVersion++;render();loadBuiltInLyrics();});
  ['timeupdate','play','pause','ended','loadedmetadata','durationchange','error'].forEach(event=>audio.addEventListener(event,()=>sync(false)));
  loadBuiltInLyrics();
}());
