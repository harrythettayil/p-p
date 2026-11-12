// Shared helpers for blog pages: Supabase client, sign-in state in the nav, small DOM utilities.
// The header and footer themselves live in ../layout.js.
(function () {
  var cfg = window.BLOG_CONFIG || {};
  var configured = !!(cfg.url && cfg.anonKey && cfg.url.indexOf('YOUR_') < 0 && cfg.anonKey.indexOf('YOUR_') < 0);
  var sb = configured && window.supabase ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  // Create an element. Text is always set with textContent, so user content can never inject HTML.
  function el(tag, opts, children) {
    var n = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) n.className = opts.cls;
    if (opts.text != null) n.textContent = opts.text;
    if (opts.href) n.href = opts.href;
    if (opts.attrs) Object.keys(opts.attrs).forEach(function (k) { n.setAttribute(k, opts.attrs[k]); });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function fmtDate(iso) {
    return iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  }

  // Render plain text as paragraphs (blank line = new paragraph).
  function renderBody(container, text) {
    container.textContent = '';
    String(text).split(/\n{2,}/).forEach(function (para) {
      if (para.trim()) container.appendChild(el('p', { text: para.trim() }));
    });
  }

  function slugify(s) {
    return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 80) || 'post';
  }

  function notConfigured(box) {
    box.textContent = '';
    box.appendChild(el('p', { cls: 'notice', text: 'The blog is not connected yet. Add your Supabase URL and anon key in blog/config.js.' }));
  }

  function message(node, text, kind) {
    node.textContent = text;
    node.className = 'form-msg ' + (kind || '');
  }

  async function getUser() {
    if (!sb) return { user: null, profile: null };
    var res = await sb.auth.getSession();
    var user = res.data.session ? res.data.session.user : null;
    var profile = null;
    if (user) {
      var p = await sb.from('profiles').select('display_name,is_admin').eq('id', user.id).maybeSingle();
      profile = p.data;
    }
    return { user: user, profile: profile };
  }

  async function mountChrome() {
    var ctx = await getUser();
    var slot = document.getElementById('auth-item');
    if (slot) {
      if (ctx.user) {
        if (ctx.profile && ctx.profile.is_admin) {
          // Admins see "Admin" in place of "Contact".
          var contact = document.querySelector('#nav-menu a[href$="#contact"]');
          if (contact) { contact.textContent = 'Admin'; contact.href = 'admin.html'; }
        }
        var out = el('a', { text: 'Sign out', href: '#' });
        out.addEventListener('click', async function (e) {
          e.preventDefault();
          await sb.auth.signOut();
          location.href = 'index.html';
        });
        slot.appendChild(out);
      } else {
        slot.appendChild(el('a', { text: 'Sign in', href: 'login.html' }));
      }
    }
    return ctx;
  }

  window.App = {
    sb: sb, configured: configured, el: el, fmtDate: fmtDate, renderBody: renderBody,
    slugify: slugify, notConfigured: notConfigured, message: message, getUser: getUser,
    init: mountChrome
  };
})();
