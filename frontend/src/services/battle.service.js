import { io } from 'socket.io-client'

let socket = null

/**
 * Get (or create) the singleton socket, authenticated with the stored JWT.
 * The socket is lazy-connected — call connect() before using it.
 */
export function getSocket() {
  if (socket) return socket

  const token = localStorage.getItem('token')
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:6001', {
    auth: { token },
    autoConnect: false,
    transports: ['websocket'],
  })

  return socket
}

/** Disconnect and destroy the singleton so next call creates a fresh one. */
export function destroySocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// ── Convenience promise wrappers ──────────────────────────────

/** Emit battle:create and await the server ack callback. */
export function createRoom(payload) {
  return new Promise((resolve, reject) => {
    getSocket().emit('battle:create', payload, (res) => {
      if (res.ok) resolve(res)
      else reject(new Error(res.error || 'Gagal membuat room'))
    })
  })
}

/** Emit battle:join and await the server ack callback. */
export function joinRoom(code) {
  return new Promise((resolve, reject) => {
    getSocket().emit('battle:join', { code }, (res) => {
      if (res.ok) resolve(res)
      else reject(new Error(res.error || 'Gagal bergabung ke room'))
    })
  })
}

/** Emit battle:start and await the server ack callback. */
export function startBattle(code) {
  return new Promise((resolve, reject) => {
    getSocket().emit('battle:start', { code }, (res) => {
      if (res.ok) resolve(res)
      else reject(new Error(res.error || 'Gagal memulai battle'))
    })
  })
}

/** Emit battle:answer and await the server ack callback. */
export function submitAnswer(code, order_index, answer) {
  return new Promise((resolve) => {
    getSocket().emit('battle:answer', { code, order_index, answer }, (res) => {
      resolve(res || {})
    })
  })
}
