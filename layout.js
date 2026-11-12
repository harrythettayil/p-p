// Shared site header + footer. Edit the links or text HERE and every page updates.
//
// Usage on any page:
//   <div id="site-header" data-root=""></div>        (home page, files in the project root)
//   <div id="site-header" data-root="../" data-auth></div>   (pages inside /blog; data-auth adds the sign-in slot)
//   <div id="site-footer" data-root=""></div>
//   <script src="layout.js"></script>                (or ../layout.js)
(function () {
  var COMPANY = 'Posies &amp; Petals';
  var LOGO = 'assets/posies_petals_logo.png';
  var NAV = [
    { label: 'Agriculture',       href: 'index.html#agriculture' },
    // { label: 'Trading',           href: 'index.html#trading' },
    // { label: 'Preserved Flowers', href: 'index.html#flowers' },
    { label: 'Blog',              href: 'blog/index.html', section: '/blog/' },
    { label: 'Contact',           href: 'index.html#contact' }
  ];

  function headerHTML(root, withAuth) {
    var links = NAV.map(function (n) {
      var current = n.section && location.pathname.indexOf(n.section) !== -1 ? ' aria-current="page"' : '';
      return '<li><a href="' + root + n.href + '"' + current + '>' + n.label + '</a></li>';
    }).join('');
    return '<header><div class="wrap"><nav>' +
      '<a class="logo" href="' + root + 'index.html" aria-label="' + COMPANY + ' home">' +
      '<img src="' + root + LOGO + '" alt="' + COMPANY + '"></a>' +
      '<button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-menu"><span></span><span></span><span></span></button>' +
      '<ul id="nav-menu">' + links + (withAuth ? '<li id="auth-item"></li>' : '') + '</ul>' +
      '</nav></div></header>';
  }

  function footerHTML() {
    return '<footer><div class="wrap">&copy; ' + new Date().getFullYear() + ' ' + COMPANY + '. All rights reserved.</div></footer>';
  }

  function wireMenu() {
    var nav = document.querySelector('header nav'), btn = document.querySelector('.menu-toggle');
    if (!nav || !btn) return;
    function close() { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('#nav-menu a').forEach(function (a) { a.addEventListener('click', close); });
  }

  // The placeholder is REPLACED (not filled), so <header> stays a direct child of <body>.
  // That keeps `position: sticky` working.
  var h = document.getElementById('site-header');
  if (h) { var root = h.getAttribute('data-root') || ''; h.outerHTML = headerHTML(root, h.hasAttribute('data-auth')); }
  var f = document.getElementById('site-footer');
  if (f) f.outerHTML = footerHTML();
  wireMenu();
})();
