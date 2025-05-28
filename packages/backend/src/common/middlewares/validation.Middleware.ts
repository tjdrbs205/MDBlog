import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class ValidationMiddleware {
  static async validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors:", errors.array());
      return res.status(400).json({
        message: errors.array(),
      });
    }
    next();
  }
}

export default ValidationMiddleware;
