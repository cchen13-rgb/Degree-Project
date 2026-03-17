/* ===================== PARTICLES ===================== */

let particleInterval = null;

function startParticles() {
  const particleContainer = document.getElementById("particles");
  if (!particleContainer || particleInterval) return;
  particleInterval = setInterval(() => {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "vw";
    particle.style.animationDuration = (3 + Math.random() * 5) + "s";
    particle.style.opacity = Math.random();
    particleContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 8000);
  }, 600);
}

function stopParticles() {
  clearInterval(particleInterval);
  particleInterval = null;
}


/* ===================== MAGNETIC BUTTON ===================== */

function initMagneticButtons() {
  document.querySelectorAll('.login').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    });
  });

  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('mousemove', (e) => {
      const r = star.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(star, { x: x * 0.4, y: y * 0.4, duration: 0.4, ease: "power2.out" });
    });
    star.addEventListener('mouseleave', () => {
      gsap.to(star, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.3)" });
    });
  });
}


/* ===================== DOM READY ===================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---- Panel scroll fade ---- */
  const fadeEls = document.querySelectorAll(
    '.left-panel h2, .left-panel .feature-image, .left-panel p, ' +
    '.scroll-content h2, .scroll-content img, .scroll-content p'
  );
  fadeEls.forEach(el => el.classList.add('panel-fade'));

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('panel-fade--visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });
  fadeEls.forEach(el => fadeObserver.observe(el));

  /* ---- Dark mode toggle ---- */
  const toggle = document.getElementById("modeToggle");
  if (toggle) {
    toggle.addEventListener("change", () => {
      document.body.classList.toggle("dark");
      applyLoginDarkMode();
    });
  }

  /* ---- Stars click to toggle dark mode ---- */
  document.addEventListener("click", (e) => {
    if (e.target.closest(".star")) {
      document.body.classList.toggle("dark");
      if (toggle) toggle.checked = !toggle.checked;
      applyLoginDarkMode();
    }
  });

  /* ---- Door click ---- */
  const door = document.getElementById("door");
  if (door) {
    door.addEventListener("click", () => {
      door.style.transformOrigin = 'center center';
      door.style.zIndex = '9999';
      const enterText = document.querySelector('.enter');
      const logoText  = document.querySelector('.curveText');
      gsap.timeline()
        .to([enterText, logoText], {
          opacity: 0,
          duration: 0.4,
          ease: "power1.in"
        })
        .to(door, {
          scale: 20,
          duration: 0.8,
          ease: "power2.inOut"
        })
        .to(door, {
          opacity: 0,
          duration: 0.8,
          ease: "power1.in",
          onComplete: () => { window.location.href = "landing.html"; }
        });
    });
  }

  startParticles();
  applyNameReveal();
  initMagneticButtons();

  /* ---- SplitText reveal on char cards ---- */
  const cardObserverSplit = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const nameEl = entry.target.querySelector('.char-name-en');
      if (nameEl && typeof SplitText !== 'undefined') {
        const split = new SplitText(nameEl, { type: "chars" });
        gsap.from(split.chars, {
          opacity: 0,
          y: 20,
          rotateX: -40,
          stagger: 0.04,
          duration: 0.6,
          ease: "power3.out",
          delay: 0.2,
          onComplete: () => split.revert()
        });
      }
      cardObserverSplit.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.char-card').forEach(c => cardObserverSplit.observe(c));
});


/* ===================== PAGE LOAD ===================== */

let entryDone   = false;
let scrollRaf   = null;
let imageLayers = [];
let stars       = [];
let portal3d    = null;
let textEl      = null;
let loginEl     = null;

