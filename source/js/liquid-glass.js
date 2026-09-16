(function () {
  'use strict';

  var selector = [
    '#boki-theme-toggle',
    '#rightside #darkmode',
    '#console .darkmode_switchbutton',
    '#page-header #nav #nav-right .nav-button a',
    '#page-header #nav #nav-right #toggle-menu a',
    '#page-header #nav #nav-right #randomPost_button',
    '#bannerGroup a.categoryButton',
    '.motion-toggle',
    '.nav-pill a',
    '.github-pill',
    '.brand',
    '.category-strip > a',
    '.round-link',
    '.post-arrow',
    '.card-action b',
    '.latest-card',
    '.intro-card',
    '.explore-button',
    '.category-dock > a',
    '.post-card',
    '.music-widget'
  ].join(',');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function bind(control) {
    if (control.dataset.liquidGlassBound === 'true') return;
    control.classList.add('liquid-glass');
    control.dataset.liquidGlassBound = 'true';

    var canTilt = document.body.classList.contains('editorial-page') &&
      control.matches('.category-dock > a, .post-card, .explore-button');
    var pendingFrame = 0;
    var latestX = 50, latestY = 50;
    function reset() {
      cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      control.classList.remove('is-pressed');
      control.style.setProperty('--liquid-x', '50%');
      control.style.setProperty('--liquid-y', '50%');
      control.style.setProperty('--tilt-x', '0deg');
      control.style.setProperty('--tilt-y', '0deg');
    }

    control.addEventListener('pointermove', function (event) {
      if (reducedMotion.matches || !precisePointer.matches || event.pointerType === 'touch') return;
      var rect = control.getBoundingClientRect();
      latestX = Math.max(0, Math.min(100, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100));
      latestY = Math.max(0, Math.min(100, ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100));
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(function () {
        pendingFrame = 0;
        control.style.setProperty('--liquid-x', latestX + '%');
        control.style.setProperty('--liquid-y', latestY + '%');
        if (canTilt) {
          control.style.setProperty('--tilt-x', ((50 - latestY) * .09).toFixed(2) + 'deg');
          control.style.setProperty('--tilt-y', ((latestX - 50) * .09).toFixed(2) + 'deg');
        }
      });
    }, { passive: true });

    control.addEventListener('pointerdown', function () {
      control.classList.add('is-pressed');
    }, { passive: true });

    control.addEventListener('pointerup', function () {
      control.classList.remove('is-pressed');
    }, { passive: true });

    control.addEventListener('pointerleave', reset, { passive: true });
    control.addEventListener('pointercancel', reset, { passive: true });
    reducedMotion.addEventListener('change', reset);
  }

  function enhance() {
    document.querySelectorAll(selector).forEach(bind);
  }

  if (document.readyState !== 'loading') enhance();
  else document.addEventListener('DOMContentLoaded', enhance);
  document.addEventListener('pjax:complete', enhance);
  new MutationObserver(enhance).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-theme']
  });
}());
