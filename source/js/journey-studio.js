(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();
  function cancelAll() {
    active.forEach(animation => animation.cancel());
    active.clear();
  }
  document.querySelectorAll('[data-studio-toy]').forEach(button => {
    const visual = button.querySelector('svg');
    button.addEventListener('click', () => {
      if (reduced.matches) return;
      active.get(button)?.cancel();
      const word = button.classList.contains('studio-word');
      const animation = visual.animate(word ? [
        { transform: 'translateY(0) rotate(-3deg) scale(1)' },
        { transform: 'translateY(-13px) rotate(4deg) scale(1.035)', offset: .28 },
        { transform: 'translateY(3px) rotate(-5deg) scale(.985)', offset: .65 },
        { transform: 'translateY(0) rotate(-3deg) scale(1)' }
      ] : [
        { transform: 'rotate(-3deg) scale(1)' },
        { transform: 'rotate(170deg) scale(1.17)', offset: .48 },
        { transform: 'rotate(357deg) scale(1)' }
      ], { duration: word ? 1100 : 850, easing: 'cubic-bezier(.22,.7,.3,1)' });
      active.set(button, animation);
      animation.onfinish = () => active.delete(button);
    });
  });
  reduced.addEventListener('change', cancelAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAll(); });
}());
