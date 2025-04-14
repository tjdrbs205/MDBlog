const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const Setting = require("../models/Setting"); // Setting 모델 추가

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

// GET /admin/settings - 사이트 설정 페이지
router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    // 현재 저장된 모든 설정 가져오기
    const settings = await Setting.find().sort({ key: 1 });

    // 특정 설정 가져오기
    const siteDescription = await Setting.getSetting(
      "siteDescription",
      "MongoDB와 Express.js를 사용한 현대적인 블로그 시스템입니다. 마크다운을 지원하고 태그와 카테고리로 콘텐츠를 관리할 수 있습니다."
    );

    // 블로그 소개글 가져오기
    const aboutBlog = await Setting.getSetting(
      "aboutBlog",
      "## 안녕하세요! MDBlog에 오신 것을 환영합니다.\n\n이 블로그는 MongoDB와 Express.js를 사용하여 개발된 현대적인 블로그 시스템입니다. 개발 관련 지식과 경험을 공유하기 위한 공간입니다.\n\n### 주요 기능\n\n- 마크다운 지원으로 쉽고 빠른 글 작성\n- 카테고리와 태그를 활용한 콘텐츠 관리\n- 반응형 디자인으로 모바일 환경 지원\n\n더 많은 정보는 블로그 글을 통해 확인하세요!"
    );

    res.render("layouts/main", {
      title: "사이트 설정",
      contentView: "admin/settings",
      settings,
      siteDescription,
      aboutBlog,
    });
  })
);

// POST /admin/settings - 사이트 설정 업데이트
router.post(
  "/settings",
  asyncHandler(async (req, res) => {
    const { siteDescription, aboutBlog } = req.body;

    // 사이트 설명 업데이트
    await Setting.updateSetting("siteDescription", siteDescription, "사이트 푸터에 표시되는 설명 텍스트");

    // 블로그 소개글 업데이트
    await Setting.updateSetting("aboutBlog", aboutBlog, "블로그 소개 페이지에 표시되는 소개글 텍스트");

    req.flash("success", "사이트 설정이 업데이트되었습니다.");
    res.redirect("/admin/settings");
  })
);

module.exports = router;
