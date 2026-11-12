(async function () {
  await App.init();
  var box = document.getElementById('posts');
  if (!App.sb) return App.notConfigured(box);

  var res = await App.sb.from('posts')
    .select('title,slug,excerpt,published_at,profiles(display_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  box.textContent = '';
  if (res.error) { box.appendChild(App.el('p', { cls: 'notice', text: 'Could not load posts. Please try again later.' })); return; }
  if (!res.data.length) { box.appendChild(App.el('p', { cls: 'notice', text: 'No posts yet. Be the first to write one!' })); return; }

  res.data.forEach(function (p) {
    var url = 'post.html?slug=' + encodeURIComponent(p.slug);
    var by = p.profiles ? p.profiles.display_name : 'Guest';
    box.appendChild(App.el('div', { cls: 'card post-card' }, [
      App.el('h3', {}, [App.el('a', { cls: 'title', text: p.title, href: url })]),
      App.el('p', { cls: 'meta', text: by + ' · ' + App.fmtDate(p.published_at) }),
      p.excerpt ? App.el('p', { text: p.excerpt }) : null,
      App.el('a', { cls: 'read-more', text: 'Read more →', href: url })
    ]));
  });
})();
