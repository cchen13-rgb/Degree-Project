/*  remote-server.js
    node remote-server.js
    Requires: npm install express socket.io qrcode
*/

const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const QRCode    = require('qrcode');
const crypto    = require('crypto');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static('.'));

/* ── Room registry ──────────────────────────────────────────────
   rooms[code] = { desktop: socketId|null, phone: socketId|null,
                   cursorDataUrl: string|null }
──────────────────────────────────────────────────────────────── */
const rooms = {};

function makeCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F9C1"
}

/* ── QR endpoint ─────────────────────────────────────────────── */
app.get('/qr/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  /* Point to GitHub Pages where phone.html is hosted */
  const phoneUrl = `https://cchen13-rgb.github.io/Degree-Project/phone.html?room=${code}`;
  try {
    const svg = await QRCode.toString(phoneUrl, { type: 'svg', margin: 1 });
    res.set('Content-Type', 'image/svg+xml').send(svg);
  } catch (e) {
    res.status(500).send('QR error');
  }
});

/* ── Socket.io ───────────────────────────────────────────────── */
io.on('connection', socket => {

  /* Desktop: requests a new room */
  socket.on('desktop:init', () => {
    let code;
    do { code = makeCode(); } while (rooms[code]);
    rooms[code] = { desktop: socket.id, phone: null, cursorDataUrl: null };
    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;
    socket.emit('room:created', { code });
  });

  /* Phone: joins an existing room */
  socket.on('phone:join', ({ code }) => {
    const room = rooms[code];
    if (!room) { socket.emit('room:error', 'Room not found'); return; }
    if (room.phone) { socket.emit('room:error', 'Room already has a phone connected'); return; }

    room.phone = socket.id;
    socket.join(code);
    socket.data.role = 'phone';
    socket.data.code = code;
    socket.emit('room:joined', { code });

    /* If desktop already sent a cursor, replay it to the phone immediately */
    if (room.cursorDataUrl) {
      socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    }

    /* Notify desktop that phone is connected */
    io.to(room.desktop).emit('phone:connected');
  });

  /* Phone: sends drawn cursor image (data URL) */
  socket.on('cursor:upload', ({ dataUrl }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room) return;
    room.cursorDataUrl = dataUrl;
    /* Forward to desktop only */
    io.to(room.desktop).emit('cursor:set', { dataUrl });
  });

  /* Phone: streams position deltas (dx, dy relative moves) */
  socket.on('cursor:move', ({ dx, dy }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:move', { dx, dy });
  });

  /* Phone: tap = click at current cursor position */
  socket.on('cursor:click', () => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:click');
  });

  /* Cleanup on disconnect */
  socket.on('disconnect', () => {
    const code = socket.data.code;
    const role = socket.data.role;
    if (!code || !rooms[code]) return;

    if (role === 'desktop') {
      /* Notify phone if it was connected */
      if (rooms[code].phone) {
        io.to(rooms[code].phone).emit('room:closed');
      }
      delete rooms[code];
    } else if (role === 'phone') {
      rooms[code].phone = null;
      if (rooms[code].desktop) {
        io.to(rooms[code].desktop).emit('phone:disconnected');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Remote server listening on :${PORT}`));