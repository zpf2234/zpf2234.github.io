(function () {
  'use strict';
  const widget = document.querySelector('.music-widget');
  if (!widget) return;
  const find = selector => widget.querySelector(selector);
  const audio = find('audio'), play = find('.music-play'), title = find('#music-title'), artist = find('#music-artist');
  const status = find('#music-status'), seek = find('.music-seek'), volume = find('.music-volume input');
  const fileInput = find('.music-file'), clock = find('.music-time'), mute = find('.music-mute');
  const loopButton = find('.music-loop'), speed = find('.music-speed'), list = find('.music-tracks');
  const tracks = [{title:audio.dataset.title || '螺旋', artist:audio.dataset.artist || '', url:null, local:false, lyrics:audio.dataset.lyrics || ''}];
  const modes = ['random', 'single', 'all'], labels = ['随机播放', '单曲循环', '列表循环'];
  let current = 0, version = 0, ready = false, wantPlay = false, message = '', defaultPromise;
  let mode = 'random', lastVolume = .35;
  function read(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (_) {} }
  const format = seconds => Number.isFinite(seconds) && seconds >= 0
    ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0') : '0:00';
  function progress() {
    const valid = ready && Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !valid;
    seek.value = valid ? audio.currentTime / audio.duration * 100 : 0;
    seek.style.setProperty('--played', seek.value + '%');
    seek.setAttribute('aria-valuetext', format(audio.currentTime) + ' / ' + format(audio.duration));
    clock.textContent = format(audio.currentTime) + ' / ' + (valid ? format(audio.duration) : '—:—');
  }
  function sync() {
    const playing = ready && !audio.paused && !audio.ended;
    widget.classList.toggle('is-playing', playing);
    play.setAttribute('aria-pressed', String(playing));
    play.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐');
    play.querySelector('use').setAttribute('href', playing ? '#icon-pause' : '#icon-play');
    play.disabled = !ready;
    find('.music-restart').disabled = !ready;
    find('.music-prev').disabled = find('.music-next').disabled = tracks.length < 2;
    status.textContent = message || (playing ? '正在播放' : ready ? '点击播放' : '正在加载音乐…');
  }
  function renderList() {
    list.replaceChildren();
    tracks.forEach((track, index) => {
      const item = document.createElement('li'), button = document.createElement('button');
      button.type = 'button'; button.textContent = (index + 1) + '. ' + track.title;
      button.title = track.title; button.setAttribute('aria-current', String(index === current));
      button.addEventListener('click', () => selectTrack(index, true));
      item.append(button); list.append(item);
    });
    find('.music-count').textContent = tracks.length + ' 首';
  }
  function defaultSource() {
    if (!defaultPromise) defaultPromise = fetch(audio.dataset.src)
      .then(response => { if (!response.ok) throw new Error('Audio unavailable'); return response.blob(); })
      .then(blob => { tracks[0].url = URL.createObjectURL(blob); return tracks[0].url; })
      .catch(error => { defaultPromise = null; throw error; });
    return defaultPromise;
  }
  async function start() {
    if (!ready) return;
    const selected = version;
    wantPlay = true; message = '';
    try {
      await audio.play();
      if (selected === version && !wantPlay) audio.pause();
    } catch (error) {
      if (selected === version && error.name !== 'AbortError') {
        wantPlay = false; message = '未能播放，请重试或换一首'; sync();
      }
    }
  }
  async function selectTrack(index, autoplay) {
    const selected = ++version;
    wantPlay = false; ready = false; message = '';
    audio.pause();
    current = index;
    audio.dataset.trackId = String(index);
    title.textContent = tracks[index].title; title.title = tracks[index].title;
    if (artist) { artist.textContent = tracks[index].artist || ''; artist.hidden = !tracks[index].artist; }
    widget.dispatchEvent(new CustomEvent('music:trackchange', {detail:{id:String(index), title:tracks[index].title, lyrics:tracks[index].lyrics || ''}}));
    sync(); renderList(); progress();
    try {
      const url = tracks[index].url || await defaultSource();
      if (selected !== version) return;
      audio.src = url; audio.load();
      audio.playbackRate = 1; if (speed) speed.value = '1';
      ready = true; sync(); progress();
      if (autoplay) start();
    } catch (_) {
      if (selected !== version) return;
      message = '音频加载失败，可在列表重试或添加本地音乐'; sync();
    }
  }
  function applyMode() {
    audio.loop = false;
    const label = labels[modes.indexOf(mode)];
    if (loopButton) { loopButton.textContent = label; loopButton.setAttribute('aria-label', '播放模式：' + label + '，点击切换'); loopButton.hidden = false; }
  }
  function volumeUI() {
    const silent = audio.muted || audio.volume === 0;
    volume.value = audio.volume;
    volume.style.setProperty('--played', (silent ? 0 : audio.volume * 100) + '%');
    mute.setAttribute('aria-pressed', String(silent));
    mute.setAttribute('aria-label', silent ? '取消静音' : '静音');
  }
  const savedVolume = Number(read('boki-music-volume', '.35'));
  audio.volume = Number.isFinite(savedVolume) ? Math.max(0, Math.min(1, savedVolume)) : .35;
  if (audio.volume > 0) lastVolume = audio.volume;
  audio.muted = read('boki-music-muted', 'false') === 'true';
  const savedMode = read('boki-music-loop', 'random');
  mode = modes.includes(savedMode) ? savedMode : 'random';
  speed.value = '1';
  applyMode(); volumeUI();

  play.addEventListener('click', () => {
    if (audio.paused) start();
    else { wantPlay = false; audio.pause(); }
  });
  find('.music-restart').addEventListener('click', () => { if (ready) { audio.currentTime = 0; start(); } });
  find('.music-prev').addEventListener('click', () => { if (tracks.length > 1) selectTrack((current - 1 + tracks.length) % tracks.length, true); });
  find('.music-next').addEventListener('click', () => { if (tracks.length > 1) selectTrack((current + 1) % tracks.length, true); });
  seek.addEventListener('input', () => {
    if (ready && Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, Number(seek.value) / 100 * audio.duration));
      progress();
    }
  });
  volume.addEventListener('input', () => {
    audio.volume = Math.max(0, Math.min(1, Number(volume.value)));
    if (audio.volume > 0) lastVolume = audio.volume;
    audio.muted = false;
    save('boki-music-volume', audio.volume); save('boki-music-muted', false); volumeUI();
  });
  mute.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) { audio.muted = false; if (!audio.volume) audio.volume = lastVolume; }
    else audio.muted = true;
    save('boki-music-muted', audio.muted); save('boki-music-volume', audio.volume); volumeUI();
  });
  loopButton?.addEventListener('click', () => { mode = modes[(modes.indexOf(mode) + 1) % modes.length]; applyMode(); save('boki-music-loop', mode); });
  speed?.addEventListener('change', () => { speed.value = '1'; audio.playbackRate = 1; });
  find('.music-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    const valid = files.filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg|flac|aac|opus)$/i.test(file.name));
    const first = tracks.length;
    for (const file of valid.slice(0, Math.max(0, 50 - tracks.length))) tracks.push({title:file.name.replace(/\.[^.]+$/, ''), artist:'', url:URL.createObjectURL(file), local:true, lyrics:''});
    fileInput.value = '';
    if (tracks.length > first) { find('.music-playlist').open = true; selectTrack(first, true); }
    else { message = tracks.length >= 50 ? '列表最多可添加 50 首' : '请选择可播放的音频文件'; sync(); }
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  audio.addEventListener('playing', () => { message = ''; sync(); });
  audio.addEventListener('waiting', () => { if (wantPlay) { message = '缓冲中…'; sync(); } });
  audio.addEventListener('timeupdate', progress);
  audio.addEventListener('loadedmetadata', progress);
  audio.addEventListener('durationchange', progress);
  audio.addEventListener('volumechange', volumeUI);
  audio.addEventListener('ended', () => {
    wantPlay = false;
    if (mode === 'single') { selectTrack(current, true); return; }
    let next = current;
    if (mode === 'random' && tracks.length > 1) {
      do { next = Math.floor(Math.random() * tracks.length); } while (next === current);
    } else if (mode === 'all' && tracks.length > 1) next = (current + 1) % tracks.length;
    selectTrack(next, true);
  });
  audio.addEventListener('error', () => {
    wantPlay = false; message = '音频无法解码，请在列表重试或换一首';
    ready = false; sync(); progress();
  });
  // Buffer the default file so seeking also works on Hexo's non-range preview server.
  // Local files remain object URLs on this page and are never uploaded.
  selectTrack(0, false);
}());
