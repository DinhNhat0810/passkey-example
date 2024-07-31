import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import memoryStore from "memorystore";
import registerRoute from "./router/register";
import authenticateRouter from "./router/authenticate";
import digitalAssetLinks from "./router/digitalAssetLinks";
import profileRouter from "./router/profile";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
const MemoryStore = memoryStore(session);

const {
  // RP_ID = "charmed-deciding-dogfish.ngrok-free.app",
  RP_ID,
} = process.env;

app.use(express.json());
app.use(express.static("./public/"));
app.use(
  session({
    secret: "secret123",
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 86400000,
      httpOnly: true, // Ensure to not expose session cookies to clientside scripts
    },
    store: new MemoryStore({
      checkPeriod: 86_400_000, // prune expired entries every 24h
    }),
  })
);

app.use("/api/webauthn/register/", registerRoute);
app.use("/api/webauthn/authenticate/", authenticateRouter);
app.use("/.well-known/", digitalAssetLinks);
app.use("/api/", profileRouter);

const host = "127.0.0.1";
const port = 8000;
// expectedOrigin = `https://charmed-deciding-dogfish.ngrok-free.app`;
// expectedOrigin = `http://localhost:5173`;

http.createServer(app).listen(port, host, () => {
  console.log(`🚀 Server ready at (${host}:${port})`);
});
