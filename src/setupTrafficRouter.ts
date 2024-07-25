import { Router, Express, Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { requestTimer } from "./requestTimer";
import { cache } from "./cache";

export const setupTrafficRouter = (app: Express, port: Number) => {
  const router = Router();

  const server = require("http").createServer(app);
  const io = new SocketIOServer(server);

  app.use(requestTimer(io));

  router.get("/traffic", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "page", "index.html"));
  });

  router.get("/cache", (req: Request, res: Response) => {
    res.send(cache);
  });

  app.use(router);

  console.log(`Traffic is running on http://localhost:${port}/traffic`);
  return { router, server };
};
