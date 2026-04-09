const { Server } = require('socket.io');

/**
 * CORS origins for Socket.io (must match the Vite dev server and production web app).
 */
const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function parseOrigins() {
  const raw = process.env.ALLOWED_ORIGIN;
  if (!raw || !raw.trim()) return DEFAULT_ORIGINS;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

let ioInstance = null;

/**
 * Attach Socket.io to the HTTP server (not the Express app alone).
 */
function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: parseOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

/**
 * Broadcast a new SOS alert.
 * Payload: { id, location: { latitude, longitude }, timestamp }
 */
function emitNewAlert(payload) {
  if (!ioInstance) return;
  ioInstance.emit('new-alert', payload);
}

/**
 * Broadcast when a volunteer accepts an alert (user app listens).
 * Payload: { alertId, volunteer: { name, phone } }
 */
function emitAlertAccepted(payload) {
  if (!ioInstance) return;
  ioInstance.emit('alert-accepted', payload);
}

/**
 * Broadcast alert lifecycle (pending list should drop these).
 * Payload: { alertId, status }
 */
function emitAlertStatusChange(payload) {
  if (!ioInstance) return;
  ioInstance.emit('alert-status-change', payload);
}

/**
 * Broadcast volunteer location updates (user app listens for assigned volunteer).
 * Payload: { volunteerId, latitude, longitude, timestamp }
 */
function emitVolunteerLocationUpdate(payload) {
  if (!ioInstance) return;
  ioInstance.emit('volunteer-location-update', payload);
}

module.exports = {
  initSocket,
  getIO,
  emitNewAlert,
  emitAlertAccepted,
  emitAlertStatusChange,
  emitVolunteerLocationUpdate,
};
