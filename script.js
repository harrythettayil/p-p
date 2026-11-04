(function(){
  var btn=document.querySelector('.menu-toggle'),nav=document.querySelector('nav');
  btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
  });
  document.querySelectorAll('#nav-menu a').forEach(function(a){
    a.addEventListener('click',function(){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');});
  });
})();
  document.getElementById('year').textContent = new Date().getFullYear();

  // SETUP: pick ONE way to receive messages.
  // Option A (default): opens the visitor's email app addressed to this email.
  // Option B: create a free form at formspree.io, paste its URL below, and messages arrive in your inbox directly.
  const RECEIVER_EMAIL = "info@yourcompany.com";
  const FORM_ENDPOINT = "https://formspree.io/f/xpppkyzo"; // e.g. "https://formspree.io/f/xxxxxxx"

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target, s = document.getElementById('status'), b = f.querySelector('button[type=submit]');
    const d = Object.fromEntries(new FormData(f));
    if (FORM_ENDPOINT) {
      b.disabled = true; b.textContent = "Sending...";
      try {
        const r = await fetch(FORM_ENDPOINT, {
          method: 'POST', headers: {'Content-Type':'application/json','Accept':'application/json'},
          body: JSON.stringify(d)
        });
        if (!r.ok) throw 0;
        s.textContent = "Thank you! We'll be in touch soon.";
        f.reset();
      } catch { s.textContent = "Something went wrong. Please email us directly."; }
      finally { b.disabled = false; b.textContent = "Send message"; }
    } else {
      const body = `Name: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone||'-'}\nInterested in: ${d.topic}\n\n${d.message}`;
      location.href = `mailto:${RECEIVER_EMAIL}?subject=${encodeURIComponent('Website enquiry: '+d.topic)}&body=${encodeURIComponent(body)}`;
      s.textContent = "Opening your email app to send the message...";
    }
  });

// Scroll reveal
(function(){
  var els=document.querySelectorAll('.card, h2, .lead, .info p, form');
  if(!('IntersectionObserver' in window)){return;}
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}
    });
  },{threshold:.12});
  els.forEach(function(el,i){
    el.classList.add('reveal');
    el.style.transitionDelay=((i%5)*70)+'ms';
    io.observe(el);
  });
})();
