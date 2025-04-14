const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");

// 모든 관리자 라우트에 로그인 및 관리자 권한 확인 미들웨어 적용
router.use(isLoggedIn, isAdmin);

// GET /admin - 관리자 대시보드
router.get("/", asyncHandler(adminController.dashboard));

// GET /admin/users - 사용자 목록 페이지 (관리자용)
router.get("/users", asyncHandler(adminController.listUsers));

// POST /admin/users/role - 사용자 역할 변경 (관리자용)
router.post("/users/role", asyncHandler(adminController.changeUserRole));

// GET /admin/content - 통합 콘텐츠 관리 페이지 (카테고리, 태그, 메뉴)
router.get("/content", asyncHandler(adminController.contentManagement));

// GET /admin/stats - 통계 대시보드 페이지
router.get("/stats", asyncHandler(adminController.stats));

// GET /admin/stats/chart-data - 통계 API 엔드포인트 (차트 데이터)
router.get("/stats/chart-data", asyncHandler(adminController.getChartData));

// GET /admin/stats/active-visitors - 통계 API 엔드포인트 (활성 방문자)
router.get("/stats/active-visitors", asyncHandler(adminController.getActiveVisitors));

module.exports = router;