window.addEventListener("load", () => {
  document.body.classList.add("loaded");

  const loader  = document.getElementById("loader");
  const barFill = document.getElementById("loader-bar-fill");

  const totalLoad = 2500;
  const startTime = performance.now();

  function animateBar(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / totalLoad, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    if (barFill) barFill.style.width = (eased * 100) + '%';
    if (progress < 1) {
      requestAnimationFrame(animateBar);
    } else {
      setTimeout(beginEntry, 200);
    }
  }

  requestAnimationFrame(animateBar);

  function beginEntry() {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 800);
    }

    document.querySelectorAll('.dante-layer.star').forEach(el => {
      el.style.transition = 'none';
      el.style.transform  = 'translateY(120px)';
      el.style.opacity    = '0';
    });

    document.body.offsetHeight;

    document.querySelectorAll('.dante-layer').forEach(el => {
      el.classList.add('dante-in');
    });

    document.querySelectorAll('.dante-layer.star').forEach(el => {
      el.style.transition = 'opacity 2s ease 0s, filter 0.6s ease';
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(0px)';
        el.style.opacity   = '1';
      });
    });

    /* ---- ScrambleText on hero paragraph ---- */
    setTimeout(() => {
      const heroText = document.querySelector('.center .text');
      if (heroText && typeof ScrambleTextPlugin !== 'undefined') {
        const lockedWidth  = heroText.offsetWidth;
        const lockedHeight = heroText.offsetHeight;
        heroText.style.width     = lockedWidth  + 'px';
        heroText.style.height    = lockedHeight + 'px';
        heroText.style.overflow  = 'hidden';
        heroText.style.display   = 'block';
        heroText.style.opacity   = '0';
        const heroLogin = document.querySelector('.center .login');
        if (heroLogin) heroLogin.style.opacity = '0';
        const original = heroText.textContent.trim();
        if (heroLogin) {
          gsap.to(heroLogin, { opacity: 1, duration: 0.4, delay: 0.4, ease: "power1.in" });
        }
        gsap.to(heroText, {
          opacity: 1,
          duration: 0.8,
          delay: 0.4,
          ease: "power1.in",
          onComplete() {
            gsap.to(heroText, {
              duration: 2.4,
              scrambleText: {
                text: original,
                chars: "abcdefghijklmnopqrstuvwxyz—…",
                revealDelay: 0.4,
                speed: 0.5
              },
              ease: "none",
              onComplete() {
                heroText.style.width  = '';
                heroText.style.height = '';
              }
            });
          }
        });
      }
    }, 800);

    setTimeout(() => {
      imageLayers = [...document.querySelectorAll('.dante-layer:not(.star)')];
      stars       = [...document.querySelectorAll('.dante-layer.star')];
      portal3d    = document.querySelector('.portal');
      textEl      = document.querySelector('.center .text');
      loginEl     = document.querySelector('.center .login');

      stars.forEach(el => {
        el.style.transition = 'filter 0.6s ease';
      });

      entryDone = true;
      document.body.classList.add('entry-done');
      initCinematicParallax();

    }, 3200);
  }
});


/* ===================== NAME REVEAL ===================== */

function applyNameReveal() {
  document.querySelectorAll(
    '.left-panel p, .scroll-content p, .right-panel p, ' +
    '.char-profile-text, .char-name-en, .stat-value'
  ).forEach(p => {
    p.innerHTML = p.innerHTML.replace(
      /\b(Cheryl|Crane)\b/g,
      '<span class="reveal-name">$1</span>'
    );
  });
}


/* ===================== LOGIN MODAL ===================== */

const loginBtn = document.querySelector('.login');
const modal    = document.getElementById('loginModal');
const closeBtn = document.getElementById('closeModal');
const modalBox = modal ? modal.querySelector('.modal-box') : null;

if (loginBtn && modal) {
  loginBtn.addEventListener('click', () => {
    modal.classList.add('open');
    renderLogin();
  });
}

if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
if (modal)    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

let loginAttempts = 0;

function renderLogin() {
  if (!modalBox) return;

  const isDark     = document.body.classList.contains('dark');
  const loreColor  = isDark ? 'transparent' : '#3d0d14';
  const heartColor = isDark ? '#b50008'     : '#3d0d14';

  modalBox.innerHTML = `
    <button class="modal-close" id="closeModal">✕</button>

    <div style="
      border-left: 2px solid rgba(93,20,30,0.2);
      padding: 12px 16px;
      margin-bottom: 28px;
      text-align: left;
    ">
      <div style="
        font-family:'Switzer';
        font-size:9px;
        letter-spacing:3px;
        text-transform:uppercase;
        color:rgba(93,20,30,0.4);
        margin-bottom:8px;
      ">Entry · 001</div>

      <p class="lore-text" style="
        font-family:'Montserrat',sans-serif;
        font-size:11px;
        line-height:1.85;
        margin:0;
        padding:0;
        border:none;
        overflow:hidden;
        word-break:break-word;
      "><span class="lore-before" style="color:${loreColor};transition:color 0.6s;">Your name is—is— You are wandering alone through the dark. You were something before this, somewhere before here, but now…you are being called down. Perhaps these missing pieces will get filled in along the way. …</span><span class="lore-heart" style="color:${heartColor};transition:color 0.6s;">Heart</span><span class="lore-after" style="color:${loreColor};transition:color 0.6s;"> — Something about the word really resonates with you. I wonder why.</span></p>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
      <h2 style="font-size:28px;margin:0;padding:0;border:none;white-space:nowrap;">Who Am I?</h2>
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;text-align:left;">
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Username</label>
        <input id="loginUser" type="text" placeholder="username"
          style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
      </div>
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Password</label>
        <input id="loginPass" type="password" placeholder="password"
          style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
        <p id="loginError" style="
          color:#c0392b;
          font-family:'Switzer';
          font-size:10.5px;
          letter-spacing:1px;
          margin:6px 0 0 0;
          min-height:16px;
          padding:0;
          border:none;
          text-align:left;
        "></p>
      </div>
    </div>

    <button class="login" id="submitLogin" style="width:100%;">Enter</button>
  `;

  document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('open'));
  document.getElementById('submitLogin').addEventListener('click', checkLogin);
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLogin(); });

  initMagneticButtons();
}

