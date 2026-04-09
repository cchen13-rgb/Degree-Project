/* remote-cursor.js — drop this on any page to get multi-phone cursors
   Usage: <script src="remote-cursor.js"></script>
   Requires socket.io CDN to be loaded first.
*/
(function () {
  const isMobile = window.matchMedia('(hover: none), (pointer: coarse)').matches || window.innerWidth < 768;
  if (isMobile) return;

  const RENDER = 'https://degree-project-r25d.onrender.com';

  const style = document.createElement('style');
  style.textContent = `
    #remoteCursorLayer { position:fixed; inset:0; pointer-events:none; z-index:8999; overflow:hidden; }
    .rc-cursor { position:absolute; top:0; left:0; will-change:transform; display:none; }
    .rc-cursor img { display:block; object-fit:contain; }
    .rc-cursor .rc-name { position:absolute; top:calc(100% + 3px); left:0; font-family:"Switzer",sans-serif; font-size:9px; letter-spacing:1.5px; text-transform:uppercase; white-space:nowrap; background:#3d0d14; color:#fff8f8; padding:2px 7px; }
    .rc-ripple { position:fixed; width:36px; height:36px; border-radius:50%; border:1.5px solid rgba(93,20,30,0.4); transform:translate(-50%,-50%) scale(0); pointer-events:none; z-index:8998; animation:rcRipple 0.55s ease-out forwards; }
    @keyframes rcRipple { to { transform:translate(-50%,-50%) scale(2.5); opacity:0; } }
  `;
  document.head.appendChild(style);

  /* Only inject layer if not already in the HTML */
  if (!document.getElementById('remoteCursorLayer')) {
    const layer = document.createElement('div');
    layer.id = 'remoteCursorLayer';
    document.body.appendChild(layer);
  }

  function initSocket() {
    const socket = io(RENDER, {
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    const layer   = document.getElementById('remoteCursorLayer');
    const cursors = {};

    function getOrCreateCursor(id) {
      if (cursors[id]) return cursors[id];
      const el = document.createElement('div');
      el.className = 'rc-cursor';
      el.innerHTML = '<img src="" alt=""><div class="rc-name">Remote</div>';
      layer.appendChild(el);
      cursors[id] = { el, x: window.innerWidth / 2, y: window.innerHeight / 2 };
      return cursors[id];
    }

    function removeCursor(id) {
      if (cursors[id]) { cursors[id].el.remove(); delete cursors[id]; }
    }

    socket.on('connect', () => {
      const code = sessionStorage.getItem('remoteRoomCode');
      if (code) socket.emit('desktop:rejoin', { code });
      else {
        socket.emit('desktop:init');
        socket.on('room:created', ({ code: c }) => sessionStorage.setItem('remoteRoomCode', c));
      }
    });

    socket.on('reconnect', () => {
      const code = sessionStorage.getItem('remoteRoomCode');
      if (code) socket.emit('desktop:rejoin', { code });
      else socket.emit('desktop:init');
    });

    socket.on('cursor:set', ({ dataUrl, id }) => {
      const c = getOrCreateCursor(id);
      c.el.querySelector('img').src = dataUrl;
      c.el.style.display = 'block';
      const tmp = new Image();
      tmp.onload = () => {
        const max = 56;
        const ratio = Math.min(max / tmp.width, max / tmp.height, 1);
        c.el.style.width  = (tmp.width  * ratio) + 'px';
        c.el.style.height = (tmp.height * ratio) + 'px';
      };
      tmp.src = dataUrl;
    });

    socket.on('cursor:move', ({ dx, dy, id }) => {
      const c = getOrCreateCursor(id);
      c.x = Math.max(0, Math.min(window.innerWidth  - 20, c.x + dx));
      c.y = Math.max(0, Math.min(window.innerHeight - 20, c.y + dy));
      c.el.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px)';
    });

    socket.on('cursor:click', ({ id }) => {
      const c = getOrCreateCursor(id);
      const ripple = document.createElement('div');
      ripple.className  = 'rc-ripple';
      ripple.style.left = c.x + 'px';
      ripple.style.top  = c.y + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);

      layer.style.display = 'none';
      const target = document.elementFromPoint(c.x, c.y);
      layer.style.display = '';
      if (target) {
        const opts = { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, view: window };
        target.dispatchEvent(new MouseEvent('mousedown', opts));
        target.dispatchEvent(new MouseEvent('mouseup',   opts));
        target.dispatchEvent(new MouseEvent('click',     opts));
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') target.focus();
      }
    });

    socket.on('cursor:remove', ({ id }) => removeCursor(id));

    socket.on('phone:name', ({ name, id }) => {
      const c = getOrCreateCursor(id);
      c.el.querySelector('.rc-name').textContent = name || 'Remote';
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

    socket.on('phone:focusinput', ({ id }) => {
      const c = cursors[id];
      const cx = c ? c.x : window.innerWidth / 2;
      const cy = c ? c.y : window.innerHeight / 2;
      layer.style.display = 'none';
      const target = document.elementFromPoint(cx, cy);
      layer.style.display = '';
      if (target) {
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
      }
    });

    socket.on('phone:disconnected', () => {
      Object.keys(cursors).forEach(removeCursor);
    });
  }

  if (typeof io !== 'undefined') initSocket();
  else {
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    s.onload = initSocket;
    document.head.appendChild(s);
  }
})();