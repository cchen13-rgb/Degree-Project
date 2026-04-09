/* remote-cursor.js — drop this on any page to get the phone cursor
   Usage: <script src="remote-cursor.js"></script>
   Requires socket.io CDN to be loaded first.
*/
(function () {
  const isMobile = window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth < 768;
  if (isMobile) return; /* phone.html handles mobile */

  const RENDER = 'https://degree-project-r25d.onrender.com';

  /* Inject styles */
  const style = document.createElement('style');
  style.textContent = `
    #remoteCursorLayer { position:fixed; inset:0; pointer-events:none; z-index:8999; overflow:hidden; }
    #remoteCursorEl { position:absolute; top:0; left:0; will-change:transform; display:none; }
    #remoteCursorEl img { display:block; object-fit:contain; }
    #remoteCursorEl .rc-name { position:absolute; top:calc(100% + 3px); left:0; font-family:"Switzer",sans-serif; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; white-space:nowrap; background:#3d0d14; color:#fff8f8; padding:2px 7px; }
    .rc-ripple { position:fixed; width:36px; height:36px; border-radius:50%; border:1.5px solid rgba(93,20,30,0.4); transform:translate(-50%,-50%) scale(0); pointer-events:none; z-index:8998; animation:rcRipple 0.55s ease-out forwards; }
    @keyframes rcRipple { to { transform:translate(-50%,-50%) scale(2.5); opacity:0; } }
  `;
  document.head.appendChild(style);

  /* Inject cursor DOM */
  const layer = document.createElement('div');
  layer.id = 'remoteCursorLayer';
  layer.innerHTML = `
    <div id="remoteCursorEl">
      <img id="remoteCursorImg" src="" alt="">
      <div class="rc-name" id="remoteCursorName">Remote</div>
    </div>
  `;
  document.body.appendChild(layer);

  /* Load socket.io if not already loaded */
  function initSocket() {
    const RENDER_URL = RENDER;
    const socket = io(RENDER_URL, {
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    let phoneName = 'Remote';

    const cursorEl  = document.getElementById('remoteCursorEl');
    const cursorImg = document.getElementById('remoteCursorImg');

    /* Join existing room — read code from sessionStorage set by landing page */
    socket.on('connect', () => {
      const code = sessionStorage.getItem('remoteRoomCode');
      if (code) {
        socket.emit('desktop:rejoin', { code });
      } else {
        socket.emit('desktop:init');
        socket.on('room:created', ({ code: c }) => {
          sessionStorage.setItem('remoteRoomCode', c);
        });
      }
    });

    socket.on('reconnect', () => {
      const code = sessionStorage.getItem('remoteRoomCode');
      if (code) socket.emit('desktop:rejoin', { code });
      else socket.emit('desktop:init');
    });

    socket.on('cursor:set', ({ dataUrl }) => {
      cursorImg.src = dataUrl;
      cursorEl.style.display = 'block';
      const tmp = new Image();
      tmp.onload = () => {
        const max = 56;
        const ratio = Math.min(max / tmp.width, max / tmp.height, 1);
        cursorEl.style.width  = (tmp.width  * ratio) + 'px';
        cursorEl.style.height = (tmp.height * ratio) + 'px';
        document.getElementById('remoteCursorName').textContent = phoneName;
      };
      tmp.src = dataUrl;
    });

    socket.on('cursor:move', ({ dx, dy }) => {
      curX = Math.max(0, Math.min(window.innerWidth  - 20, curX + dx));
      curY = Math.max(0, Math.min(window.innerHeight - 20, curY + dy));
      cursorEl.style.transform = `translate(${curX}px, ${curY}px)`;
    });

    socket.on('cursor:click', () => {
      const ripple = document.createElement('div');
      ripple.className  = 'rc-ripple';
      ripple.style.left = curX + 'px';
      ripple.style.top  = curY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);

      layer.style.display = 'none';
      const target = document.elementFromPoint(curX, curY);
      layer.style.display = '';

      if (target) {
        const opts = { bubbles: true, cancelable: true, clientX: curX, clientY: curY, view: window };
        target.dispatchEvent(new MouseEvent('mousedown', opts));
        target.dispatchEvent(new MouseEvent('mouseup',   opts));
        target.dispatchEvent(new MouseEvent('click',     opts));
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') target.focus();
      }
    });

    socket.on('phone:type', ({ text }) => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        const start = el.selectionStart ?? el.value.length;
        const end   = el.selectionEnd   ?? el.value.length;
        el.value = el.value.slice(0, start) + text + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + text.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    socket.on('phone:key', ({ key }) => {
      const el = document.activeElement || document.body;
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      el.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true }));
      if (key === 'Backspace' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        const start = el.selectionStart ?? el.value.length;
        if (start > 0) {
          el.value = el.value.slice(0, start - 1) + el.value.slice(el.selectionEnd ?? start);
          el.selectionStart = el.selectionEnd = start - 1;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    socket.on('phone:focusinput', () => {
      layer.style.display = 'none';
      const target = document.elementFromPoint(curX, curY);
      layer.style.display = '';
      let el = target;
      while (el && el !== document.body) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.focus(); break; }
        el = el.parentElement;
      }
      if (!el || el === document.body) {
        const inputs = document.querySelectorAll('input:not([type=hidden]):not([disabled]), textarea');
        for (const input of inputs) {
          const rect = input.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) { input.focus(); break; }
        }
      }
    });

    socket.on('phone:name', ({ name }) => {
      phoneName = name || 'Remote';
      document.getElementById('remoteCursorName').textContent = phoneName;
    });

    socket.on('phone:connected', () => {
      cursorEl.style.display = 'block';
    });

    socket.on('phone:disconnected', () => {
      cursorEl.style.display = 'none';
    });
  }

  /* Wait for socket.io to be available */
  if (typeof io !== 'undefined') {
    initSocket();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    s.onload = initSocket;
    document.head.appendChild(s);
  }

})();