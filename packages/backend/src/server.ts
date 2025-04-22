import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/database";
import { ErrorMiddleware } from "./common/middlewares/ErrorMiddleware";

class Server {
  private app: Application;

  // 환경변수 초기화
  constructor() {
    dotenv.config();

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

    //사용자 정의 미들웨어
    this.app.use();
  }

  // 라우터 초기화
  private initializeController() {}
}
