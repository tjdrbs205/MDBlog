import { NextFunction, Request, Response } from "express";
import passport from "passport";

class AuthenticationMiddleware {
  public static jwtAuthorization(req: Request, res: Response, next: NextFunction) {
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

  public static isNotLoggedIn(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (user) {
      return res.status(401).json({
        message: "이미 로그인된 사용자입니다.",
      });
    }
    next();
  }

  public static isLoggedIn(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "인증되지 않은 사용자입니다.",
      });
    }
    next();
  }

  public static isAdmin(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "인증되지 않은 사용자입니다.",
      });
    }

    try {
      if (user.role !== "admin") {
        return res.status(401).json({
          message: "관리자 권한이 필요합니다.",
        });
      }
      next();
    } catch (error) {
      console.error("관리자 권한 확인 중 오류: ", error);
      return res.status(500).json({
        message: "서버 오류가 발생했습니다.",
      });
    }
  }
}

export default AuthenticationMiddleware;
