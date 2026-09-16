'use strict';

// The editorial front page is independent of the reading theme. Hexo still
// generates every post, taxonomy page and the paginated /notes/ index.
const path = require('node:path');

hexo.extend.generator.register('journey-home', function (locals) {
  const posts = locals.posts.sort('-date').toArray().filter(post => post.published !== false);
  const categories = locals.categories.toArray().filter(category => category.length > 0);
  const template = path.join(hexo.base_dir, 'templates/journey.ejs');
  const artwork = '/img/journal-cover.svg';
  const html = hexo.render.renderSync({ path: template }, {
    blog: hexo.config,
    posts: posts.slice(0, 4),
    latest: posts[0],
    categories,
    artwork,
    count: posts.length,
    year: new Date().getFullYear(),
    postUrl: post => '/' + post.path.replace(/^\//, ''),
    dateLabel: post => post.date.format('YYYY.MM.DD')
  });
  return { path: 'index.html', data: html };
});
