import { NextFunction, Request, Response } from "express";

class AsyncHandler {
  static wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      fn(req, res, next).catch(next);
    };
  }
}

export { AsyncHandler };
