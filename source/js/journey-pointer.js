(function () {
  'use strict';
  const body = document.body;
  const hero = document.querySelector('.hero-scene');
  const canvas = document.querySelector('.hero-motes');
  if (!hero || !canvas) return;
  const context = canvas.getContext('2d');
  const frames = Array.from(hero.querySelectorAll('.hero-frame'));
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = hero.querySelector('.motion-toggle');
  const video = hero.querySelector('.hero-video');
  const masthead = document.querySelector('.masthead');
  let width = 1, height = 1, dpr = 1;
  let aimX = 0, aimY = 0, currentX = 0, currentY = 0;
  let heroVisible = true, frameId = 0, previousTime = 0, elapsed = 0;
  let scrollTarget = parseFloat(body.style.getPropertyValue('--film-progress')) || 0, scrollCurrent = scrollTarget;
  let chromeTimer = 0, lastChromeClick = 0;
  const motes = Array.from({ length: 36 }, (_, index) => ({
    x: ((index * 37.37) % 100) / 100,
    y: ((index * 19.13) % 100) / 100,
    size: .8 + (index % 4) * .55,
    phase: index * 1.31,
    speed: 6 + index % 7
  }));
  function resizeCanvas() {
    width = hero.clientWidth; height = hero.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function canAnimate() {
    return heroVisible && !document.hidden && !motionQuery.matches;
  }
  function applyPointer(x, y) {
    hero.style.setProperty('--pointer-x', x.toFixed(4));
    hero.style.setProperty('--pointer-y', y.toFixed(4));
    hero.style.setProperty('--light-x', (50 + x * 38).toFixed(2) + '%');
    hero.style.setProperty('--light-y', (50 + y * 38).toFixed(2) + '%');
  }
  function paintFilm(time) {
    if (frames.length < 2 || video?.dataset.playing === 'true') return;
    // Six seconds per shot, with an eased 1.6-second dissolve. Scroll scrubs
    // further through the sequence while an idle page continues to breathe.
    const shot = Math.floor(time / 6) % frames.length;
    const next = (shot + 1) % frames.length;
    const progress = Math.max(0, Math.min(1, ((time % 6) - 4.4) / 1.6));
    const mix = progress * progress * (3 - 2 * progress);
    frames.forEach((frame, index) => {
      let opacity = 0;
      if (index === shot) opacity = next > shot ? 1 : 1 - mix;
      if (index === next && mix > 0) opacity = next > shot ? mix : 1;
      frame.style.opacity = opacity.toFixed(3);
      frame.style.setProperty('--frame-opacity', opacity.toFixed(3));
    });
    hero.style.setProperty('--shot-progress', ((time % (6 * frames.length)) / (6 * frames.length)).toFixed(4));
  }
  function animate(now) {
    frameId = 0;
    if (!canAnimate()) return;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, .05) : 1 / 60;
    const filmPaused = body.classList.contains('motion-paused');
    previousTime = now;
    if (!filmPaused && body.classList.contains('art-revealed')) elapsed += dt;
    const easing = 1 - Math.exp(-7 * dt);
    currentX += (aimX - currentX) * easing; currentY += (aimY - currentY) * easing;
    scrollCurrent += (scrollTarget - scrollCurrent) * easing;
    applyPointer(currentX, currentY);
    if (!filmPaused) paintFilm(elapsed);
    if (context && !filmPaused) {
      context.clearRect(0, 0, width, height); context.globalCompositeOperation = 'lighter';
      for (const mote of motes) {
        mote.y -= dt * mote.speed / height;
        if (mote.y < -.03) mote.y = 1.03;
        const x = mote.x * width + Math.sin(elapsed / 2.3 + mote.phase) * 20 - currentX * (12 + mote.size * 12);
        const y = mote.y * height - currentY * 22;
        const alpha = .23 + (Math.sin(elapsed / 1.6 + mote.phase) + 1) * .2;
        context.fillStyle = 'rgba(255,240,198,' + alpha.toFixed(3) + ')';
        context.shadowColor = '#fff3c6'; context.shadowBlur = 8;
        context.beginPath(); context.arc(x, y, mote.size, 0, Math.PI * 2); context.fill();
      }
    }
    if (!filmPaused || Math.abs(aimX - currentX) + Math.abs(aimY - currentY) > .001) {
      frameId = requestAnimationFrame(animate);
    }
  }
  function syncLoop() {
    if (canAnimate()) {
      previousTime = 0;
      if (!frameId) frameId = requestAnimationFrame(animate);
      if (video) {
        if (body.classList.contains('motion-paused')) video.pause();
        else video.play().catch(() => { video.dataset.playing = 'false'; });
      }
    } else {
      cancelAnimationFrame(frameId); frameId = 0;
      if (video) video.pause();
      if (body.classList.contains('motion-paused') || motionQuery.matches) {
        aimX = aimY = currentX = currentY = 0; applyPointer(0, 0);
        if (context) context.clearRect(0, 0, width, height);
      }
    }
  }
  function point(event) {
    if (!canAnimate() || event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    aimX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    aimY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    // Continue easing the pointer when the film is paused, then sleep once
    // settled; reduced-motion and offscreen pages never run this loop.
    hero.classList.add('pointer-engaged');
    if (!frameId) { previousTime = 0; frameId = requestAnimationFrame(animate); }
  }
  function recenter() {
    aimX = aimY = 0;
    hero.classList.remove('pointer-engaged');
    if (canAnimate() && !frameId) { previousTime = 0; frameId = requestAnimationFrame(animate); }
  }
  function setChromeVisible(visible) {
    if (!masthead) return;
    window.clearTimeout(chromeTimer);
    body.classList.toggle('chrome-hidden', !visible);
    masthead.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
  hero.addEventListener('pointermove', point, { passive: true });
  hero.addEventListener('pointerdown', point, { passive: true });
  hero.addEventListener('pointerleave', recenter, { passive: true });
  hero.addEventListener('pointercancel', recenter, { passive: true });
  hero.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') recenter(); }, { passive: true });
  hero.addEventListener('click', event => {
    if (body.classList.contains('art-revealed')) return;
    if (event.target.closest('a, button, input')) return;
    if (!motionQuery.matches) {
      const rect = hero.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'hero-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = event.clientX - rect.left + 'px';
      ripple.style.top = event.clientY - rect.top + 'px';
      // Bound transient nodes even during rapid clicks.
      if (hero.querySelectorAll('.hero-ripple').length >= 3) hero.querySelector('.hero-ripple').remove();
      hero.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1100);
    }
    const clickTime = performance.now();
    const isDoubleClick = clickTime - lastChromeClick < 360;
    lastChromeClick = clickTime;
    window.clearTimeout(chromeTimer);
    if (isDoubleClick) {
      lastChromeClick = 0;
      setChromeVisible(true);
    } else {
      // Delay the hide long enough to let a second click become a restore.
      chromeTimer = window.setTimeout(() => {
        lastChromeClick = 0;
        setChromeVisible(false);
      }, 260);
    }
    if (!canAnimate() || body.classList.contains('motion-paused') || frames.length < 2) return;
    // Move the film to the next dissolve window. The existing eased opacity
    // blend then carries the transition instead of hard-cutting the image.
    const now = elapsed + scrollCurrent * 10;
    const shotStart = Math.floor(now / 6) * 6;
    const fadeStart = shotStart + 4.4;
    elapsed = Math.max(now, fadeStart) - scrollCurrent * 10;
  });
  hero.addEventListener('dblclick', event => {
    if (body.classList.contains('art-revealed')) return;
    if (event.target.closest('a, button, input')) return;
    window.clearTimeout(chromeTimer);
    setChromeVisible(true);
  });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('journey:reveal', event => {
    if (event.detail) { elapsed = 0; paintFilm(0); }
    syncLoop();
  });
  window.addEventListener('journey:scroll', event => { scrollTarget = event.detail; });
  document.addEventListener('visibilitychange', syncLoop);
  motionQuery.addEventListener('change', syncLoop);
  motionButton?.addEventListener('click', syncLoop);
  if (video) {
    video.addEventListener('playing', () => { video.dataset.playing = 'true'; });
    video.addEventListener('error', () => { video.dataset.playing = 'false'; video.hidden = true; });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting; syncLoop();
    }, { threshold: 0 }).observe(hero);
  }
  resizeCanvas(); syncLoop();
}());
