(function () {
  'use strict';
  const hero = document.querySelector('.hero-scene');
  const hello = document.querySelector('.studio-word');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !hello) return;
  let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0;
  function tick() {
    frame = 0;
    x += (targetX - x) * .09; y += (targetY - y) * .09;
    hero.style.setProperty('--pointer-x', x.toFixed(4));
    hero.style.setProperty('--pointer-y', y.toFixed(4));
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .001) frame = requestAnimationFrame(tick);
  }
  function move(event) {
    if (reduced.matches || event.pointerType === 'touch' || document.body.classList.contains('motion-paused')) return;
    const rect = hero.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame); frame = 0;
    x = y = targetX = targetY = 0;
    hero.style.setProperty('--pointer-x', '0'); hero.style.setProperty('--pointer-y', '0');
  }
  hero.addEventListener('pointermove', move, {passive:true});
  hero.addEventListener('pointerleave', () => { targetX = targetY = 0; if (!frame && !reduced.matches) frame = requestAnimationFrame(tick); });
  document.querySelector('.motion-toggle')?.addEventListener('click', reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  hello.addEventListener('click', (event) => {
    const rect = hero.getBoundingClientRect(), word = hello.getBoundingClientRect();
    const px = event.detail ? event.clientX - rect.left : word.left - rect.left + word.width / 2;
    const py = event.detail ? event.clientY - rect.top : word.top - rect.top + word.height / 2;
    hero.style.setProperty('--reveal-x', Math.max(0,Math.min(100,px / rect.width * 100)) + '%');
    hero.style.setProperty('--reveal-y', Math.max(0,Math.min(100,(py + 108) / (rect.height + 108) * 100)) + '%');
    // The light scene belongs to the opening only; don't tint the rest of the page.
    const dusk = hero.classList.toggle('is-dusk');
    hello.setAttribute('aria-pressed', String(dusk));
    hello.setAttribute('aria-label', dusk ? '切换为晨光氛围' : '切换为暮色氛围');
    const ambienceLabel = document.getElementById('ambience-label');
    if (ambienceLabel) ambienceLabel.textContent = dusk ? '把片刻，留给温柔的暮色。' : '一束光，一点好奇。';
    document.querySelector('meta[name="theme-color"]').content = dusk ? '#172943' : '#eef1e9';
    hero.dispatchEvent(new CustomEvent('journal:lightchange', {detail:{x:px,y:py,dusk}}));
  });
}());
