import 'dotenv/config';
import Fastify from 'fastify';
import fastifySocketIO from 'fastify-socket.io';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';

import { connectDB } from "./src/config/connect.js";
import { registerRoutes } from './src/routes/index.js';
import { buildAdminRouter } from './src/config/setup.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const start = async () => {
  // ---------------- 1. CONNECT DB ----------------
  await connectDB(MONGO_URI);

  const app = Fastify({
    logger: true
  });

  // ---------------- 2. COOKIE + SESSION ----------------
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    // Note: COOKIE_PASSWORD must be at least 32 characters long
    secret: process.env.COOKIE_PASSWORD || "a_very_long_secret_string_32_chars_min", 
    cookie: {
      secure: process.env.NODE_ENV === "production", // true if on Render/Production
      httpOnly: true
    },
    saveUninitialized: false
  });

  // ---------------- 3. SOCKET.IO ----------------
  await app.register(fastifySocketIO, {
    cors: {
      origin: "*"
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket']
  });

  // ---------------- 4. ROUTES (CORRECTED) ----------------
  // We register routes with the "/api" prefix so they match your frontend calls.
  // Instead of registerRoutes(app), we use the proper Fastify plugin registration.
  await app.register(registerRoutes, { prefix: "/api" });

  // ---------------- 5. ADMIN PANEL ----------------
  // This usually needs to stay separate from the /api prefix
  await buildAdminRouter(app);

  // ---------------- 6. START SERVER ----------------
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`✅ SabJab Backend running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // ---------------- 7. SOCKET LOGIC ----------------
  app.ready().then(() => {
    app.io.on("connection", (socket) => {
      console.log("🟢 User Connected");

      socket.on("joinRoom", (orderId) => {
        socket.join(orderId);
        console.log("🔵 User joined room:", orderId);
      });

      socket.on("disconnect", () => {
        console.log("🔴 User disconnected");
      });
    });
  });
};

start();
