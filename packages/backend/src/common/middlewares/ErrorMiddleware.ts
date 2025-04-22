import { AppError } from "@mdblog/shared/src/utils/errors/AppError";
import { NextFunction, Request, Response } from "express";

class ErrorMiddleware {
  static handle(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        status: "error",
        message: err.message,
        ...(err.hasOwnProperty("errors") && { errors: (err as any).errors }),
      });
    }
    console.error("예상치 못한 에러:", err);
    return res.status(500).json({
      status: "error",
      message: "서버에 오류가 발생했습니다.",
    });
  }

  static notFound(req: Request, res: Response, next: NextFunction) {
    next(new AppError(`${req.originalUrl} 경로를 찾을 수 없습니다.`, 404));
  }
}

export { ErrorMiddleware };
