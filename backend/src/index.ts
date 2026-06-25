import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { env } from "./env.js";
import { prisma } from "./prisma.js";
import { usersRouter } from "./routes/users.js";
import { partiesRouter } from "./routes/parties.js";
import { songsRouter } from "./routes/songs.js";
import { registerSocketHandlers, endParty } from "./socket/handlers.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/users", usersRouter);
app.use("/parties", partiesRouter);
app.use("/songs", songsRouter);

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  registerSocketHandlers(io, socket);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Party expiry checker — polls every 10s and fires party-ended when time runs out
setInterval(async () => {
  try {
    const expired = await prisma.party.findMany({
      where: { endsAt: { lte: new Date() } },
      select: { id: true },
    });
    for (const p of expired) {
      const room = io.sockets.adapter.rooms.get(p.id);
      if (room && room.size > 0) {
        await endParty(io, p.id);
      }
    }
  } catch {
    // ignore
  }
}, 10_000);

server.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
