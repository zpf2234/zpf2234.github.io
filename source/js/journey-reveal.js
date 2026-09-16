(function () {
  'use strict';
  const body = document.body;
  const hello = document.querySelector('.studio-word');
  const back = document.querySelector('.return-to-glass');
  const hero = document.querySelector('.hero-scene');
  if (!hello || !back || !hero) return;
  const layers = Array.from(document.querySelectorAll('.masthead, .scene-nav, .studio-word-wrap, .studio-float, .hero-heading, .motion-toggle, main > section'));
  const priorInert = new Map();
  let revealed = false;
  let previousScroll = 0;
  function setRevealed(next) {
    if (revealed === next) return;
    revealed = next;
    if (next) {
      previousScroll = window.scrollY;
      // Keyboard activation may have scrolled the word into view. Keep the
      // reveal aligned with the viewport, without entering browser fullscreen.
      window.scrollTo({top:0,behavior:'instant'});
      layers.forEach(layer => { priorInert.set(layer, layer.inert); layer.inert = true; });
      back.hidden = false;
    } else {
      layers.forEach(layer => { layer.inert = priorInert.get(layer) || false; });
      priorInert.clear();
    }
    body.classList.toggle('art-revealed', next);
    hero.querySelector('.orihime-scene')?.setAttribute('aria-hidden', String(!next));
    hello.setAttribute('aria-expanded', String(next));
    document.dispatchEvent(new CustomEvent('journey:reveal', {detail:next}));
    if (next) back.focus({preventScroll:true});
    else {
      back.hidden = true;
      window.scrollTo({top:previousScroll,behavior:'instant'});
      hello.focus({preventScroll:true});
    }
  }
  hello.addEventListener('click', () => setRevealed(true));
  back.addEventListener('click', () => setRevealed(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && revealed) { event.preventDefault(); setRevealed(false); }
  });
  // A direct fragment navigation must not leave the rest of the site inert.
  window.addEventListener('hashchange', () => { if (revealed) setRevealed(false); });
}());
