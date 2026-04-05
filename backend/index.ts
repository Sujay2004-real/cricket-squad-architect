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

// CPU Matchmaker & DB Spawner
app.post('/api/create-cpu-game', async (req, res) => {
    try {
        const { userId, teamName } = req.body;
        
        // Ensure user exists (mocking guest auth)
        let user = await prisma.user.findFirst({ where: { username: userId || 'Guest' } });
        if (!user) {
            user = await prisma.user.create({ data: { username: userId || `Guest_${Math.floor(Math.random()*1000)}` } });
        }

        const gameKey = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        // Build 1 Human Team + 9 CPU Teams
        const teamsToCreate = [];
        teamsToCreate.push({ name: teamName || 'Human Team', isCPU: false, section: 'A', purse: 100, userId: user.id });
        for(let i=1; i<=9; i++) {
            teamsToCreate.push({ name: `CPU Bot_${i}`, isCPU: true, section: (i % 2 === 0) ? 'A' : 'B', purse: 100 });
        }

        // Mock a draft pool based on PRD
        const draftPool: any[] = [];
        const slabs = ['Gold', 'Silver', 'Bronze'];
        let playerId = 1;
        slabs.forEach(slab => {
            const count = slab === 'Gold' ? 20 : slab === 'Silver' ? 30 : 50;
            for(let j=0; j<count; j++) {
                draftPool.push({
                    name: `Player_${slab}_${j}`,
                    slab: slab,
                    perk: slab === 'Gold' ? 'Premium Match Winner' : 'Standard Perk'
                });
            }
        });

        const game = await prisma.game.create({
            data: {
                gameKey,
                hostId: user.id,
                teams: { create: teamsToCreate },
                draftPool: { create: draftPool }
            }
        });

        res.json({ success: true, gameKey: game.gameKey });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create CPU Game Environment" });
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
