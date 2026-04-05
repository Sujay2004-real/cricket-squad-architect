# Cricket Squad Architect 🏏

Welcome to **Cricket Squad Architect**, a real-time, live multiplayer strategic cricket draft and auction game that challenges you to build a championship-caliber team against your friends, enhanced with AI team generation running gracefully on a powerful, secure full-stack architecture.

## 🏗️ Tech Stack
This project has recently been completely modernized into a professional Monorepo Full-Stack architecture:

### Frontend
- **React 19 & Vite:** A lightning-fast development server with robust component chunking.
- **Tailwind CSS v4:** Modern utility-first stylesheet generating tiny, optimized CSS outputs.
- **Zustand:** Elegant, flux-style global state management tailored to react instantly to server pushes.
- **Socket.IO-Client:** Live WebSocket streams feeding straight into the React environment.

### Backend
- **Node.js & Express:** Hardened routing logic handling strict REST architectures and WebSockets natively.
- **Socket.IO:** The core engine of the game! Managing realtime bid races, timer drops, and lobby synchronization dynamically.
- **PostgreSQL & Prisma (v6):** Strongly-typed, relational database models mapped securely strictly through standard connection strings.
- **TypeScript:** Enforcing strict payloads across the entire infrastructure.

---

## 🚀 How to Run Locally

Because the project is full-stack, you need to spin up the local database, the backend socket server, and the frontend React application.

### 1. The Database (Backend)
1. You must have a free Postgres database setup (Neon.tech / Supabase).
2. Inside the `/backend` folder, create a `.env` file containing your connection string:
   ```env
   DATABASE_URL="postgresql://user:password@hostname:5432/db"
   ```

### 2. Booting the Backend
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

### 3. Booting the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to see your fast, responsive React dashboard loading up the game engine over websockets!

---

## 🌐 Deploying to Production
This architecture is optimized to be deployed completely natively and for **Free** across robust cloud environments.

### Render (Backend)
- Add a new **Web Service** manually on the Render dashboard.
- **Root Dir:** `backend`
- **Build Cmd:** `npm install && npm run build`
- **Start Cmd:** `npm start`
- Provide `DATABASE_URL` safely. 

### Netlify (Frontend)
- Simply point Netlify at your repository. 
- Thanks to the embedded `netlify.toml` file, it will natively target the `/frontend` sub-directory, run `vite build` under the hood dynamically, and setup router redirects out of the box!

---

## 📄 License
This project is licensed under the MIT License. See the LICENSE file for more details.
