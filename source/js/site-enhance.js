(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function enhance() {
    document.querySelectorAll('img').forEach(function (img) {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.getAttribute('alt')) img.setAttribute('alt', 'boki 的技术站配图');
    });

    decorateBrand();
    decorateHomeEntries();

    if (!document.getElementById('boki-theme-toggle')) {
      var navRight = document.getElementById('nav-right');
      var searchButton = document.getElementById('search-button');

      if (navRight) {
        var wrap = document.createElement('div');
        var button = document.createElement('button');
        wrap.id = 'boki-theme-toggle-wrap';
        wrap.className = 'nav-button';
        button.id = 'boki-theme-toggle';
        button.type = 'button';
        button.title = '切换白天和夜间模式';
        button.addEventListener('click', function () {
          var originalToggle = document.getElementById('darkmode');
          if (originalToggle) originalToggle.click();
        });
        wrap.appendChild(button);
        navRight.insertBefore(wrap, searchButton || navRight.firstChild);
      }
    }

    document.querySelectorAll('.darkmode_switchbutton, #darkmode, #boki-theme-toggle').forEach(function (control) {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      control.setAttribute('aria-label', isDark ? '切换到白天模式' : '切换到夜间模式');
    });
  }

  function decorateBrand() {
    document.querySelectorAll('#site-title, #nav #site-name .title, .banners-title .banners-title-big:first-child').forEach(function (brand) {
      if (brand.dataset.brandDecorated === 'true') return;
      var label = brand.textContent.trim();
      if (label.indexOf('boki') !== 0) return;
      brand.textContent = '';
      var mark = document.createElement('span');
      var cn = document.createElement('span');
      mark.className = 'boki-brand-mark';
      cn.className = 'boki-brand-cn';
      mark.textContent = 'boki';
      cn.textContent = label.slice(4);
      brand.appendChild(mark);
      brand.appendChild(cn);
      brand.dataset.brandDecorated = 'true';
    });
  }

  function decorateHomeEntries() {
    var group = document.querySelector('#bannerGroup .categoryGroup');
    if (!group || group.dataset.entriesDecorated === 'true') return;

    var categoryDescriptions = ['代码、建站与工具', '留下最近的想法', '看番、音乐和零碎兴趣'];
    group.querySelectorAll('.categoryItem').forEach(function (item, index) {
      var label = item.querySelector('.categoryButtonText');
      var button = item.querySelector('.categoryButton');
      if (!label || !button) return;
      label.setAttribute('data-entry-label', label.textContent.trim());
      var sub = document.createElement('span');
      sub.className = 'categoryButtonSub';
      sub.textContent = categoryDescriptions[index] || '';
      button.appendChild(sub);
      item.classList.add('home-primary-entry');
    });

    var links = [
      { href: 'https://github.com/zpf2234', title: 'GitHub 主页', desc: '源码与项目', icon: 'anzhiyu-icon-github' },
      { href: '/link/', title: '友链', desc: '认识一些好站', icon: 'anzhiyu-icon-link' }
    ];

    links.forEach(function (entry) {
      var item = document.createElement('div');
      var link = document.createElement('a');
      var title = document.createElement('span');
      var desc = document.createElement('span');
      var icon = document.createElement('i');
      item.className = 'categoryItem home-secondary-entry';
      link.className = 'categoryButton secondary';
      link.href = entry.href;
      if (entry.href.indexOf('http') === 0) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      title.className = 'categoryButtonText';
      title.textContent = entry.title;
      desc.className = 'categoryButtonSub';
      desc.textContent = entry.desc;
      icon.className = 'anzhiyufont ' + entry.icon;
      link.appendChild(title);
      link.appendChild(desc);
      link.appendChild(icon);
      item.appendChild(link);
      group.appendChild(item);
    });

    group.dataset.entriesDecorated = 'true';
  }

  ready(enhance);
  document.addEventListener('pjax:complete', enhance);
  new MutationObserver(enhance).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}());
