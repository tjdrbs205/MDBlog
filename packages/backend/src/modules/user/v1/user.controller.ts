import { NextFunction, Request, Response } from "express";
import passport from "passport";

import UserService from "./user.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
} from "../../../config/passport/jwt/jwt.service";
import { TPayload } from "../../../config/passport/jwt/jwt.payload";
import RedisClient from "../../../config/data/redis";
import {
  deleteUserProfileImage,
  uploadUserProfileImage,
} from "../../../common/utils/cloudinary.util";

class UserController {
  private readonly userService: UserService;
  private readonly redisClient: RedisClient;
  constructor() {
    this.redisClient = RedisClient.getInstance();
    this.userService = UserService.getInstance();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", { session: false }, async (err: any, user: any, info: any) => {
      if (err) {
        console.error("로그인 처리 오류: ", err, user);
        return next(err);
      }

      if (!user) {
        console.error("로그인 실패: ", info.message);
        return res.status(401).json({
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        });
      }

      const userPayload: TPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        aud: process.env.JWT_AUDIENCE || "default_audience",
        iss: process.env.JWT_ISSUER || "default_issuer",
      };

      try {
        const refreshToken = await generateRefreshToken(userPayload);
        const accessToken = await generateAccessToken(userPayload);

        this.redisClient.set(user.id, refreshToken);

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod",
          sameSite: "strict",
        });

        return res.status(201).json({
          accessToken,
        });
      } catch (error) {
        console.error("토큰 생성 오류: ", error);
        return res.status(500).json({
          message: "로그인 처리 중 오류가 발생했습니다.",
        });
      }
    })(req, res, next);
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) return res.status(204);
    try {
      const isToken = await verifyRefreshToken(refreshToken);
      if (!isToken) {
        return res.status(203);
      }

      const user = await decodeToken(refreshToken);
      this.redisClient.del(user.id);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "prod",
        sameSite: "strict",
      });

      res.status(200).json({
        message: "로그아웃",
      });
    } catch (error) {
      console.error("로그아웃 처리 오류: ", error);
      return res.status(500).json({
        message: "로그아웃 처리 중 오류가 발생했습니다.",
      });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) {
      return res.status(204).json({
        message: "리프레시 토큰이 없습니다.",
      });
    }
    try {
      const isToken = await verifyRefreshToken(refreshToken);
      if (!isToken) {
        return res.status(403).json({
          message: "리프레시 토큰이 유효하지 않습니다.",
        });
      }

      const user = await decodeToken(refreshToken);
      const redisToken = await this.redisClient.get(user.id);

      if (redisToken !== refreshToken) {
        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "prod",
          sameSite: "strict",
        });

        return res.status(403).json({
          message: "리프레시 토큰이 유효하지 않습니다.",
        });
      }

      const userPayload: TPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        aud: process.env.JWT_AUDIENCE || "default_audience",
        iss: process.env.JWT_ISSUER || "default_issuer",
      };

      // const newRefreshToken = await generateRefreshToken(userPayload);
      // this.redisClient.set(user.id, newRefreshToken);
      // res.cookie("refreshToken", newRefreshToken, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "prod",
      //   sameSite: "strict",
      // });

      const newAccessToken = await generateAccessToken(userPayload);

      res.status(200).json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error("리프레시 토큰 처리 오류: ", error);
      return res.status(500).json({
        message: "리프레시 토큰 처리 중 오류가 발생했습니다.",
      });
    }
  };

  register = async (req: Request, res: Response) => {
    const { username, email, password, passwordConfirm } = req.body;
    if (password !== passwordConfirm) {
      return res.status(400).json({
        message: "두 비밀번호가 일치하지 않습니다.",
        user: { username, email },
      });
    }
    try {
      await this.userService.registerUser(username, email, password);

      return res.status(201).json({
        message: "회원가입 성공",
      });
    } catch (error) {
      console.error("회원가입 처리 오류: ", error);

      return res.status(400).json({
        message: (error as Error)?.message.toString(),
      });
    }
  };

  getUser = async (req: Request, res: Response) => {
    const user = req.user;
    try {
      if (!user) {
        return res.status(400).json({
          message: "사용자를 찾을 수 없습니다.",
        });
      }
      res.status(200).json({
        ...user,
      });
    } catch (error) {
      res.status(500).json({
        message: "사용자 정보를 가져오는 중 오류가 발생했습니다.",
      });
    }
  };

  getProfileImage = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        message: "사용자 정보가 없습니다.",
      });
    }

    res.status(200).json({
      user: {
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const { username, bio, currentProfileImage } = req.body;
      const profileImage = req.file?.buffer;
      const user = req.user;
      if (!user) {
        return res.status(400).json({
          message: "사용자 정보가 없습니다.",
        });
      }

      if (profileImage) await uploadUserProfileImage(user.id, profileImage);
      if (currentProfileImage !== user.profileImage) {
        await deleteUserProfileImage(user.id);
      }
      const updatedUser = await this.userService.updateUserProfile(user.id, username, bio);
      const redisKey = `user:${user.id}`;
      this.redisClient.set(redisKey, JSON.stringify(updatedUser));

      return res.status(200).json({
        message: "프로필 업데이트 성공",
        user: updatedUser,
      });
    } catch (error) {
      console.error("프로필 업데이트 중 오류", error);
      return res.status(400).json({
        message: "프로필 업데이트 중 오류가 발생했습니다.",
      });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    try {
      await this.userService.changeUserPassword(currentPassword, newPassword, confirmPassword);

      return res.status(200).json({
        message: "비밀번호 변경 성공",
      });
    } catch (error) {
      console.error("비밀번호 변경 중 오류", error);
      return res.status(400).json({
        message: error,
      });
    }
  };

  uploadProfileImage = async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        message: "업로드할 이미지를 선택해주세요",
      });
    }
    try {
      await uploadUserProfileImage(req.user!.id, req.file.buffer);

      res.status(200).json({
        message: "프로필 이미지 업로드 성공",
      });
    } catch (error) {
      console.error("프로필 이미지 업로드 중 오류", error);
      res.status(400).json({
        message: "프로필 이미지 업로드 중 오류가 발생했습니다.",
      });
    }
  };

  deleteProfileImage = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(400).json({
        message: "사용자 정보가 없습니다.",
      });
    }
    try {
      await deleteUserProfileImage(req.user.id);

      res.status(200).json({
        message: "프로필 이미지 삭제 성공",
      });
    } catch (error) {
      res.status(400).json({
        message: "프로필 이미지 삭제 중 오류가 발생했습니다.",
      });
    }
  };
}

export default UserController;
