const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const { isLoggedIn } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const csrf = require("csurf");
const { imageUpload, bufferToStream } = require("../utils/fileUpload"); // 파일 업로드 유틸리티 추가

// CSRF 보호 미들웨어 설정
const csrfProtection = csrf({ cookie: true });

// 회원가입 관련 라우트
router.get("/register", authController.renderRegisterForm);
router.post("/register", asyncHandler(authController.register));

// 로그인 관련 라우트
router.get("/login", authController.renderLoginForm);
router.post("/login", asyncHandler(authController.login));
router.get("/logout", authController.logout);

// 프로필 관련 라우트 (로그인 필요)
router.get("/profile", isLoggedIn, asyncHandler(authController.renderProfile));
router.post("/profile", isLoggedIn, asyncHandler(authController.updateProfile));

// 프로필 이미지 업로드 라우트
router.post(
  "/profile/image",
  isLoggedIn,
  imageUpload.single("profileImage"),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error", "이미지를 선택해주세요.");
        return res.redirect("/auth/profile");
      }

      // Cloudinary에 이미지 업로드
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "user-profile-images",
            transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        bufferToStream(req.file.buffer).pipe(uploadStream);
      });

      // 이전 프로필 이미지가 Cloudinary 이미지인 경우 삭제
      const prevProfileImage = req.user.profileImage;
      if (prevProfileImage && prevProfileImage.includes("cloudinary.com")) {
        const urlParts = prevProfileImage.split("/");
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicId = `user-profile-images/${filenameWithExtension.split(".")[0]}`;

        // 이전 이미지 삭제 시도 (실패해도 진행)
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("이전 프로필 이미지 삭제 실패:", deleteError);
        }
      }

      // 사용자 프로필 이미지 URL 업데이트
      await User.findByIdAndUpdate(req.user._id, {
        profileImage: result.secure_url,
      });

      req.flash("success", "프로필 이미지가 성공적으로 업로드되었습니다.");
      res.redirect("/auth/profile");
    } catch (error) {
      console.error("프로필 이미지 업로드 중 오류:", error);
      req.flash("error", "이미지 업로드 중 오류가 발생했습니다.");
      res.redirect("/auth/profile");
    }
  })
);

// 프로필 이미지 삭제 라우트
router.get(
  "/profile/image/delete",
  isLoggedIn,
  csrfProtection,
  asyncHandler(async (req, res) => {
    try {
      const currentUser = await User.findById(req.user._id);
      const currentProfileImage = currentUser.profileImage;

      // Cloudinary에 저장된 이미지인 경우 삭제
      if (currentProfileImage && currentProfileImage.includes("cloudinary.com")) {
        const urlParts = currentProfileImage.split("/");
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicId = `user-profile-images/${filenameWithExtension.split(".")[0]}`;

        // Cloudinary에서 이미지 삭제
        await cloudinary.uploader.destroy(publicId);
      }

      // DB에서 사용자 프로필 이미지를 기본 이미지로 재설정
      await User.findByIdAndUpdate(req.user._id, {
        profileImage: "/images/default-profile.png",
      });

      req.flash("success", "프로필 이미지가 성공적으로 삭제되었습니다.");
      res.redirect("/auth/profile");
    } catch (error) {
      console.error("프로필 이미지 삭제 중 오류:", error);
      req.flash("error", "이미지 삭제 중 오류가 발생했습니다.");
      res.redirect("/auth/profile");
    }
  })
);

// 비밀번호 변경 라우트 (로그인 필요)
router.get("/change-password", isLoggedIn, authController.renderChangePasswordForm);
router.post("/change-password", isLoggedIn, asyncHandler(authController.changePassword));

module.exports = router;
