const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const { body, param, query } = require("express-validator");
const validationMiddleware = require("../middlewares/validationMiddleware");
const { imageUpload } = require("../utils/fileUpload");

// 모든 관리자 라우트에 isAdmin 미들웨어 적용
router.use(isAdmin);

/**
 * 대시보드 관련 라우트
 */

// GET /admin - 관리자 대시보드 페이지
router.get("/", asyncHandler(adminController.renderDashboard));

// GET /admin/dashboard - 대시보드 페이지 (리다이렉트)
router.get("/dashboard", (req, res) => res.redirect("/admin"));

/**
 * 통계 관련 라우트
 */

// GET /admin/stats - 통계 대시보드 페이지
router.get("/stats", asyncHandler(adminController.renderStatsDashboard));

/**
 * 사용자 관리 관련 라우트
 */

// GET /admin/users - 사용자 관리 페이지
router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderUserManagement)
);

// POST /admin/users/status - 사용자 상태 변경 API
router.post(
  "/users/status",
  [
    body("userId").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."),
    body("isActive").isBoolean().withMessage("활성화 상태는 true/false 값이어야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.updateUserStatus)
);

// POST /admin/users/role - 사용자 역할 변경 API
router.post(
  "/users/role",
  [
    body("userId").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."),
    body("role").isIn(["user", "admin"]).withMessage("역할은 'user' 또는 'admin'이어야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.updateUserRole)
);

// POST /admin/users/:id - 사용자 삭제 처리 (DELETE 메소드 시뮬레이션)
router.post(
  "/users/:id",
  [param("id").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."), validationMiddleware],
  asyncHandler(async (req, res) => {
    try {
      // 메소드 오버라이드 확인 (_method=DELETE)
      if (req.query._method !== "DELETE") {
        return res.status(405).send("Method Not Allowed");
      }

      const userId = req.params.id;

      // 자기 자신은 삭제할 수 없음
      if (userId === req.user._id.toString()) {
        req.flash("error", "자신의 계정은 삭제할 수 없습니다.");
        return res.redirect("/admin/users");
      }

      // 사용자 존재 여부 확인
      const User = require("../models/User");
      const user = await User.findById(userId);

      if (!user) {
        req.flash("error", "사용자를 찾을 수 없습니다.");
        return res.redirect("/admin/users");
      }

      // 사용자 삭제 처리
      await User.findByIdAndDelete(userId);

      req.flash("success", "사용자가 성공적으로 삭제되었습니다.");
      return res.redirect("/admin/users");
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      req.flash("error", error.message || "사용자 삭제 중 오류가 발생했습니다.");
      return res.redirect("/admin/users");
    }
  })
);

// DELETE /admin/users/:id - 사용자 삭제 API (REST API 지원)
router.delete(
  "/users/:id",
  [param("id").isMongoId().withMessage("유효하지 않은 사용자 ID입니다."), validationMiddleware],
  asyncHandler(async (req, res) => {
    try {
      const userId = req.params.id;

      // 자기 자신은 삭제할 수 없음
      if (userId === req.user._id.toString()) {
        return res.status(400).json({ error: "자신의 계정은 삭제할 수 없습니다." });
      }

      // 사용자 존재 여부 확인
      const User = require("../models/User");
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }

      // 사용자 삭제 처리
      await User.findByIdAndDelete(userId);

      return res.status(200).json({ success: true, message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
      console.error("사용자 삭제 오류:", error);
      return res.status(500).json({ error: error.message || "사용자 삭제 중 오류가 발생했습니다." });
    }
  })
);

/**
 * 게시물 관리 관련 라우트
 */

// GET /admin/posts - 게시물 관리 페이지
router.get(
  "/posts",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    query("status").optional().isIn(["all", "published", "draft"]).withMessage("유효하지 않은 상태 필터입니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderPostManagement)
);

// POST /admin/posts/:id/delete - 관리자 페이지에서 게시물 삭제 처리
router.post(
  "/posts/:id/delete",
  [param("id").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."), validationMiddleware],
  asyncHandler(async (req, res) => {
    try {
      const postId = req.params.id;

      // postController의 deletePost 함수를 직접 호출하는 대신
      // 게시물이 존재하는지 먼저 확인
      const post = await require("../models/Post").findById(postId);
      if (!post) {
        req.flash("error", "게시물을 찾을 수 없습니다.");
        return res.redirect("/admin/posts");
      }

      // 게시물 삭제 서비스 호출
      await require("../services/postService").deletePost(postId);

      req.flash("success", "게시물이 성공적으로 삭제되었습니다.");
      return res.redirect("/admin/posts");
    } catch (error) {
      req.flash("error", error.message || "게시물 삭제 중 오류가 발생했습니다.");
      return res.redirect("/admin/posts");
    }
  })
);

/**
 * 댓글 관리 관련 라우트
 */

// GET /admin/comments - 댓글 관리 페이지
router.get(
  "/comments",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("페이지 번호는 1 이상의 정수여야 합니다."),
    validationMiddleware,
  ],
  asyncHandler(adminController.renderCommentManagement)
);

// POST /admin/comments/:postId/:commentId/delete - 관리자 페이지에서 댓글 삭제 처리
router.post(
  "/comments/:postId/:commentId/delete",
  [
    param("postId").isMongoId().withMessage("유효하지 않은 게시물 ID입니다."),
    param("commentId").isMongoId().withMessage("유효하지 않은 댓글 ID입니다."),
    validationMiddleware,
  ],
  asyncHandler(async (req, res) => {
    try {
      const { postId, commentId } = req.params;

      // 게시물 및 댓글 존재 여부 확인
      const Post = require("../models/Post");
      const post = await Post.findById(postId);

      if (!post) {
        req.flash("error", "게시물을 찾을 수 없습니다.");
        return res.redirect("/admin/comments");
      }

      const comment = post.comments.id(commentId);
      if (!comment) {
        req.flash("error", "댓글을 찾을 수 없습니다.");
        return res.redirect("/admin/comments");
      }

      // 댓글 삭제 처리
      await require("../services/postService").deleteComment(postId, commentId);

      req.flash("success", "댓글이 성공적으로 삭제되었습니다.");
      return res.redirect("/admin/comments");
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      req.flash("error", error.message || "댓글 삭제 중 오류가 발생했습니다.");
      return res.redirect("/admin/comments");
    }
  })
);

/**
 * 설정 관련 라우트
 */

// GET /admin/settings - 블로그 설정 페이지
router.get("/settings", asyncHandler(adminController.renderSettings));

// POST /admin/settings - 설정 저장 처리
router.post("/settings", asyncHandler(adminController.saveSettings));

// POST /admin/settings/profile-image - 프로필 이미지 업로드 처리
router.post(
  "/settings/profile-image",
  imageUpload.single("profileImage"),
  asyncHandler(adminController.uploadProfileImage)
);

// POST /admin/settings/profile-image/delete - 프로필 이미지 삭제 처리
router.post("/settings/profile-image/delete", asyncHandler(adminController.deleteProfileImage));

/**
 * 콘텐츠 관리 관련 라우트
 */

// GET /admin/content - 콘텐츠 관리 페이지
router.get("/content", asyncHandler(adminController.renderContentManagement));

module.exports = router;
