import { NextFunction, Request, Response } from "express";

class AsyncHandler {
  public static wrap(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      fn(req, res, next).catch(next);
    };
  }
}
export default AsyncHandler;
