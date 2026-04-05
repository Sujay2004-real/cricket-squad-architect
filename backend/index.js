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