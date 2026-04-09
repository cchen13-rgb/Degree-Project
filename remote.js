const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const QRCode     = require('qrcode');
const crypto     = require('crypto');

const app    = express();
const server = http.createServer(app);

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
    // phones is now always an array
    rooms[code] = { desktop: socket.id, phones: [], cursorDataUrl: null, phoneName: null };
    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;
    socket.emit('room:created', { code });
  });

  // Desktop rejoins after page navigation (index → captcha, etc.)
  socket.on('desktop:rejoin', ({ code }) => {
    const room = rooms[code];
    if (!room) {
      // Room expired — start fresh
      socket.emit('desktop:init');
      return;
    }
    // Update desktop socket ID to the new connection
    room.desktop = socket.id;
    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;
    socket.emit('room:created', { code });

    // FIX: emit cursor:set to THIS socket (socket, not io.to(room.desktop))
    // room.desktop was just set to socket.id above, but being explicit is safer
    if (room.cursorDataUrl) {
      socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    }
    // Tell desktop if any phones are connected
    if (room.phones.length > 0) {
      socket.emit('phone:connected');
    }
    if (room.phoneName) {
      socket.emit('phone:name', { name: room.phoneName });
    }
  });

  // FIX: fully migrated to room.phones array
  socket.on('phone:join', ({ code }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit('room:error', 'Room not found');
      return;
    }

    room.phones.push(socket.id);
    socket.join(code);
    socket.data.role = 'phone';
    socket.data.code = code;

    socket.emit('room:joined', { code });

    // Send existing cursor to this new phone
    if (room.cursorDataUrl) {
      socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    }

    // Tell desktop a phone connected
    if (room.desktop) {
      io.to(room.desktop).emit('phone:connected');
    }
  });

  socket.on('cursor:upload', ({ dataUrl }) => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room) return;
    room.cursorDataUrl = dataUrl;
    if (room.desktop) io.to(room.desktop).emit('cursor:set', { dataUrl });
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

  socket.on('phone:focusinput', () => {
    const code = socket.data.code;
    const room = rooms[code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:focusinput');
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
    const room = rooms[code];

    if (role === 'desktop') {
      // Notify all connected phones that the desktop closed
      room.phones.forEach(phoneId => {
        io.to(phoneId).emit('room:closed');
      });
      delete rooms[code];
    } else if (role === 'phone') {
      // FIX: remove just this phone from the array
      room.phones = room.phones.filter(id => id !== socket.id);
      // Only tell desktop "disconnected" if NO phones remain
      if (room.phones.length === 0 && room.desktop) {
        io.to(room.desktop).emit('phone:disconnected');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Remote server listening on :${PORT}`));

setInterval(() => {
  const https = require('https');
  https.get('https://degree-project-r25d.onrender.com').on('error', () => {});
}, 10 * 60 * 1000);