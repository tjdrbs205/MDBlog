/**
 * API 라우트
 * 이미지 업로드 등 API 기능 제공
 */
const express = require("express");
const router = express.Router();
const { imageUpload } = require("../utils/fileUpload");
const fileService = require("../services/fileService");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

/**
 * 게시물 내용에 삽입할 이미지 업로드 (기존 방식)
 * POST /api/upload/image
 */
router.post(
  "/upload/image",
  isAdmin,
  (req, res, next) => {
    // 파일 필드 이름에 따라 다른 핸들러로 라우팅
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data") && req.body && req.body.adapter === "ckeditor") {
      // CKEditor 5 이미지 업로드 요청은 두 번째 핸들러로 넘김
      return next("route");
    }

    console.log("[이미지 업로드 디버깅] 요청 헤더:", JSON.stringify(req.headers));
    console.log("[이미지 업로드 디버깅] Content-Type:", req.headers["content-type"]);
    next();
  },
  imageUpload.single("upload"),
  asyncHandler(async (req, res) => {
    try {
      console.log(
        "[이미지 업로드 디버깅] 파일 정보:",
        req.file
          ? {
              filename: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : "파일 없음"
      );

      if (!req.file) {
        console.error("[이미지 업로드 디버깅] 요청에 파일이 없습니다.");
        return res.status(400).json({
          uploaded: 0,
          error: { message: "이미지 파일이 필요합니다." },
        });
      }

      console.log("[이미지 업로드 디버깅] Cloudinary 업로드 시작");
      // Cloudinary에 이미지 업로드
      const result = await fileService.uploadImageToCloudinary(req.file.buffer, "blog/content");
      console.log("[이미지 업로드 디버깅] Cloudinary 업로드 결과:", {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        resource_type: result.resource_type,
      });

      // CKEditor에서 요구하는 응답 형식으로 반환
      res.json({
        uploaded: 1,
        fileName: result.public_id,
        url: result.secure_url,
      });
    } catch (error) {
      console.error("[이미지 업로드 디버깅] 오류 세부 정보:", error);
      console.error("[이미지 업로드 디버깅] 오류 스택:", error.stack);
      res.status(500).json({
        uploaded: 0,
        error: { message: "이미지 업로드 중 오류가 발생했습니다." },
      });
    }
  })
);

/**
 * CKEditor 5 이미지 업로드 어댑터용 엔드포인트
 * POST /api/upload/ckeditor - CKEditor 5 이미지 업로드 전용
 */
router.post(
  "/upload/ckeditor",
  isAdmin,
  imageUpload.single("image"),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "이미지 파일이 필요합니다.",
        });
      }

      // Cloudinary에 이미지 업로드
      const result = await fileService.uploadImageToCloudinary(req.file.buffer, "blog/content");

      // 이미지 업로드 어댑터에서 사용할 응답 형식
      res.json({
        url: result.secure_url,
        // 필요한 경우 추가 이미지 크기 제공
        // url500: result.secure_url.replace('/upload/', '/upload/w_500/'),
        // url1000: result.secure_url.replace('/upload/', '/upload/w_1000/'),
      });
    } catch (error) {
      console.error("[CKEditor 이미지 업로드] 오류:", error);
      res.status(500).json({
        error: "이미지 업로드 중 오류가 발생했습니다.",
      });
    }
  })
);

module.exports = router;
