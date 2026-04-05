import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { GameEngine } from './gameEngine';

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
const gameEngine = new GameEngine(io);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Basic API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cricket Squad Architect Engine Running' });
});

// Secure AI Wrapper Route
app.post('/api/suggest-name', async (req, res) => {
  try {
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
    
    // Boot the engine if it hasn't started for this game
    // gameEngine.initializeGame(gameKey) would be called here properly if host clicked 'start'
  });

  socket.on('initGame', (data) => {
    gameEngine.initializeGame(data.gameKey);
  });

  socket.on('submitPick', (data) => {
      gameEngine.registerPick(data.gameKey, data.teamId, data.slab, data.number);
  });
  
  socket.on('actionAccept', (data) => {
      gameEngine.handleAccept(data.gameKey, data.teamId);
  });

  socket.on('actionReject', (data) => {
      gameEngine.handleReject(data.gameKey, data.teamId);
  });

  socket.on('actionChallenge', (data) => {
      gameEngine.handleChallengeBid(data.gameKey, data.teamId, data.originalId, data.bidAmount);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server engine is running on port ${PORT}`);
});
