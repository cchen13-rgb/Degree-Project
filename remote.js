const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const QRCode     = require('qrcode');
const crypto     = require('crypto');

const app    = express();
const server = http.createServer(app);

/* Manual CORS for all routes */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static('.'));

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  allowEIO3: true
});

const rooms = {};
function makeCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

app.get('/qr/:code', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  const code = req.params.code.toUpperCase();
  const phoneUrl = `https://cchen13-rgb.github.io/Degree-Project/phone.html?room=${code}`;
  try {
    const svg = await QRCode.toString(phoneUrl, { type: 'svg', margin: 1 });
    res.set('Content-Type', 'image/svg+xml').send(svg);
  } catch (e) { res.status(500).send('QR error'); }
});

io.on('connection', socket => {
  socket.on('desktop:init', () => {
    let code;
    do { code = makeCode(); } while (rooms[code]);
    rooms[code] = { desktop: socket.id, phone: null, cursorDataUrl: null };
    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;
    socket.emit('room:created', { code });
  });

  socket.on('phone:join', ({ code }) => {
    const room = rooms[code];
    if (!room) { socket.emit('room:error', 'Room not found'); return; }
    if (room.phone) { socket.emit('room:error', 'Room already has a phone connected'); return; }
    room.phone = socket.id;
    socket.join(code);
    socket.data.role = 'phone';
    socket.data.code = code;
    socket.emit('room:joined', { code });
    if (room.cursorDataUrl) socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    io.to(room.desktop).emit('phone:connected');
  });

  socket.on('cursor:upload', ({ dataUrl }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room) return;
    room.cursorDataUrl = dataUrl;
    io.to(room.desktop).emit('cursor:set', { dataUrl });
  });

  socket.on('cursor:move', ({ dx, dy }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:move', { dx, dy });
  });

  socket.on('cursor:click', () => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:click');
  });

  socket.on('phone:type', ({ text }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:type', { text });
  });

  socket.on('phone:key', ({ key }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:key', { key });
  });

  socket.on('phone:name', ({ name }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    room.phoneName = name;
    io.to(room.desktop).emit('phone:name', { name });
  });

  socket.on('disconnect', () => {
    const code = socket.data.code;
    const role = socket.data.role;
    if (!code || !rooms[code]) return;
    if (role === 'desktop') {
      if (rooms[code].phone) io.to(rooms[code].phone).emit('room:closed');
      delete rooms[code];
    } else if (role === 'phone') {
      rooms[code].phone = null;
      if (rooms[code].desktop) io.to(rooms[code].desktop).emit('phone:disconnected');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Remote server listening on :${PORT}`));

/* Keep Render free tier alive — ping every 10 minutes */
setInterval(() => {
  const https = require('https');
  https.get('https://degree-project-r25d.onrender.com').on('error', () => {});
}, 10 * 60 * 1000);