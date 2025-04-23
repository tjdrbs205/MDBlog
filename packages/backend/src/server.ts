import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { ErrorMiddleware } from "./common/middlewares/ErrorMiddleware";
import mainRouter from "./routes/index"; // 메인 라우터 import

class Server {
  private app: Application;
  private port: number | string; // 포트 변수 추가

  // 환경변수 초기화
  constructor() {
    dotenv.config();
    this.port = process.env.PORT || 5000; // 포트 설정

    this.app = express();
    this.initializeDatabase();
    this.initializeMiddleware();
    this.initializeController();
    this.initializeErrorHandler();
  }

  private initializeDatabase() {
    connectDB();
  }

  private initializeErrorHandler() {
    this.app.use(ErrorMiddleware.notFound);
    this.app.use(ErrorMiddleware.handle);
  }

  // 미들웨어 초기화
  private initializeMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  // 라우터 초기화
  private initializeController() {
    this.app.use(mainRouter); // 메인 라우터 연결
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
