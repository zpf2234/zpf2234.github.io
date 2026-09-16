/* No wheel interception: anchors, touch, keyboard and browser history stay native. */
(function () {
  'use strict';
  const body = document.body;
  const motionButton = document.querySelector('.motion-toggle');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;
  try { manuallyPaused = localStorage.getItem('boki-journey-paused') === 'true'; } catch (_) {}
  function syncMotion() {
    const paused = manuallyPaused || motionQuery.matches;
    body.classList.toggle('motion-paused', paused);
    motionButton.hidden = false;
    motionButton.disabled = motionQuery.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    const label = motionQuery.matches ? '已跟随系统减少动态效果' : paused ? '开启动效' : '暂停动效';
    motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span>' : '<span aria-hidden="true">Ⅱ</span>';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
  }
  if (motionButton) {
    syncMotion();
    motionButton.addEventListener('click', function () {
      manuallyPaused = !manuallyPaused;
      try { localStorage.setItem('boki-journey-paused', String(manuallyPaused)); } catch (_) {}
      syncMotion();
    });
    motionQuery.addEventListener('change', syncMotion);
  }
  const scenes = Array.from(document.querySelectorAll('[data-scene]'));
  const navLinks = Array.from(document.querySelectorAll('.scene-nav a, .nav-pill a'));
  let queued = false;
  function updateScroll() {
    queued = false;
    const anchor = window.innerHeight * .4;
    let current = scenes[0];
    for (const scene of scenes) {
      if (scene.getBoundingClientRect().top <= anchor) current = scene;
    }
    navLinks.forEach(link => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const track = document.querySelector('.hero-track');
    if (track) {
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) || 104;
      const range = Math.max(1, track.offsetHeight - window.innerHeight + top);
      const progress = Math.max(0, Math.min(1, (top - track.getBoundingClientRect().top) / range));
      body.style.setProperty('--film-progress', progress.toFixed(4));
      window.dispatchEvent(new CustomEvent('journey:scroll', { detail: progress }));
    }
  }
  function queueScroll() {
    if (!queued) { queued = true; window.requestAnimationFrame(updateScroll); }
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  window.addEventListener('pageshow', queueScroll);
  if (motionButton) motionButton.addEventListener('click', queueScroll);
  motionQuery.addEventListener('change', queueScroll);
  updateScroll();
  if ('IntersectionObserver' in window && !motionQuery.matches) {
    body.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('is-pending');
        observer.observe(element);
      }
    });
    // Never leave keyboard-focused content visually hidden.
    document.addEventListener('focusin', event => {
      const hidden = event.target.closest('.is-pending');
      if (hidden) { hidden.classList.remove('is-pending'); observer.unobserve(hidden); }
    });
  }
}());
