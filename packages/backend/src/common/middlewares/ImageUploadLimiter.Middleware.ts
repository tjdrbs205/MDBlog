import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

class imageUploadLimiter {
  static rateLimit = (
    time: number,
    maxCount: number,
    message: string = "게시글 업로드가 너무 잦습니다. 잠시 후 다시 시도해주세요."
  ) => {
    return rateLimit({
      windowMs: time * 60 * 1000,
      max: maxCount,
      keyGenerator: (req: Request, res: Response) => {
        return req.user!.id;
      },
      message: message,
    });
  };
}

export default imageUploadLimiter;
