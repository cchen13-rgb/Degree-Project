const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const QRCode     = require('qrcode');
const crypto     = require('crypto');

const app    = express();
const server = http.createServer(app);

/* Manual CORS */
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
  } catch (e) {
    res.status(500).send('QR error');
  }
});

io.on('connection', socket => {

  /* DESKTOP INIT */
  socket.on('desktop:init', () => {
    let code;
    do { code = makeCode(); } while (rooms[code]);

    rooms[code] = {
      desktop: socket.id,
      phones: [], // ✅ MULTIPLE PHONES
      cursorDataUrl: null,
      phoneName: null
    };

    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;

    socket.emit('room:created', { code });
  });

  /* DESKTOP REJOIN */
  socket.on('desktop:rejoin', ({ code }) => {
    const room = rooms[code];
    if (!room) { socket.emit('desktop:init'); return; }

    room.desktop = socket.id;
    socket.join(code);
    socket.data.role = 'desktop';
    socket.data.code = code;

    socket.emit('room:created', { code });

    if (room.cursorDataUrl) socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    if (room.phones.length > 0) socket.emit('phone:connected');
    if (room.phoneName) socket.emit('phone:name', { name: room.phoneName });
  });

  /* PHONE JOIN */
  socket.on('phone:join', ({ code }) => {
    const room = rooms[code];
    if (!room) {
      socket.emit('room:error', 'Room not found');
      return;
    }

    room.phones.push(socket.id); // ✅ ADD PHONE

    socket.join(code);
    socket.data.role = 'phone';
    socket.data.code = code;

    socket.emit('room:joined', { code });

    if (room.cursorDataUrl) {
      socket.emit('cursor:set', { dataUrl: room.cursorDataUrl });
    }

    if (room.desktop) {
      io.to(room.desktop).emit('phone:connected');
    }

    console.log("📱 phones:", room.phones.length);
  });

  /* CURSOR */
  socket.on('cursor:upload', ({ dataUrl }) => {
    const room = rooms[socket.data.code];
    if (!room) return;
    room.cursorDataUrl = dataUrl;
    io.to(room.desktop).emit('cursor:set', { dataUrl });
  });

  socket.on('cursor:move', ({ dx, dy }) => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:move', { dx, dy });
  });

  socket.on('cursor:click', () => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('cursor:click');
  });

  /* INPUT */
  socket.on('phone:type', ({ text }) => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:type', { text });
  });

  socket.on('phone:key', ({ key }) => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:key', { key });
  });

  socket.on('phone:focusinput', () => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    io.to(room.desktop).emit('phone:focusinput');
  });

  /* NAME */
  socket.on('phone:name', ({ name }) => {
    const room = rooms[socket.data.code];
    if (!room || !room.desktop) return;
    room.phoneName = name;
    io.to(room.desktop).emit('phone:name', { name });
  });

  /* DISCONNECT */
  socket.on('disconnect', () => {
    const code = socket.data.code;
    const role = socket.data.role;

    if (!code || !rooms[code]) return;

    const room = rooms[code];

    if (role === 'desktop') {
      room.phones.forEach(id => io.to(id).emit('room:closed'));
      delete rooms[code];
    }

    if (role === 'phone') {
      room.phones = room.phones.filter(id => id !== socket.id);

      if (room.desktop) {
        io.to(room.desktop).emit('phone:disconnected');
      }

      console.log("📱 remaining:", room.phones.length);
    }
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));