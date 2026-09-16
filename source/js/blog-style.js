(function () {
  'use strict';
  if (window.__bokiStyleMode) return;
  window.__bokiStyleMode = true;
  const root = document.documentElement;
  const key = 'boki-blog-style';
  let mode = 'journal', request = 0, artwork, transitionTimer = 0;
  try { if (localStorage.getItem(key) === 'anime') mode = 'anime'; } catch (_) {}
  root.dataset.blogStyle = mode;

  function loadArtwork() {
    if (!artwork) artwork = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => { artwork = null; reject(new Error('Artwork unavailable')); };
      image.src = '/img/orihime-main.jpg';
    });
    return artwork;
  }
  function controls() {
    const button = document.querySelector('.blog-style-toggle');
    if (!button) return;
    const anime = mode === 'anime';
    button.setAttribute('aria-pressed', String(anime));
    button.setAttribute('aria-label', anime ? '切换为手账风格' : '切换为二次元风格');
    button.title = anime ? '回到清新手账风格' : '换成井上织姬背景';
    button.querySelector('.style-toggle-label').textContent = anime ? '手账' : '二次元';
  }
  function beginTransition(button) {
    window.clearTimeout?.(transitionTimer);
    root.classList?.add('style-switching');
    const burst = document.createElement('span');
    burst.className = 'magic-burst';
    burst.setAttribute('aria-hidden', 'true');
    const rect = button?.getBoundingClientRect?.();
    if (rect && burst.style) {
      burst.style.left = (rect.left + rect.width / 2) + 'px';
      burst.style.top = (rect.top + rect.height / 2) + 'px';
    }
    document.body?.append?.(burst);
    if (window.setTimeout) window.setTimeout(() => burst.remove?.(), 1120);
  }
  function endTransition(version) {
    if (version !== request) return;
    window.clearTimeout?.(transitionTimer);
    transitionTimer = window.setTimeout ? window.setTimeout(() => {
      if (version === request) root.classList?.remove('style-switching');
    }, 760) : 0;
  }
  async function apply(next, save) {
    const version = ++request;
    const target = next === 'anime' ? 'anime' : 'journal';
    const button = document.querySelector('.blog-style-toggle');
    if (save) beginTransition(button);
    mode = target;
    root.dataset.blogStyle = mode;
    if (mode === 'anime') delete root.dataset.animeReady;
    else delete root.dataset.animeReady;
    controls();
    const status = document.querySelector('.blog-style-status');
    if (status) status.textContent = '';
    if (save) { try { localStorage.setItem(key, mode); } catch (_) {} }
    if (target === 'anime') {
      button?.setAttribute('aria-busy', 'true');
      try { await loadArtwork(); }
      catch (_) {
        if (version === request) {
          mode = 'journal';
          root.dataset.blogStyle = 'journal';
          delete root.dataset.animeReady;
          controls();
          try { localStorage.setItem(key, 'journal'); } catch (_) {}
          const status = document.querySelector('.blog-style-status');
          if (status) status.textContent = '背景暂时加载失败，请再试一次。';
          button?.removeAttribute('aria-busy');
          endTransition(version);
        }
        return;
      }
      if (version !== request) return;
    }
    if (mode === 'anime') root.dataset.animeReady = 'true';
    button?.removeAttribute('aria-busy');
    endTransition(version);
  }
  function mount() {
    if (!document.querySelector('.anime-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'anime-backdrop'; backdrop.setAttribute('aria-hidden', 'true');
      document.body.prepend(backdrop);
    }
    if (!document.querySelector('.blog-style-toggle')) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'blog-style-toggle';
      button.innerHTML = '<svg aria-hidden="true" class="style-toggle-icon" viewBox="0 0 24 24"><path d="m13 2 1.45 5.55L20 9l-5.55 1.45L13 16l-1.45-5.55L6 9l5.55-1.45L13 2Zm6 11 0.72 2.28L22 16l-2.28.72L19 19l-.72-2.28L16 16l2.28-.72L19 13ZM5 15l.82 2.18L8 18l-2.18.82L5 21l-.82-2.18L2 18l2.18-.82L5 15ZM8 22l3.4-3.4" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/><span class="style-toggle-label">二次元</span>';
      button.addEventListener('click', () => apply(mode === 'anime' ? 'journal' : 'anime', true));
      document.body.append(button);
      const status = document.createElement('span');
      status.className = 'blog-style-status'; status.setAttribute('role', 'status');
      document.body.append(status);
    }
    apply(mode, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
  document.addEventListener('pjax:complete', mount);
  window.addEventListener('storage', event => { if (event.key === key) apply(event.newValue, false); });
}());
