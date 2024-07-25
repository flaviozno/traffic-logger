import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { cache } from "./cache";
import { CacheEntry } from "./interface";

const routesToIgnore = ["/socket.io", "/favicon.ico", "/traffic", "/cache"];

export const requestTimer = (io: SocketIOServer) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();
    res.on("finish", () => {
      if (routesToIgnore.includes(req.url)) return;
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = Number((seconds * 1e3 + nanoseconds * 1e-6).toFixed(3));
      const method = req.method || "UNKNOWN";
      const url = req.url || "UNKNOWN";
      const statusCode = res.statusCode || 404;
      const logEntry: CacheEntry = { method, url, statusCode, duration };
      if (!cache[url]) {
        cache[url] = [];
      }
      cache[url].push(logEntry);
      io.emit("traffic", logEntry);
    });
    next();
  };
};
