import { NextFunction, Request, Response } from "express";
import passport from "passport";

class AuthenticationMiddleware {
  static jwtAuthorization(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("jwt", { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error("JWT 인증 처리 오류: ", err);
        return next(err);
      }
      if (!user) {
        console.error("JWT 인증 실패: ", info.message);
        return res.status(401).json({
          message: "인증되지 않은 사용자입니다.",
        });
      }
      req.user = user;
      return next();
    })(req, res, next);
  }
}

export default AuthenticationMiddleware;
