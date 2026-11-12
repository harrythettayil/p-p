(async function () {
  var ctx = await App.init();
  var msg = document.getElementById('amsg');
  if (!App.sb) return App.message(msg, 'The blog is not connected yet. Add your Supabase keys in blog/config.js.', 'error');
  if (ctx.user) { location.href = 'write.html'; return; }

  var signup = false;
  var title = document.getElementById('auth-title');
  var submit = document.getElementById('auth-submit');
  var toggle = document.getElementById('toggle-mode');
  var nameRow = document.getElementById('name-row');
  var pass = document.getElementById('password');

  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    signup = !signup;
    title.textContent = signup ? 'Create an account' : 'Sign in';
    submit.textContent = signup ? 'Create account' : 'Sign in';
    toggle.textContent = signup ? 'Already have an account? Sign in' : 'New here? Create an account';
    nameRow.hidden = !signup;
    document.getElementById('dname').required = signup;
    pass.autocomplete = signup ? 'new-password' : 'current-password';
    App.message(msg, '');
  });

  document.getElementById('authForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = document.getElementById('email').value.trim();
    var password = pass.value;
    submit.disabled = true;

    if (signup) {
      var r = await App.sb.auth.signUp({
        email: email, password: password,
        options: { data: { display_name: document.getElementById('dname').value.trim() } }
      });
      submit.disabled = false;
      if (r.error) return App.message(msg, r.error.message, 'error');
      if (r.data.session) { location.href = 'write.html'; return; }
      App.message(msg, 'Almost done! Check your email and click the confirmation link, then sign in.', 'ok');
    } else {
      var s = await App.sb.auth.signInWithPassword({ email: email, password: password });
      submit.disabled = false;
      if (s.error) return App.message(msg, 'Incorrect email or password.', 'error');
      location.href = 'write.html';
    }
  });
})();