function applyLoginDarkMode() {
  if (!modalBox) return;
  const isDark   = document.body.classList.contains('dark');
  const beforeEl = modalBox.querySelector('.lore-before');
  const afterEl  = modalBox.querySelector('.lore-after');
  const heartEl  = modalBox.querySelector('.lore-heart');
  if (beforeEl) beforeEl.style.color = isDark ? 'transparent' : '#3d0d14';
  if (afterEl)  afterEl.style.color  = isDark ? 'transparent' : '#3d0d14';
  if (heartEl)  heartEl.style.color  = isDark ? '#b50008'     : '#3d0d14';
}

function checkLogin() {
  const user = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value.trim().toLowerCase();
  const err  = document.getElementById('loginError');

  if (user === 'cheryl' && pass === 'heart') {
    loginAttempts = 0;
    modal.classList.remove('open');
    window.location.href = "captcha.html";
  } else {
    loginAttempts++;
    document.getElementById('loginPass').value = '';

    let hint = '';
    if (loginAttempts === 1) {
      hint = 'That is not right...';
    } else if (loginAttempts === 2) {
      hint = 'Perhaps the answer lies in the dark.';
      const toggle = document.getElementById('modeToggle');
      if (toggle && !document.body.classList.contains('dark')) {
        const slider = toggle.nextElementSibling;
        if (slider) {
          slider.style.transition = 'box-shadow 0.2s';
          slider.style.boxShadow  = '0 0 0 3px rgba(181,0,8,0.6)';
          setTimeout(() => { slider.style.boxShadow = ''; }, 1400);
        }
      }
    } else {
      hint = 'The password is your heart.';
    }

    if (typeof ScrambleTextPlugin !== 'undefined') {
      gsap.to(err, {
        duration: 0.8,
        scrambleText: { text: hint, chars: "abcdefghijklmnopqrstuvwxyz", speed: 0.4 },
        ease: "none"
      });
    } else {
      err.textContent = hint;
    }
  }
}


/* ===================== DANTE PARALLAX SCROLL — GSAP ScrollTrigger ===================== */

function initCinematicParallax() {
  if (!portal3d) return;

  ScrollTrigger.getAll().forEach(t => t.kill());

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: portal3d,
      start: "top top",
      end: "+=100%",
      scrub: 0.1,
      onUpdate: (self) => {
        if (self.progress > 0.08) stopParticles();
        else startParticles();
      }
    }
  });

  imageLayers.forEach((el) => {
    const depth  = parseFloat(el.dataset.depth) || 0.1;
    const isBack = depth <= 0.22;
    const yDist  = isBack ? depth * 320 : depth * 140;
    const rotX   = isBack ? depth * 10 : 0;

    tl.to(el, {
      y:       yDist,
      rotateX: rotX,
      opacity: 0,
      ease:    "power1.inOut",
      duration: 1
    }, 0);
  });

  stars.forEach((el, i) => {
    const depth = parseFloat(el.dataset.depth) || 0.1;
    tl.to(el, {
      y:       depth * 130,
      x:       (i % 2 === 0 ? 1 : -1) * depth * 40,
      opacity: 0,
      ease:    "power2.in",
      duration: 0.7
    }, 0);
  });

  tl.to(portal3d, {
    scale:   1.08,
    opacity: 0,
    ease:    "power2.inOut",
    duration: 1
  }, 0);

  if (textEl) {
    tl.to(textEl, {
      y:       40,
      opacity: 0,
      ease:    "power2.in",
      duration: 0.6
    }, 0);
  }
  if (loginEl) {
    tl.to(loginEl, {
      y:       40,
      opacity: 0,
      ease:    "power2.in",
      duration: 0.6
    }, 0.05);
  }
}

window.addEventListener('scroll', () => {
  /* Kept as no-op — ScrollTrigger owns scroll now */
});