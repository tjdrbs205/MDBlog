import { NextFunction, Request, Response } from "express";
import { UserService } from "./user.service";

import passport from "passport";
import jwt from "jsonwebtoken";

class UserController {
  private readonly userService: UserService;
  constructor() {
    this.userService = UserService.getInstance();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        console.error("로그인 처리 오류: ", err);
        return next(err);
      }

      if (!user) {
        console.log("로그인 실패: ", info.message);

        const genericErrorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";

        return res.status(401).json({
          error: genericErrorMessage,
        });
      }

      req.logIn(user, { session: false }, (err) => {
        if (err) {
          console.error("로그인 처리 오류: ", err);
          res.status(500).json({
            error: err.message,
            message: "로그인 처리 중 오류가 발생했습니다.",
          });
        }

        const token = jwt.sign({ idx: user.idx }, process.env.JWT_SECRET as string);

        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1시간
          sameSite: "lax",
        });

        return res.status(201).json({
          user,
        });
      });
    })(req, res, next);
  };
}
