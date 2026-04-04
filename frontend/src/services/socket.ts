import { io } from 'socket.io-client';

// In production, this would be your deployed backend URL
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
