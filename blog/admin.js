(async function () {
  var ctx = await App.init();
  var root = document.getElementById('admin-root');
  if (!App.sb) return App.notConfigured(root);
  if (!ctx.user) { location.href = 'login.html'; return; }
  if (!ctx.profile || !ctx.profile.is_admin) { root.textContent = 'You do not have access to this page.'; return; }

  async function setStatus(id, status) {
    var patch = { status: status };
    if (status === 'published') patch.published_at = new Date().toISOString();
    await App.sb.from('posts').update(patch).eq('id', id);
    render();
  }
  async function removePost(p) {
    if (!confirm('Permanently delete "' + p.title + '" and its comments?')) return;
    await App.sb.from('posts').delete().eq('id', p.id);
    render();
  }
  function btn(text, cls, fn) {
    var b = App.el('button', { cls: 'btn small ' + cls, text: text, attrs: { type: 'button' } });
    b.addEventListener('click', fn);
    return b;
  }

  function postRow(p) {
    var by = p.profiles ? p.profiles.display_name : 'Unknown';
    var actions = App.el('div', { cls: 'actions' });
    if (p.status !== 'published') actions.appendChild(btn('Approve', '', function () { setStatus(p.id, 'published'); }));
    if (p.status === 'pending') actions.appendChild(btn('Reject', 'ghost', function () { setStatus(p.id, 'rejected'); }));
    if (p.status === 'published') actions.appendChild(btn('Unpublish', 'ghost', function () { setStatus(p.id, 'pending'); }));
    actions.appendChild(btn('Delete', 'danger', function () { removePost(p); }));

    var full = App.el('div', {});
    App.renderBody(full, p.body);
    return App.el('div', { cls: 'row' }, [
      App.el('div', {}, [
        App.el('strong', { text: p.title }), document.createTextNode(' '),
        App.el('span', { cls: 'pill ' + p.status, text: p.status }),
        App.el('div', { cls: 'meta', text: by + ' · ' + App.fmtDate(p.created_at) })
      ]),
      actions,
      App.el('details', { cls: 'preview' }, [App.el('summary', { text: 'Read post' }), full])
    ]);
  }

  async function render() {
    root.textContent = '';
    var posts = await App.sb.from('posts').select('id,title,body,status,created_at,profiles(display_name)')
      .order('created_at', { ascending: false });
    var all = posts.data || [];

    [['pending', 'Waiting for approval'], ['published', 'Published'], ['rejected', 'Rejected']].forEach(function (g) {
      var items = all.filter(function (p) { return p.status === g[0]; });
      root.appendChild(App.el('h3', { cls: 'admin-h', text: g[1] + ' (' + items.length + ')' }));
      if (!items.length) root.appendChild(App.el('p', { cls: 'meta', text: 'Nothing here.' }));
      items.forEach(function (p) { root.appendChild(postRow(p)); });
    });

    root.appendChild(App.el('h3', { cls: 'admin-h', text: 'Recent comments' }));
    var cs = await App.sb.from('comments').select('id,name,body,created_at,posts(title)')
      .order('created_at', { ascending: false }).limit(50);
    if (!cs.data || !cs.data.length) root.appendChild(App.el('p', { cls: 'meta', text: 'No comments yet.' }));
    (cs.data || []).forEach(function (c) {
      root.appendChild(App.el('div', { cls: 'row' }, [
        App.el('div', {}, [
          App.el('strong', { text: c.name }),
          App.el('span', { cls: 'meta', text: ' on "' + (c.posts ? c.posts.title : '') + '" · ' + App.fmtDate(c.created_at) }),
          App.el('p', { text: c.body })
        ]),
        App.el('div', { cls: 'actions' }, [btn('Delete', 'danger', async function () {
          await App.sb.from('comments').delete().eq('id', c.id);
          render();
        })])
      ]));
    });
  }

  render();
})();
