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
  // ---------------- CONNECT DB ----------------
  await connectDB(MONGO_URI);

  const app = Fastify({
    logger: true
  });

  // ---------------- COOKIE + SESSION ----------------
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: process.env.COOKIE_PASSWORD, // MUST be 32+ chars
    cookie: {
      secure: false, // true only for https
      httpOnly: true
    },
    saveUninitialized: false
  });

  // ---------------- SOCKET.IO ----------------
  await app.register(fastifySocketIO, {
    cors: {
      origin: "*"
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket']
  });

  // ---------------- ROUTES ----------------
  await registerRoutes(app);

  // ---------------- ADMIN PANEL ----------------
  await buildAdminRouter(app);

  // ---------------- START SERVER ----------------
  await app.listen({ port: PORT, host: "0.0.0.0" });

  console.log(`✅ SabJab Backend running on http://localhost:${PORT}`);

  // ---------------- SOCKET LOGIC ----------------
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
