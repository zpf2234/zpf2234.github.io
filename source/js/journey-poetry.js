(function () {
  'use strict';
  const hero = document.querySelector('.hero-scene');
  const layer = document.querySelector('.poem-scene');
  if (!hero || !layer) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let memory = null;
  let lastRecall = -Infinity;
  function sync() {
    const resting = !visible || document.hidden || document.body.classList.contains('motion-paused') || document.body.classList.contains('art-revealed') || reduce.matches;
    layer.classList.toggle('is-resting', resting);
    if (resting && memory) { memory.cancel(); memory = null; }
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, {threshold:0}).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  document.addEventListener('journey:reveal', sync);
  document.querySelector('.motion-toggle')?.addEventListener('click', sync);
  hero.addEventListener('click', event => {
    if (layer.classList.contains('is-resting') || event.target.closest('a, button, input')) return;
    if (performance.now() - lastRecall < 2000) return;
    lastRecall = performance.now();
    memory?.cancel();
    // A slow recall, not a strobe. The child text stays at low opacity.
    memory = layer.animate([{opacity:1},{opacity:.3,offset:.25},{opacity:1,offset:.8},{opacity:1}], {duration:1800,easing:'ease-in-out'});
    memory.onfinish = () => { memory = null; };
  });
  sync();
}());
