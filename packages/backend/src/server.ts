import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import passport from "passport";
import connectDB from "./config/data/database";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

import ErrorMiddleware from "./common/middlewares/Error.Middleware";
import mainRouter from "./routes/index"; // 메인 라우터 import
import RedisClient from "./config/data/redis";
import { setupLocalStrategy } from "./config/passport/stratrgy/local.Passport";
import { setupJwtStrategy } from "./config/passport/stratrgy/jwt.passport";
import AutoSuccessWrapperMiddleware from "./common/middlewares/AutoSuccessWrapper.Middleware";

class Server {
  private app: Application;
  private port: number | string; // 포트 변수 추가

  // 환경변수 초기화
  constructor() {
    this.port = process.env.PORT || 5000;

    this.app = express();
    this.initializeDatabase();
    this.initializePassportStrategy();
    this.initializeMiddleware();
    this.initializeController();
    this.initializeErrorHandler();
  }

  private initializeDatabase() {
    connectDB();
    RedisClient.getInstance().connect();
  }

  // passport 전략 초기화
  private initializePassportStrategy() {
    setupLocalStrategy(passport);
    setupJwtStrategy(passport);
  }

  // 미들웨어 초기화
  private initializeMiddleware() {
    this.app.use(
      cors({
        origin: (origin, cb) => {
          const allowedOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL_PREVIEW];

          if (!origin) {
            cb(null, true);
          }
          if (allowedOrigins.includes(origin)) {
            cb(null, true);
          } else {
            cb(new Error("CORS policy does not allow access from this origin"));
          }
        },
        credentials: true,
      })
    );
    this.app.use(morgan(process.env.NODE_ENV || "tiny"));
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(process.env.COOKIE_SECRET));
    this.app.use(passport.initialize());
    this.app.use(AutoSuccessWrapperMiddleware.wrap);
  }

  // 라우터 초기화
  private initializeController() {
    this.app.use(mainRouter); // 메인 라우터 연결
    this.app.use((req, res) => {
      res.status(404).json({
        message: "요청하신 페이지를 찾을 수 없습니다.",
      });
    });
  }

  // 에러 핸들러
  private initializeErrorHandler() {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.handle);
  }

  // 서버 시작 메서드
  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }
}

// 서버 인스턴스 생성 및 시작
const server = new Server();
server.listen();
