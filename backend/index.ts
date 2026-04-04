import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const prisma = new PrismaClient();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Basic API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cricket Squad Architect Backend Running' });
});

// Secure AI Wrapper Route
app.post('/api/suggest-name', async (req, res) => {
  try {
     // In a real implementation we would securely call the Google Gemini API using process.env.GEMINI_API_KEY
     // Example: const response = await gemini.generateText(...)
     
     // Mocking for now to verify integration structure
     res.json({ suggestedName: "Quantum Quasars ✨" });
  } catch (error) {
     res.status(500).json({ error: "Failed to generate team name" });
  }
});

// Socket.IO Lobbies and Game State
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinLobby', (gameKey) => {
    socket.join(gameKey);
    console.log(`Socket ${socket.id} joined lobby ${gameKey}`);
    io.to(gameKey).emit('lobbyUpdate', { message: 'A new user joined' });
  });

  socket.on('submitPick', (data) => {
     // Game engine logic will handle picks
     console.log('Pick submitted:', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
