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
  const container = document.getElementById("particles");
  if (container) container.innerHTML = '';
}

/* Pause/resume parallax ScrollTrigger */
let parallaxPaused = false;

function pauseParallax() {
  if (parallaxPaused) return;
  parallaxPaused = true;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.disable());
  }
}

function resumeParallax() {
  if (!parallaxPaused) return;
  parallaxPaused = false;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.enable());
  }
}

const isMobile = () => window.innerWidth <= 1024;


/* ===================== MAGNETIC BUTTON ===================== */

function initMagneticButtons() {
  if (isMobile()) return; /* skip on mobile — not needed and costs performance */

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

  /* star2 is NEVER given to GSAP — CSS owns its transform entirely */
  document.querySelectorAll('.star:not(.star2)').forEach(star => {
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
        .to([enterText, logoText], { opacity: 0, duration: 0.4, ease: "power1.in" })
        .to(door, { scale: 20, duration: 0.8, ease: "power2.inOut" })
        .to(door, {
          opacity: 0, duration: 0.8, ease: "power1.in",
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
          opacity: 0, y: 20, rotateX: -40, stagger: 0.04,
          duration: 0.6, ease: "power3.out", delay: 0.2,
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
let imageLayers = [];
let stars       = [];
let portal3d    = null;
let textEl      = null;
let loginEl     = null;

window.addEventListener("load", () => {
  document.body.classList.add("loaded");

  const loader  = document.getElementById("loader");
  const barFill = document.getElementById("loader-bar-fill");
  const totalLoad = 4000;
  const startTime = performance.now();

  /* Hide login immediately before anything renders */
  const heroLogin = document.querySelector('.center .login');
  const heroText  = document.querySelector('.center .text');
  if (heroLogin) {
    heroLogin.style.opacity    = '0';
    heroLogin.style.visibility = 'hidden';
    heroLogin.style.transition = 'none';
  }
  if (heroText) {
    heroText.style.opacity = '0';
  }

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

    if (isMobile()) {
      /* ============ MOBILE ENTRY ============ */
      gsap.ticker.sleep();

      document.querySelectorAll('.dante-layer:not(.star)').forEach(el => {
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(40px)';
        el.style.transition = 'none';
      });
      document.querySelectorAll('.dante-layer.star').forEach(el => {
        el.style.opacity    = '0';
        el.style.transition = 'none';
      });

      document.body.offsetHeight;

      /* Start layers fading immediately — loader fades out over them */
      document.querySelectorAll('.dante-layer:not(.star)').forEach((el, i) => {
        const delay = i * 280;
        el.style.transition = `opacity 1.4s ease ${delay}ms, transform 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
        setTimeout(() => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0px)';
        }, 50);
      });

      const starDelay = document.querySelectorAll('.dante-layer:not(.star)').length * 280;
      document.querySelectorAll('.dante-layer.star').forEach(el => {
        el.style.transition = `opacity 1.2s ease ${starDelay}ms`;
        setTimeout(() => { el.style.opacity = '1'; }, 50);
      });

      if (heroLogin) {
        const loginDelay = starDelay + 600;
        heroLogin.style.visibility = 'visible';
        heroLogin.style.transition = 'opacity 1s ease';
        setTimeout(() => { heroLogin.style.opacity = '1'; }, loginDelay);
      }

      /* Loader fades out over 1.4s — layer 1 is halfway through its fade when loader is gone */
      if (loader) {
        loader.style.transition = 'opacity 1.4s ease';
        loader.style.opacity    = '0';
        setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1500);
      }

    } else {
      /* ============ DESKTOP ENTRY ============ */

      document.querySelectorAll('.dante-layer.star').forEach(el => {
        if (el.classList.contains('star2')) {
          el.style.opacity = '0';
        } else {
          el.style.transition = 'none';
          el.style.transform  = 'translateY(120px)';
          el.style.opacity    = '0';
        }
      });

      document.body.offsetHeight;

      /* Start layer animations immediately alongside loader fade */
      document.querySelectorAll('.dante-layer:not(.star)').forEach(el => {
        el.classList.add('dante-in');
      });

      document.querySelectorAll('.dante-layer.star').forEach(el => {
        if (el.classList.contains('star2')) {
          el.style.transition = 'opacity 2s ease 0s';
          setTimeout(() => { el.style.opacity = '1'; }, 50);
        } else {
          el.style.transition = 'opacity 2s ease 0s, transform 2s cubic-bezier(0.16,1,0.3,1), filter 0.6s ease';
          setTimeout(() => {
            el.style.transform = 'translateY(0px)';
            el.style.opacity   = '1';
          }, 50);
        }
      });

      /* Loader fades out over 1.4s — layer 1 (0s delay, 2s duration) is halfway done when loader gone */
      if (loader) {
        loader.style.transition = 'opacity 1.4s ease';
        loader.style.opacity    = '0';
        setTimeout(() => { if (loader.parentNode) loader.remove(); }, 1500);
      }

      /* Login fades in after layers have settled */
      if (heroLogin) {
        setTimeout(() => {
          heroLogin.style.visibility = 'visible';
          heroLogin.style.transition = 'opacity 1.4s ease';
          heroLogin.style.opacity    = '1';
        }, 2800);
      }

      /* ScrambleText on hero text */
      if (heroText && typeof ScrambleTextPlugin !== 'undefined') {
        const lockedWidth  = heroText.offsetWidth;
        const lockedHeight = heroText.offsetHeight;
        heroText.style.width    = lockedWidth  + 'px';
        heroText.style.height   = lockedHeight + 'px';
        heroText.style.overflow = 'hidden';
        heroText.style.display  = 'block';
        const original = heroText.textContent.trim();
        setTimeout(() => {
          gsap.to(heroText, {
            opacity: 1, duration: 1.2, ease: "power1.in",
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
        }, 2000);
      }

      /* Hand off to GSAP ScrollTrigger after everything settled */
      setTimeout(() => {
        imageLayers = [...document.querySelectorAll('.dante-layer:not(.star)')];
        stars       = [...document.querySelectorAll('.dante-layer.star')];
        portal3d    = document.querySelector('.portal');
        textEl      = document.querySelector('.center .text');
        loginEl     = document.querySelector('.center .login');

        stars.forEach(el => {
          if (el.classList.contains('star2')) {
            el.style.removeProperty('transform');
            el.style.transition = 'opacity 2s ease, filter 0.6s ease';
          } else {
            el.style.transition = 'filter 0.6s ease';
          }
        });

        entryDone = true;
        document.body.classList.add('entry-done');

        setTimeout(() => { initCinematicParallax(); }, 1200);

      }, 5000);
    }
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
    document.body.classList.add('modal-open');
    renderLogin();
    stopParticles();
    pauseParallax();
  });
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  startParticles();
  resumeParallax();
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal)    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

let loginAttempts = 0;

function renderLogin() {
  if (!modalBox) return;

  const isDark     = document.body.classList.contains('dark');
  const loreColor  = isDark ? 'transparent' : '#3d0d14';
  const heartColor = isDark ? '#b50008'     : '#3d0d14';

  modalBox.innerHTML = `
    <button class="modal-close" id="closeModal">✕</button>

    <div style="border-left:2px solid rgba(93,20,30,0.2);padding:12px 16px;margin-bottom:28px;text-align:left;">
      <div style="font-family:'Switzer';font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(93,20,30,0.4);margin-bottom:8px;">Entry · 001</div>
      <p class="lore-text" style="font-family:'Montserrat',sans-serif;font-size:11px;line-height:1.85;margin:0;padding:0;border:none;overflow:hidden;word-break:break-word;">
        <span class="lore-before" style="color:${loreColor};transition:color 0.6s;">Your name is—is— You are wandering alone through the dark. You were something before this, somewhere before here, but now…you are being called down. Perhaps these missing pieces will get filled in along the way. …</span><span class="lore-heart" style="color:${heartColor};transition:color 0.6s;">Heart</span><span class="lore-after" style="color:${loreColor};transition:color 0.6s;"> — Something about the word really resonates with you. I wonder why.</span>
      </p>
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
      <h2 style="font-size:28px;margin:0;padding:0;border:none;white-space:nowrap;">Who Am I?</h2>
      <div style="flex:1;height:1px;background:rgba(93,20,30,0.12);"></div>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;text-align:left;">
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Username</label>
        <input id="loginUser" type="text" placeholder="username" inputmode="text" autocomplete="username" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
      </div>
      <div>
        <label style="font-family:'Switzer';font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(93,20,30,0.4);display:block;margin-bottom:6px;">Password</label>
        <input id="loginPass" type="password" placeholder="password" inputmode="text" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid rgba(93,20,30,0.2);background:transparent;font-family:'Switzer';font-size:12px;outline:none;">
        <p id="loginError" style="color:#c0392b;font-family:'Switzer';font-size:10.5px;letter-spacing:1px;margin:6px 0 0 0;min-height:16px;padding:0;border:none;text-align:left;"></p>
      </div>
    </div>

    <button class="login" id="submitLogin" style="width:100%;">Enter</button>
  `;

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('submitLogin').addEventListener('click', checkLogin);
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkLogin(); });

  if (!isMobile()) initMagneticButtons();
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
    closeModal();
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


/* ===================== DANTE PARALLAX SCROLL — desktop only ===================== */

function initCinematicParallax() {
  if (!portal3d || isMobile()) return; /* skip entirely on mobile */

  ScrollTrigger.getAll().forEach(t => t.kill());

  let lastProgress = -1;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: portal3d,
      start: "top top",
      end: "+=100%",
      scrub: 0.2,
      onEnter: () => {
        imageLayers.forEach(el => el.style.willChange = 'transform, opacity');
      },
      onLeave: () => {
        imageLayers.forEach(el => el.style.willChange = 'auto');
      },
      onEnterBack: () => {
        imageLayers.forEach(el => el.style.willChange = 'transform, opacity');
      },
      onLeaveBack: () => {
        imageLayers.forEach(el => el.style.willChange = 'auto');
      },
      onUpdate: (self) => {
        const p = self.progress;
        if (lastProgress < 0.08 && p >= 0.08) stopParticles();
        else if (lastProgress >= 0.08 && p < 0.08) startParticles();
        lastProgress = p;
      }
    }
  });

  imageLayers.forEach((el) => {
    const depth  = parseFloat(el.dataset.depth) || 0.1;
    const isBack = depth <= 0.22;
    const yDist  = isBack ? depth * 320 : depth * 140;
    const rotX   = isBack ? depth * 10 : 0;
    tl.to(el, { y: yDist, rotateX: rotX, opacity: 0, ease: "power1.inOut", duration: 1 }, 0);
  });

  /* star2: opacity fade ONLY — GSAP never sets x/y/transform on it */
  stars.forEach((el, i) => {
    const depth = parseFloat(el.dataset.depth) || 0.1;
    if (el.classList.contains('star2')) {
      tl.to(el, { opacity: 0, ease: "power2.in", duration: 0.7 }, 0);
    } else {
      tl.to(el, {
        y: depth * 130,
        x: (i % 2 === 0 ? 1 : -1) * depth * 40,
        opacity: 0,
        ease: "power2.in",
        duration: 0.7
      }, 0);
    }
  });

  tl.to(portal3d, { scale: 1.08, opacity: 0, ease: "power2.inOut", duration: 1 }, 0);
  if (textEl)  tl.to(textEl,  { y: 40, opacity: 0, ease: "power2.in", duration: 0.6 }, 0);
  if (loginEl) tl.to(loginEl, { y: 40, opacity: 0, ease: "power2.in", duration: 0.6 }, 0.05);
}

window.addEventListener('scroll', () => {
  /* no-op — ScrollTrigger owns scroll on desktop */
});