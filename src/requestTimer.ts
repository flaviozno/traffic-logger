import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import { cache } from "./cache";
import { CacheEntry } from "./interface";

const routesToIgnore = ["/socket.io", "/favicon.ico", "/traffic", "/cache"];

export const requestTimer = (io: SocketIOServer) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    let oldWrite = res.write;
    let oldEnd = res.end;

    const chunks: Buffer[] = [];

    res.write = function (chunk: any, ...args: any[]) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return oldWrite.apply(res, [chunk, ...args] as any);
    };

    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const body = Buffer.concat(chunks).toString("utf8");
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = Number((seconds * 1e3 + nanoseconds * 1e-6).toFixed(3));
      const method = req.method || "UNKNOWN";
      const url = req.url || "UNKNOWN";
      const statusCode = res.statusCode || 404;

      if (!routesToIgnore.includes(url)) {
        const logEntry: CacheEntry = {
          method,
          url,
          statusCode,
          duration,
          body,
        };
        if (!cache[url]) {
          cache[url] = [];
        }
        cache[url].push(logEntry);
        io.emit("traffic", logEntry);
      }

      return oldEnd.apply(res, [chunk, ...args] as any);
    };

    next();
  };
};
