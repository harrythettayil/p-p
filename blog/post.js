(async function () {
  var ctx = await App.init();
  var art = document.getElementById('article');
  if (!App.sb) return App.notConfigured(art);

  var slug = new URLSearchParams(location.search).get('slug');
  if (!slug) { art.textContent = 'Post not found.'; return; }

  var res = await App.sb.from('posts')
    .select('id,title,body,published_at,profiles(display_name)')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  if (res.error || !res.data) { art.textContent = 'Post not found.'; return; }

  var post = res.data;
  document.title = post.title + ' | Posies & Petals';
  var body = App.el('div', { cls: 'post-body' });
  App.renderBody(body, post.body);
  art.textContent = '';
  art.appendChild(App.el('h1', { text: post.title }));
  art.appendChild(App.el('p', { cls: 'meta', text: (post.profiles ? post.profiles.display_name : 'Guest') + ' · ' + App.fmtDate(post.published_at) }));
  art.appendChild(body);
  art.appendChild(App.el('p', {}, [App.el('a', { cls: 'read-more', text: '← All posts', href: 'index.html' })]));

  var section = document.getElementById('comments');
  section.hidden = false;
  var list = document.getElementById('comment-list');
  var isAdmin = !!(ctx.profile && ctx.profile.is_admin);

  function addComment(c) {
    var children = [
      App.el('span', { cls: 'who', text: c.name }),
      App.el('span', { cls: 'meta', text: ' · ' + App.fmtDate(c.created_at) }),
      App.el('p', { text: c.body })
    ];
    var wrap = App.el('div', { cls: 'comment' }, children);
    if (isAdmin && c.id) {
      var del = App.el('button', { cls: 'btn small danger', text: 'Delete', attrs: { type: 'button' } });
      del.addEventListener('click', async function () {
        if (!confirm('Delete this comment?')) return;
        var r = await App.sb.from('comments').delete().eq('id', c.id);
        if (!r.error) wrap.remove();
      });
      wrap.appendChild(del);
    }
    list.appendChild(wrap);
  }

  var cs = await App.sb.from('comments').select('id,name,body,created_at')
    .eq('post_id', post.id).order('created_at', { ascending: true });
  if (cs.data) cs.data.forEach(addComment);
  if (!list.children.length) list.appendChild(App.el('p', { cls: 'meta', text: 'No comments yet. Start the conversation!' }));

  var form = document.getElementById('commentForm');
  var msg = document.getElementById('cmsg');
  var COOLDOWN_MS = 30000;
  if (ctx.profile) document.getElementById('cname').value = ctx.profile.display_name;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (document.getElementById('cweb').value) { form.reset(); return; } // honeypot: bots only

    var last = 0;
    try { last = +localStorage.getItem('lastComment') || 0; } catch (_) {}
    if (Date.now() - last < COOLDOWN_MS) { App.message(msg, 'Please wait a few seconds before commenting again.', 'error'); return; }

    var btn = form.querySelector('button');
    btn.disabled = true;
    var c = { post_id: post.id, name: document.getElementById('cname').value.trim(), body: document.getElementById('cbody').value.trim() };
    var r = await App.sb.from('comments').insert(c);
    btn.disabled = false;
    if (r.error) { App.message(msg, 'Could not post your comment. Please try again.', 'error'); return; }

    try { localStorage.setItem('lastComment', String(Date.now())); } catch (_) {}
    var empty = list.querySelector('.meta:only-child'); if (empty) empty.remove();
    addComment({ name: c.name, body: c.body, created_at: new Date().toISOString() });
    document.getElementById('cbody').value = '';
    App.message(msg, 'Thanks for your comment!', 'ok');
  });
})();
