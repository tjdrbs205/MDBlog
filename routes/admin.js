const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csrf = require("csurf");
const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const adminController = require("../controller/adminController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const asyncHandler = require("../middlewares/asyncHandler");
const Setting = require("../models/Setting"); // Setting 모델 추가
const Post = require("../models/Post"); // Post 모델 추가
const Category = require("../models/Category"); // Category 모델 추가

// CSRF 보호 미들웨어 설정
const csrfProtection = csrf({ cookie: true });

// 메모리 저장소 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("이미지 파일만 업로드할 수 있습니다."), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

// 버퍼를 스트림으로 변환하는 유틸리티 함수
function bufferToStream(buffer) {
  const readable = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
  return readable;
}

// 모든 관리자 라우트에 로그인 및 관리자 권한 확인 미들웨어 적용
router.use(isLoggedIn, isAdmin);

// 기본 관리자 라우트들에는 CSRF 보호 적용
router.get("/", csrfProtection, asyncHandler(adminController.dashboard));
router.get("/users", csrfProtection, asyncHandler(adminController.listUsers));
router.post("/users/role", csrfProtection, asyncHandler(adminController.changeUserRole));
router.get("/content", csrfProtection, asyncHandler(adminController.contentManagement));
router.get("/stats", csrfProtection, asyncHandler(adminController.stats));
router.get("/stats/chart-data", csrfProtection, asyncHandler(adminController.getChartData));
router.get("/stats/active-visitors", csrfProtection, asyncHandler(adminController.getActiveVisitors));

// GET /admin/settings - 사이트 설정 페이지
router.get(
  "/settings",
  csrfProtection,
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

    // 프로필 이미지 가져오기
    const profileImage = await Setting.getSetting("profileImage", "/uploads/profile/default-profile.png");

    res.render("layouts/main", {
      title: "사이트 설정",
      contentView: "admin/settings",
      settings,
      siteDescription,
      aboutBlog,
      contactEmail,
      contactGithub,
      profileImage,
    });
  })
);

// POST /admin/settings - 사이트 설정 업데이트
router.post(
  "/settings",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { siteDescription, aboutBlog, contactEmail, contactGithub } = req.body;

    // 사이트 설명 업데이트
    await Setting.updateSetting("siteDescription", siteDescription, "사이트 푸터에 표시되는 설명 텍스트");

    // 블로그 소개글 업데이트
    await Setting.updateSetting("aboutBlog", aboutBlog, "블로그 소개 페이지에 표시되는 소개글 텍스트");

    // 연락처 정보 업데이트
    await Setting.updateSetting("contactEmail", contactEmail, "연락 이메일 주소");
    await Setting.updateSetting("contactGithub", contactGithub, "GitHub 사용자명 또는 URL");

    req.flash("success", "사이트 설정이 업데이트되었습니다.");
    res.redirect("/admin/settings");
  })
);

// 프로필 이미지 업로드 라우트
router.post(
  "/settings/profile-image",
  upload.single("profileImage"),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        req.flash("error", "이미지를 선택해주세요.");
        return res.redirect("/admin/settings");
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "profile-images",
            transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        bufferToStream(req.file.buffer).pipe(uploadStream);
      });

      const prevImagePath = await Setting.getSetting("profileImage", "");

      if (prevImagePath && prevImagePath.includes("cloudinary.com")) {
        const urlParts = prevImagePath.split("/");
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicId = `profile-images/${filenameWithExtension.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      }

      await Setting.updateSetting("profileImage", result.secure_url, "블로그 소개 페이지에 표시되는 프로필 이미지");

      req.flash("success", "프로필 이미지가 성공적으로 업로드되었습니다.");
      res.redirect("/admin/settings");
    } catch (error) {
      console.error("프로필 이미지 업로드 중 오류:", error);
      req.flash("error", "이미지 업로드 중 오류가 발생했습니다.");
      res.redirect("/admin/settings");
    }
  })
);

// 프로필 이미지 삭제 라우트
router.get(
  "/settings/profile-image/delete",
  csrfProtection,
  asyncHandler(async (req, res) => {
    try {
      // 현재 프로필 이미지 경로 가져오기
      const currentProfileImage = await Setting.getSetting("profileImage", "");

      // Cloudinary에 저장된 이미지인 경우 삭제
      if (currentProfileImage && currentProfileImage.includes("cloudinary.com")) {
        // Cloudinary 이미지 URL에서 public_id 추출
        const urlParts = currentProfileImage.split("/");
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicId = `profile-images/${filenameWithExtension.split(".")[0]}`;

        // Cloudinary에서 이미지 삭제
        await cloudinary.uploader.destroy(publicId);
      }

      // DB 설정 기본 이미지로 재설정
      await Setting.updateSetting(
        "profileImage",
        "/images/default-profile.png",
        "블로그 소개 페이지에 표시되는 프로필 이미지"
      );

      req.flash("success", "프로필 이미지가 성공적으로 삭제되었습니다.");
      res.redirect("/admin/settings");
    } catch (error) {
      console.error("프로필 이미지 삭제 중 오류:", error);
      req.flash("error", "이미지 삭제 중 오류가 발생했습니다.");
      res.redirect("/admin/settings");
    }
  })
);

// 게시물 이미지 업로드 라우트
router.post(
  "/posts/upload-image",
  upload.single("postImage"),
  asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "이미지를 선택해주세요." });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "post-images",
            transformation: [{ width: 800, height: 600, crop: "limit" }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        bufferToStream(req.file.buffer).pipe(uploadStream);
      });

      res.status(200).json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error("게시물 이미지 업로드 중 오류:", error);
      res.status(500).json({ error: "이미지 업로드 중 오류가 발생했습니다." });
    }
  })
);

// GET /admin/posts - 관리자용 게시물 관리 페이지
router.get(
  "/posts",
  csrfProtection,
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
  csrfProtection,
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
  csrfProtection,
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
