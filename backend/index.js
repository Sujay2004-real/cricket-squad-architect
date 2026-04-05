"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const gameEngine_1 = require("./gameEngine");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
const prisma = new client_1.PrismaClient();
const gameEngine = new gameEngine_1.GameEngine(io);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express_1.default.json());
// Basic API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cricket Squad Architect Engine Running' });
});
// Secure AI Wrapper Route
app.post('/api/suggest-name', async (req, res) => {
    try {
        res.json({ suggestedName: "Quantum Quasars ✨" });
    }
    catch (error) {
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
            user = await prisma.user.create({ data: { username: userId || `Guest_${Math.floor(Math.random() * 1000)}` } });
        }
        const gameKey = Math.random().toString(36).substring(2, 7).toUpperCase();
        // Build 1 Human Team + 9 CPU Teams
        const teamsToCreate = [];
        teamsToCreate.push({ name: teamName || 'Human Team', isCPU: false, section: 'A', purse: 100, userId: user.id });
        for (let i = 1; i <= 9; i++) {
            teamsToCreate.push({ name: `CPU Bot_${i}`, isCPU: true, section: (i % 2 === 0) ? 'A' : 'B', purse: 100 });
        }
        // Mock a draft pool based on PRD
        const draftPool = [];
        const slabs = ['Gold', 'Silver', 'Bronze'];
        let playerId = 1;
        slabs.forEach(slab => {
            const count = slab === 'Gold' ? 20 : slab === 'Silver' ? 30 : 50;
            for (let j = 0; j < count; j++) {
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map