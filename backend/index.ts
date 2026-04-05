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
    origin: ['http://localhost:5173', 'https://cricket-squad-architect.netlify.app', process.env.FRONTEND_URL || ''],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const prisma = new PrismaClient();
const gameEngine = new GameEngine(io);

app.use(cors({
    origin: ['http://localhost:5173', 'https://cricket-squad-architect.netlify.app', process.env.FRONTEND_URL || ''],
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
        const crypto = require('crypto');
        const humanTeamId = crypto.randomUUID();
        
        teamsToCreate.push({ id: humanTeamId, name: teamName || 'Human Team', isCPU: false, section: 'A', purse: 100, userId: user.id });
        for(let i=1; i<=9; i++) {
            teamsToCreate.push({ name: `CPU Bot_${i}`, isCPU: true, section: (i % 2 === 0) ? 'A' : 'B', purse: 100 });
        }

        // Mock a draft pool based on PRD (Big List)
        const draftPool: any[] = [];
        
        const goldCricketers = ['Virat Kohli', 'Rohit Sharma', 'Jasprit Bumrah', 'Pat Cummins', 'MS Dhoni', 'AB de Villiers', 'Lasith Malinga', 'Chris Gayle', 'Rashid Khan', 'Ben Stokes', 'Glenn Maxwell', 'Jofra Archer', 'Trent Boult', 'Kagiso Rabada', 'Jos Buttler', 'Hardik Pandya', 'Sunil Narine', 'Kieron Pollard', 'Mitchell Starc', 'Babar Azam'];
        const silverCricketers = ['Kane Williamson', 'David Warner', 'Suryakumar Yadav', 'Quinton de Kock', 'Faf du Plessis', 'Andre Russell', 'KL Rahul', 'Rishabh Pant', 'Ravindra Jadeja', 'Shaheen Afridi', 'Mohammad Rizwan', 'Eoin Morgan', 'Shikhar Dhawan', 'Shreyas Iyer', 'Sam Curran', 'Nicholas Pooran', 'Mujeeb Ur Rahman', 'Yuzvendra Chahal', 'Wanindu Hasaranga', 'Liam Livingstone', 'Tim Southee', 'Lockie Ferguson', 'Adam Zampa', 'Haris Rauf', 'Jason Holder', 'Krunal Pandya', 'Marcus Stoinis', 'Glenn Phillips', 'Anrich Nortje', 'Mustafizur Rahman'];
        const bronzeCricketers = ['David Miller', 'Shubman Gill', 'Ruturaj Gaikwad', 'Deepak Chahar', 'Shardul Thakur', 'T Natarajan', 'Rahul Tewatia', 'Moeen Ali', 'Jonny Bairstow', 'Rahmanullah Gurbaz', 'Mitchell Marsh', 'Devon Conway', 'Maheesh Theekshana', 'Matheesha Pathirana', 'Cameron Green', 'Harry Brook', 'Rinku Singh', 'Yashasvi Jaiswal', 'Mohammed Siraj', 'Ishan Kishan', 'Aiden Markram', 'Heinrich Klaasen', 'Marco Jansen', 'Tristan Stubbs', 'Phil Salt', 'Fazalhaq Farooqi', 'Sikandar Raza', 'Rovman Powell', 'Shimron Hetmyer', 'Kyle Mayers', 'Will Jacks', 'Reece Topley', 'Mark Wood', 'Naveen-ul-Haq', 'Noor Ahmad', 'Avesh Khan', 'Arshdeep Singh', 'Axar Patel', 'Venkatesh Iyer', 'Varun Chakaravarthy', 'Nitish Rana', 'Prithvi Shaw', 'Khaleel Ahmed', 'Mukesh Kumar', 'Mohit Sharma', 'Shahrukh Khan', 'Shivam Dube', 'Washington Sundar', 'Tushar Deshpande', 'Deepak Hooda'];

        goldCricketers.forEach(name => draftPool.push({ name, slab: 'Gold', perk: 'Premium Match Winner' }));
        silverCricketers.forEach(name => draftPool.push({ name, slab: 'Silver', perk: 'Consistent Performer' }));
        bronzeCricketers.forEach(name => draftPool.push({ name, slab: 'Bronze', perk: 'Hidden Gem' }));

        const game = await prisma.game.create({
            data: {
                gameKey,
                hostId: user.id,
                teams: { create: teamsToCreate },
                draftPool: { create: draftPool }
            }
        });

        res.json({ success: true, gameKey: game.gameKey, teamId: humanTeamId });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || String(error) });
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
