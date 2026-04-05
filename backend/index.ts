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
    credentials: true,
  },
});

const prisma = new PrismaClient();
const gameEngine = new GameEngine(io);

app.use(cors({
  origin: ['http://localhost:5173', 'https://cricket-squad-architect.netlify.app', process.env.FRONTEND_URL || ''],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// ── Helpers ─────────────────────────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!] as [T, T];
  }
  return a;
}

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Cricket Squad Architect Engine Running' });
});

app.post('/api/suggest-name', async (_req, res) => {
  const names = ['Quantum Quasars ✨', 'Blaze Titans 🔥', 'Iron Falcons ⚔️', 'Thunder Kings ⚡'];
  res.json({ suggestedName: names[Math.floor(Math.random() * names.length)] });
});

// ── CPU Game Creator ─────────────────────────────────────────────────────────
app.post('/api/create-cpu-game', async (req, res) => {
  try {
    const { userId, teamName, isTutorialMode } = req.body;

    let user = await prisma.user.findFirst({ where: { username: userId || 'Guest' } });
    if (!user) {
      user = await prisma.user.create({
        data: { username: userId || `Guest_${Math.floor(Math.random() * 9999)}` },
      });
    }

    const gameKey = Math.random().toString(36).substring(2, 7).toUpperCase();
    const crypto = require('crypto');
    const humanTeamId = crypto.randomUUID();

    // Random section assignment (PRD §3.2.2)
    const sectionPool = shuffleArray(['A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B']);
    const humanSection = sectionPool[0];

    const teamsToCreate: any[] = [
      {
        id: humanTeamId,
        name: teamName || 'Human Team',
        isCPU: false,
        section: humanSection,
        purse: 100,
        aiDifficulty: null,
      },
    ];

    // Mixed difficulty CPUs: 3 easy, 3 medium, 3 hard (PRD §5.5)
    const difficulties = shuffleArray(['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard']);
    for (let i = 0; i < 9; i++) {
      const diff = difficulties[i];
      teamsToCreate.push({
        name: `CPU ${diff!.charAt(0).toUpperCase() + diff!.slice(1)} Bot_${i + 1}`,
        isCPU: true,
        section: sectionPool[i + 1],
        purse: 100,
        aiDifficulty: diff,
      });
    }

    // ── Player Pool (PRD §3.2.1): Bronze(z=50) > Gold(x=30) > Silver(y=20) ─
    const goldCricketers: { name: string; accomplishments: string; premium: boolean }[] = [
      { name: 'Virat Kohli', accomplishments: '80+ int\'l hundreds; ICC Player of the Decade', premium: true },
      { name: 'Rohit Sharma', accomplishments: '5× IPL champion; 3× ODI double-centuries', premium: true },
      { name: 'Jasprit Bumrah', accomplishments: 'No.1 ICC Test bowler; 2023 WC winner', premium: true },
      { name: 'Pat Cummins', accomplishments: 'WC champion 2023; ICC Test captain of the year', premium: true },
      { name: 'Rashid Khan', accomplishments: 'Fastest to 100 T20I wickets; 4 IPL finals', premium: true },
      { name: 'MS Dhoni', accomplishments: 'T20+ODI WC winner; 5× IPL champion', premium: false },
      { name: 'AB de Villiers', accomplishments: 'Fastest ODI fifty/hundred records; 360° batter', premium: false },
      { name: 'Chris Gayle', accomplishments: '175* T20I WC; 1st T20I double-hundred', premium: false },
      { name: 'Ben Stokes', accomplishments: 'Ashes hero 2019; ICC Test cricketer of year 2023', premium: false },
      { name: 'Glenn Maxwell', accomplishments: '201* while injured vs Afghanistan WC 2023', premium: false },
      { name: 'Jofra Archer', accomplishments: 'Led England to 2019 WC; 145+ kph express pacer', premium: false },
      { name: 'Trent Boult', accomplishments: 'Move-both-ways master; WC 2019 finalist', premium: false },
      { name: 'Kagiso Rabada', accomplishments: 'SA fastest bowler ever; IPL Purple Cap winner', premium: false },
      { name: 'Jos Buttler', accomplishments: 'T20 WC 2022 winner; fastest England ODI century', premium: false },
      { name: 'Hardik Pandya', accomplishments: 'WC 2023 final hero; 3× IPL winner MI & GT', premium: false },
      { name: 'Sunil Narine', accomplishments: 'KKR mystery spinner; 4× IPL champion', premium: false },
      { name: 'Kieron Pollard', accomplishments: '5× IPL champion; 6 sixes off an over in T20I', premium: false },
      { name: 'Mitchell Starc', accomplishments: 'WC 2015/2023 winner; fastest WC wicket taker', premium: false },
      { name: 'Babar Azam', accomplishments: 'ICC top-ranked batter 2021–23 across all formats', premium: false },
      { name: 'Lasith Malinga', accomplishments: '4 wickets in 4 balls WC; 300+ T20I wickets', premium: false },
      { name: 'Steve Smith', accomplishments: 'ICC Test cricketer of the decade; Ashes dominant', premium: false },
      { name: 'Joe Root', accomplishments: 'England\'s all-time Test run scorer; 30+ Test hundreds', premium: false },
      { name: 'Shakib Al Hasan', accomplishments: 'Top ICC all-rounder 2008–2024; 300+ wickets intl', premium: false },
      { name: 'David Warner', accomplishments: '2× IPL champion SRH; IPL Orange Cap winner', premium: false },
      { name: 'Marnus Labuschagne', accomplishments: 'ICC Test cricketer 2022; best Ashes average since Bradman', premium: false },
      { name: 'Dawid Malan', accomplishments: 'No.1 ICC T20I batter; 2021 T20 WC finalist', premium: false },
      { name: 'Eoin Morgan', accomplishments: 'Led England to 2019 ODI WC; revolutionized white-ball cricket', premium: false },
      { name: 'KL Rahul', accomplishments: 'Fastest IPL fifty; 3× IPL finalist', premium: false },
      { name: 'Andre Russell', accomplishments: '6 sixes in 6 balls in CPL; 9 IPL seasons 150+ SR', premium: false },
      { name: 'Quinton de Kock', accomplishments: 'WC 2023 centurion vs Pakistan; 4× IPL champion', premium: false },
    ];

    const silverCricketers: { name: string; accomplishments: string }[] = [
      { name: 'Suryakumar Yadav', accomplishments: 'No.1 ICC T20I batter 2022–24; 360° batter' },
      { name: 'Faf du Plessis', accomplishments: 'RCB captain 2022; CSK 4× IPL champion' },
      { name: 'Rishabh Pant', accomplishments: 'Match-winning Test hundreds in Australia & England' },
      { name: 'Ravindra Jadeja', accomplishments: 'ICC all-rounder top 10 for 7 years; 5× IPL champion' },
      { name: 'Shaheen Afridi', accomplishments: 'PSL champion 5×; opened WC 2021 vs India with 3 wickets' },
      { name: 'Mohammad Rizwan', accomplishments: 'Most T20I runs in a calendar year (2021); WC finalist' },
      { name: 'Shikhar Dhawan', accomplishments: 'ICC WC golden bat 2013; fastest WC century at the time' },
      { name: 'Shreyas Iyer', accomplishments: 'KKR IPL champion 2024; 100 on Test debut vs NZ' },
      { name: 'Sam Curran', accomplishments: 'IPL auction record Rs 18.5cr; T20 WC 2022 Player of Tournament' },
      { name: 'Nicholas Pooran', accomplishments: 'West Indies T20 captain; 4 IPL franchises' },
      { name: 'Mujeeb Ur Rahman', accomplishments: 'Youngest bowler to take T20I hat-trick; mystery spinner' },
      { name: 'Yuzvendra Chahal', accomplishments: 'Most T20I wickets for India; IPL Purple Cap 2022' },
      { name: 'Wanindu Hasaranga', accomplishments: 'No.1 ICC T20I bowler 2022; 7-wicket WC haul' },
      { name: 'Liam Livingstone', accomplishments: 'Fastest T20I fifty (17 balls); 360° power hitter' },
      { name: 'Tim Southee', accomplishments: 'NZ most T20I wickets ever; WTC 2021 winner' },
      { name: 'Lockie Ferguson', accomplishments: '150+ kph express pacer; GT IPL champion 2022' },
      { name: 'Adam Zampa', accomplishments: 'Australia\'s No.1 white-ball spinner; WC winner 2023' },
      { name: 'Haris Rauf', accomplishments: 'PSL bowling record; 150kph top speed' },
      { name: 'Jason Holder', accomplishments: 'WI T20 WC 2021 finalist; No.1 Test all-rounder 2020' },
      { name: 'Marcus Stoinis', accomplishments: 'IPL champion 2020; T20 WC 2022 finalist' },
    ];

    const bronzeCricketers: { name: string; accomplishments: string }[] = [
      { name: 'David Miller', accomplishments: 'GT IPL champion 2022; WC 2022 T20 finalist RSA' },
      { name: 'Shubman Gill', accomplishments: 'WC 2023 centurion; IPL Orange Cap 2023' },
      { name: 'Ruturaj Gaikwad', accomplishments: 'IPL Orange Cap 2021; CSK 5× champion' },
      { name: 'Deepak Chahar', accomplishments: 'Best T20I bowling figures (6/7) vs Bangladesh' },
      { name: 'Shardul Thakur', accomplishments: 'Match-winning Test 50s in Australia & England' },
      { name: 'T Natarajan', accomplishments: 'Yorker specialist; debut across all 3 formats in same tour' },
      { name: 'Rahul Tewatia', accomplishments: '5 sixes off last over to win IPL game; GT champion 2022' },
      { name: 'Moeen Ali', accomplishments: '4× IPL title CSK; ICC T20 WC winner 2022 with England' },
      { name: 'Jonny Bairstow', accomplishments: 'Headingley 2022 genius; 6 T20I hundreds for England' },
      { name: 'Rahmanullah Gurbaz', accomplishments: 'Record T20 centuries for Afghanistan; youngest T20I centurion' },
      { name: 'Mitchell Marsh', accomplishments: 'T20 WC 2021 final hero; Ashes 2021 centurion Perth' },
      { name: 'Devon Conway', accomplishments: '200 on Test debut; WTC finalist 2021' },
      { name: 'Maheesh Theekshana', accomplishments: 'Mystery spin legend; SL top T20I wicket-taker 2022' },
      { name: 'Matheesha Pathirana', accomplishments: 'Malinga-action yorker king; WC 2023 best bowler' },
      { name: 'Cameron Green', accomplishments: 'Record IPL auction Rs 17.5cr; all-rounder for Aus' },
      { name: 'Harry Brook', accomplishments: 'Fastest 1000 Test runs for England; prodigy status' },
      { name: 'Rinku Singh', accomplishments: '5 sixes off last 5 balls IPL 2023; viral sensation' },
      { name: 'Yashasvi Jaiswal', accomplishments: 'Double century on Test debut; WC U-19 2020 winner' },
      { name: 'Mohammed Siraj', accomplishments: 'WC 2023 joint-top wicket-taker; 6/21 vs NZ ODI' },
      { name: 'Ishan Kishan', accomplishments: 'Double century in ODIs; fastest WC century for India' },
      { name: 'Aiden Markram', accomplishments: 'SA20 champion 2023/24; IPL champion 2016 U-19' },
      { name: 'Heinrich Klaasen', accomplishments: 'WC 2024 T20 final 36-ball 76; destructive keeper-bat' },
      { name: 'Marco Jansen', accomplishments: '6-foot-8 left-arm swing; highest IPL bid for SA bowler' },
      { name: 'Tristan Stubbs', accomplishments: 'SA20 centurion; MI\'s clean-hitting finisher' },
      { name: 'Phil Salt', accomplishments: 'IPL 2024 auction record for UK player; T20 power hitter' },
      { name: 'Fazalhaq Farooqi', accomplishments: 'Left-arm swing specialist; Afghan WC hero 2024' },
      { name: 'Sikandar Raza', accomplishments: 'Zim all-rounder; record T20I performance vs India 2022' },
      { name: 'Rovman Powell', accomplishments: 'WI T20 slog shot maestro; CPL champion' },
      { name: 'Shimron Hetmyer', accomplishments: 'WI WC 2016 winner U-19; last-over finisher IPL 2022' },
      { name: 'Kyle Mayers', accomplishments: '210* on ODI debut; WI Test hero vs Bangladesh' },
      { name: 'Will Jacks', accomplishments: '100-ball debut sensation; 6 sixes in T20I over' },
      { name: 'Reece Topley', accomplishments: 'England record T20I bowling; 6-wicket WC haul' },
      { name: 'Mark Wood', accomplishments: '160kph fastest English bowler ever; WC 2023 fast man' },
      { name: 'Naveen-ul-Haq', accomplishments: 'Afghan swing king; IPL auction 2024 top pacer pick' },
      { name: 'Noor Ahmad', accomplishments: 'Wrist-spin wizard; youngest Afghan T20I 5-wicket haul' },
      { name: 'Avesh Khan', accomplishments: 'Purple Cap contender IPL 2021; 150kph death bowler' },
      { name: 'Arshdeep Singh', accomplishments: 'India\'s no.1 powerplay bowler; WC 2023 winner' },
      { name: 'Axar Patel', accomplishments: '11 wickets on debut vs England 2021; left-arm spin all-rounder' },
      { name: 'Venkatesh Iyer', accomplishments: 'KKR explosive opener; 2× IPL finalist' },
      { name: 'Varun Chakaravarthy', accomplishments: 'Mystery spinner; IPL Purple Cap contender 2021' },
      { name: 'Nitish Rana', accomplishments: 'KKR captain 2023; destructive IPL left-hander' },
      { name: 'Prithvi Shaw', accomplishments: 'WC U-19 2018 winner; hundred on Test debut' },
      { name: 'Khaleel Ahmed', accomplishments: 'Left-arm swing; India ODI debut vs WI 2018' },
      { name: 'Mukesh Kumar', accomplishments: 'Bengal Ranji stalwart; India Test debut 2023' },
      { name: 'Mohit Sharma', accomplishments: 'CSK death bowler; comeback IPL 2024 champion GT' },
      { name: 'Shahrukh Khan', accomplishments: 'PBKS finisher; 1cr to 9cr IPL auction journey' },
      { name: 'Shivam Dube', accomplishments: 'T20 WC 2024 winner; CSK six-hitting machine' },
      { name: 'Washington Sundar', accomplishments: 'Youngest to take wicket in all 3 intl formats for India' },
      { name: 'Tushar Deshpande', accomplishments: 'CSK 2023 IPL champion; Mumbai pacer breakout star' },
      { name: 'Deepak Hooda', accomplishments: 'Fastest T20I fifty for India (17 balls); spin all-rounder' },
    ];

    const draftPool: any[] = [];

    goldCricketers.forEach(p =>
      draftPool.push({ name: p.name, slab: 'Gold', perk: 'Match Winner — changes the game in a single session', accomplishments: p.accomplishments, premium: p.premium })
    );
    silverCricketers.forEach(p =>
      draftPool.push({ name: p.name, slab: 'Silver', perk: 'Consistent Performer — reliable across all conditions', accomplishments: p.accomplishments, premium: false })
    );
    bronzeCricketers.forEach(p =>
      draftPool.push({ name: p.name, slab: 'Bronze', perk: 'Hidden Gem — high ceiling, low acquisition cost', accomplishments: p.accomplishments, premium: false })
    );

    const game = await prisma.game.create({
      data: {
        gameKey,
        hostId: user.id,
        slotsPerTeam: 10, // 100 players ÷ 10 teams = 10 slots each for MVP pool
        teams: { create: teamsToCreate },
        draftPool: { create: draftPool },
      },
    });

    res.json({
      success: true,
      gameKey: game.gameKey,
      teamId: humanTeamId,
      isTutorialMode: !!isTutorialMode,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// ── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinLobby', (data) => {
    // Accept both legacy string and new object form
    const gameKey = typeof data === 'string' ? data : data?.gameKey;
    const isTutorialMode = typeof data === 'object' ? !!data?.isTutorialMode : false;

    if (!gameKey) return;
    socket.join(gameKey);
    console.log(`Socket ${socket.id} joined lobby ${gameKey} (tutorial=${isTutorialMode})`);
    io.to(gameKey).emit('lobbyUpdate', { message: 'A new user joined' });

    // Auto-initialize game engine for CPU games if not already running
    if (!gameEngine.hasGame(gameKey)) {
      gameEngine.initializeGame(gameKey, isTutorialMode);
    }
  });

  socket.on('initGame', (data) => {
    gameEngine.initializeGame(data.gameKey, !!data.isTutorialMode);
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
