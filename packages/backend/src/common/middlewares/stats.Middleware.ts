import { isbot } from "isbot";
import crypto from "crypto";
import geoip from "geoip-lite";
import { NextFunction, Request, Response } from "express";

import { VisitorModel } from "../../config/models/Visitor";
import { StatsModel } from "../../config/models/Stats";
import { IVisitorIncrement } from "@mdblog/shared/src/types/visitor.interface";

const VISITOR_COOKIE_NAME = "visitor_id";
const VISIT_THRESHOLD_MINUTES = 30;

const isBotCheck = typeof isbot === "function" ? isbot : (isbot as any).isbot;

const generateVisitorHash = (ip: string, userAgent: string): string => {
  const data = `${ip} - ${userAgent}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

const getBrowerInfo = (userAgent: string): string => {
  if (!userAgent) return "unknown";
  if (userAgent.includes("firefox")) return "firefox";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "IE";
  return "other";
};

const getRegiInfo = (ip: string): string => {
  try {
    if (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return "local";
    }

    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      return geo.country;
    }
  } catch (error) {
    console.error("지역 정보 조회 중 오류:", error);
  }
  return "unknown";
};

class StatsMiddleware {
  static async handle(req: Request, res: Response, next: NextFunction) {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/admin") ||
      req.path.startsWith("/auth") ||
      req.path.startsWith("favicon")
    ) {
      return next();
    }

    try {
      const userAgent = req.headers["user-agent"] || "";

      if (isBotCheck(userAgent)) {
        return next();
      }

      const ip =
        ((req.headers["x-forwarded-for"] as string) || "")
          .split(",")[0]
          .trim() || (req.socket.remoteAddress as string);

      const path = req.path;

      const browser = getBrowerInfo(userAgent);

      const region = getRegiInfo(ip);

      let visitorId = req.cookies[VISITOR_COOKIE_NAME];
      let isNewVisitor = false;

      if (!visitorId) {
        visitorId = generateVisitorHash(ip, userAgent);

        res.cookie(VISITOR_COOKIE_NAME, visitorId, {
          maxAge: 365 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: "lax",
        });

        isNewVisitor = true;
      }

      const visitorInfo: IVisitorIncrement = {
        visitorId,
        ip,
        userAgent,
        path,
        browser,
        region,
        isDuplicate: false,
      };

      let visitor = await VisitorModel.findOne({ visitorId });

      if (visitor) {
        const lastVisitTime = new Date(visitor.lastVisit).getTime();
        const currentTime = Date.now();
        const minutesDiff = (currentTime - lastVisitTime) / (1000 * 60);

        if (minutesDiff < VISIT_THRESHOLD_MINUTES) {
          visitorInfo.isDuplicate = true;
        }

        await VisitorModel.findByIdAndUpdate(visitor._id, {
          lastVisit: Date.now(),
          region: region,
          $inc: { visitCount: visitorInfo.isDuplicate ? 0 : 1 },
        });
      } else {
        visitor = await VisitorModel.create({
          visitorId,
          ip,
          userAgent,
          region: region,
          lastVisit: Date.now(),
          firstVisit: Date.now(),
          visitCount: 1,
        });
        isNewVisitor = true;
      }

      await StatsModel.incrementVisit(visitorInfo, isNewVisitor);

      if (global.activeVisitors == undefined) {
        global.activeVisitors = new Map();
      }

      global.activeVisitors.set(visitorId, {
        time: Date.now(),
        path: path,
        browser: browser,
        region: region,
      });

      const expireTime = Date.now() - VISIT_THRESHOLD_MINUTES * 60 * 1000;
      for (const [vid, data] of global.activeVisitors.entries()) {
        if (data.time < expireTime) {
          global.activeVisitors.delete(vid);
        }
      }
    } catch (error) {
      console.error("방문자 통계 추적 중 오류: ", error);
    }
    next();
  }
}

export default StatsMiddleware;
