const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const Setting = require("../models/Setting"); // Setting 모델 추가
const Post = require("../models/Post"); // Post 모델 추가
const Category = require("../models/Category"); // Category 모델 추가

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

    // 연락처 정보 가져오기
    const contactEmail = await Setting.getSetting("contactEmail", "contact@mdblog.com");
    const contactGithub = await Setting.getSetting("contactGithub", "github.com/mdblog");
    const contactTwitter = await Setting.getSetting("contactTwitter", "mdblog");

    res.render("layouts/main", {
      title: "사이트 설정",
      contentView: "admin/settings",
      settings,
      siteDescription,
      aboutBlog,
      contactEmail,
      contactGithub,
      contactTwitter,
    });
  })
);

// POST /admin/settings - 사이트 설정 업데이트
router.post(
  "/settings",
  asyncHandler(async (req, res) => {
    const { siteDescription, aboutBlog, contactEmail, contactGithub, contactTwitter } = req.body;

    // 사이트 설명 업데이트
    await Setting.updateSetting("siteDescription", siteDescription, "사이트 푸터에 표시되는 설명 텍스트");

    // 블로그 소개글 업데이트
    await Setting.updateSetting("aboutBlog", aboutBlog, "블로그 소개 페이지에 표시되는 소개글 텍스트");

    // 연락처 정보 업데이트
    await Setting.updateSetting("contactEmail", contactEmail, "연락 이메일 주소");
    await Setting.updateSetting("contactGithub", contactGithub, "GitHub 사용자명 또는 URL");
    await Setting.updateSetting("contactTwitter", contactTwitter, "Twitter 사용자명");

    req.flash("success", "사이트 설정이 업데이트되었습니다.");
    res.redirect("/admin/settings");
  })
);

// GET /admin/posts - 관리자용 게시물 관리 페이지
router.get(
  "/posts",
  asyncHandler(async (req, res) => {
    try {
      // 페이지네이션 및 필터링 설정
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // 정렬 옵션
      const sortField = req.query.sort || "createdAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;
      const sortOptions = {};
      sortOptions[sortField] = sortOrder;

      // 검색어 설정
      const searchQuery = {};
      if (req.query.search) {
        searchQuery.title = { $regex: req.query.search, $options: "i" };
      }

      // 카테고리 필터
      if (req.query.category) {
        searchQuery.category = req.query.category;
      }

      // 상태 필터
      if (req.query.status) {
        searchQuery.status = req.query.status;
      }

      // 게시물 및 전체 개수 조회
      const [posts, totalPosts, categories] = await Promise.all([
        Post.find(searchQuery)
          .populate("author", "username")
          .populate("category", "name")
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Post.countDocuments(searchQuery),
        Category.find().sort({ name: 1 }),
      ]);

      // 페이지네이션 정보 계산
      const totalPages = Math.ceil(totalPosts / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.render("layouts/main", {
        title: "게시물 관리",
        contentView: "admin/posts",
        posts,
        categories,
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage,
        hasPrevPage,
        searchQuery: req.query.search || "",
        selectedCategory: req.query.category || "",
        selectedStatus: req.query.status || "",
        sortField,
        sortOrder: req.query.order || "desc",
      });
    } catch (error) {
      console.error("게시물 관리 페이지 로드 중 오류:", error);
      req.flash("error", "게시물 목록을 불러오는 중 오류가 발생했습니다.");
      res.redirect("/admin");
    }
  })
);

// GET /admin/comments - 관리자용 댓글 관리 페이지
router.get(
  "/comments",
  asyncHandler(async (req, res) => {
    try {
      // 페이지네이션 및 필터링 설정
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      const skip = (page - 1) * limit;

      // 정렬 옵션
      const sortField = req.query.sort || "createdAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;
      const sortOptions = {};
      sortOptions[sortField] = sortOrder;

      // 검색어 설정
      const searchQuery = {};
      if (req.query.search) {
        searchQuery.content = { $regex: req.query.search, $options: "i" };
      }

      // 게시물별 필터
      if (req.query.post) {
        searchQuery["post"] = req.query.post;
      }

      // 모든 게시물 찾기 (댓글이 있는)
      const posts = await Post.find({ "comments.0": { $exists: true } })
        .select("title _id")
        .sort({ title: 1 });

      // 모든 댓글 가져오기 (중첩된 댓글 배열을 펼쳐서)
      let allComments = [];
      const postsWithComments = await Post.find(searchQuery)
        .populate({
          path: "comments.author",
          select: "username email",
        })
        .sort(sortOptions);

      // 모든 게시물에서 댓글 추출 및 게시물 정보 추가
      postsWithComments.forEach((post) => {
        const commentsWithPostInfo = post.comments.map((comment) => {
          // 댓글 객체를 변경 가능한 일반 객체로 변환
          const commentObj = comment.toObject();
          // 게시물 정보 추가
          commentObj.postTitle = post.title;
          commentObj.postId = post._id;
          return commentObj;
        });
        allComments = allComments.concat(commentsWithPostInfo);
      });

      // 검색어 필터링 (MongoDB 쿼리로 처리할 수 없는 중첩 배열 내 검색)
      if (req.query.search) {
        allComments = allComments.filter((comment) =>
          comment.content.toLowerCase().includes(req.query.search.toLowerCase())
        );
      }

      // 게시물별 필터링
      if (req.query.post) {
        allComments = allComments.filter((comment) => comment.postId.toString() === req.query.post);
      }

      // 정렬
      allComments.sort((a, b) => {
        if (sortField === "createdAt") {
          return sortOrder === 1
            ? new Date(a.createdAt) - new Date(b.createdAt)
            : new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });

      // 페이지네이션을 위한 댓글 총 개수
      const totalComments = allComments.length;

      // 페이지네이션 적용
      const paginatedComments = allComments.slice(skip, skip + limit);

      // 페이지네이션 정보 계산
      const totalPages = Math.ceil(totalComments / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.render("layouts/main", {
        title: "댓글 관리",
        contentView: "admin/comments",
        comments: paginatedComments,
        posts,
        currentPage: page,
        totalPages,
        totalComments,
        hasNextPage,
        hasPrevPage,
        searchQuery: req.query.search || "",
        selectedPost: req.query.post || "",
        sortField,
        sortOrder: req.query.order || "desc",
      });
    } catch (error) {
      console.error("댓글 관리 페이지 로드 중 오류:", error);
      req.flash("error", "댓글 목록을 불러오는 중 오류가 발생했습니다.");
      res.redirect("/admin");
    }
  })
);

// POST /admin/comments/:commentId/delete - 댓글 삭제
router.post(
  "/comments/:postId/:commentId/delete",
  asyncHandler(async (req, res) => {
    try {
      const { postId, commentId } = req.params;

      // 게시물 찾기
      const post = await Post.findById(postId);

      if (!post) {
        req.flash("error", "게시물을 찾을 수 없습니다.");
        return res.redirect("/admin/comments");
      }

      // 댓글 배열에서 해당 댓글 제거
      post.comments = post.comments.filter((comment) => comment._id.toString() !== commentId);

      // 변경사항 저장
      await post.save();

      req.flash("success", "댓글이 성공적으로 삭제되었습니다.");
      res.redirect("/admin/comments");
    } catch (error) {
      console.error("댓글 삭제 중 오류:", error);
      req.flash("error", "댓글을 삭제하는 중 오류가 발생했습니다.");
      res.redirect("/admin/comments");
    }
  })
);

module.exports = router;
