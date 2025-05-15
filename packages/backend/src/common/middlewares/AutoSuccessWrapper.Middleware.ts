import { NextFunction, Request, Response } from "express";

class AutoSuccessWrapperMiddleware {
  static async wrap(req: Request, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      const status = res.statusCode;
      const isSiccess = status >= 200 && status < 300;
      const wrapped = {
        success: isSiccess,
        body,
      };
      return originalJson.call(this, wrapped);
    };
    next();
  }
}

export default AutoSuccessWrapperMiddleware;
