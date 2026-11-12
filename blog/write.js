(async function () {
  var ctx = await App.init();
  var msg = document.getElementById('pmsg');
  var mine = document.getElementById('mine');
  if (!App.sb) return App.message(msg, 'The blog is not connected yet. Add your Supabase keys in blog/config.js.', 'error');
  if (!ctx.user) { location.href = 'login.html'; return; }

  var body = document.getElementById('body');
  var count = document.getElementById('count');
  body.addEventListener('input', function () { count.textContent = body.value.length + ' / 20000'; });

  async function loadMine() {
    var r = await App.sb.from('posts').select('id,title,slug,status,created_at')
      .eq('author_id', ctx.user.id).order('created_at', { ascending: false });
    mine.textContent = '';
    if (r.error) { mine.appendChild(App.el('p', { text: 'Could not load your posts.' })); return; }
    if (!r.data.length) { mine.appendChild(App.el('p', { cls: 'meta', text: 'You have not written anything yet.' })); return; }

    r.data.forEach(function (p) {
      var actions = App.el('div', { cls: 'actions' });
      if (p.status === 'published') {
        actions.appendChild(App.el('a', { cls: 'btn small ghost', text: 'View', href: 'post.html?slug=' + encodeURIComponent(p.slug) }));
      }
      var del = App.el('button', { cls: 'btn small danger', text: 'Delete', attrs: { type: 'button' } });
      del.addEventListener('click', async function () {
        if (!confirm('Delete "' + p.title + '"?')) return;
        var d = await App.sb.from('posts').delete().eq('id', p.id);
        if (!d.error) loadMine();
      });
      actions.appendChild(del);
      mine.appendChild(App.el('div', { cls: 'row' }, [
        App.el('div', {}, [
          App.el('strong', { text: p.title }), document.createTextNode(' '),
          App.el('span', { cls: 'pill ' + p.status, text: p.status }),
          App.el('div', { cls: 'meta', text: App.fmtDate(p.created_at) })
        ]),
        actions
      ]));
    });
  }

  document.getElementById('postForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var form = e.target, btn = form.querySelector('button');
    var title = document.getElementById('title').value.trim();
    btn.disabled = true;
    var r = await App.sb.from('posts').insert({
      author_id: ctx.user.id,
      title: title,
      slug: App.slugify(title) + '-' + Math.random().toString(36).slice(2, 6),
      excerpt: document.getElementById('excerpt').value.trim(),
      body: body.value.trim()
    });
    btn.disabled = false;
    if (r.error) { App.message(msg, 'Could not submit your post. Titles need 3+ characters and posts 20+.', 'error'); return; }
    form.reset(); count.textContent = '0 / 20000';
    App.message(msg, 'Thank you! Your post was submitted and will appear once approved.', 'ok');
    loadMine();
  });

  loadMine();
})();
