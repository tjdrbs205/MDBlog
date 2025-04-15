/**
 * Admin Controller
 * 관리자 기능 관련 요청을 처리하는 컨트롤러
 */
const adminService = require("../services/adminService");
const postService = require("../services/postService");
const categoryService = require("../services/categoryService");
const tagService = require("../services/tagService");

/**
 * 대시보드 페이지 렌더링
 */
exports.renderDashboard = async (req, res) => {
  try {
    // 대시보드 통계 데이터 조회
    const stats = await adminService.getDashboardStats();

    res.render("admin/dashboard", {
      title: "관리자 대시보드",
      stats,
      activeMenu: "dashboard",
    });
  } catch (error) {
    req.flash("error", error.message || "대시보드를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 통계 대시보드 페이지 렌더링
 */
exports.renderStatsDashboard = async (req, res) => {
  try {
    // 방문자 통계 데이터 조회
    const visitorStats = await adminService.getVisitorStats();

    // 콘텐츠 통계 데이터 조회
    const contentStats = await adminService.getContentStats();

    res.render("admin/stats/dashboard", {
      title: "통계 대시보드",
      visitorStats,
      contentStats,
      activeMenu: "stats",
    });
  } catch (error) {
    req.flash("error", error.message || "통계 데이터를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 사용자 관리 페이지 렌더링
 */
exports.renderUserManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    // 서비스 호출
    const { users, totalUsers, pagination } = await adminService.getUsersWithPagination({
      page,
      limit,
    });

    res.render("admin/users", {
      title: "사용자 관리",
      users,
      totalUsers,
      pagination,
      activeMenu: "users",
    });
  } catch (error) {
    req.flash("error", error.message || "사용자 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 사용자 상태 변경 처리
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId, isActive } = req.body;

    // 유효성 검사
    if (!userId) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    // 자기 자신의 상태는 변경 불가
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "자신의 상태는 변경할 수 없습니다." });
    }

    // 서비스 호출
    const user = await adminService.updateUserStatus(userId, isActive === "true");

    res.json({ success: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "사용자 상태 변경 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 사용자 역할 변경 처리
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // 유효성 검사
    if (!userId) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    // 자기 자신의 역할은 변경 불가
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "자신의 역할은 변경할 수 없습니다." });
    }

    // 서비스 호출
    const user = await adminService.updateUserRole(userId, role);

    res.json({ success: true, user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "사용자 역할 변경 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 게시물 관리 페이지 렌더링
 */
exports.renderPostManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const status = req.query.status;

    // 필터 설정
    let filter = {};
    if (status === "published") {
      filter.isPublic = true;
    } else if (status === "draft") {
      filter.isPublic = false;
    }

    // 서비스 호출
    const { posts, totalPosts, pagination } = await adminService.getPostsWithPagination({
      page,
      limit,
      filter,
    });

    // 카테고리 및 태그 목록 조회
    const [categories, tags] = await Promise.all([categoryService.getAllCategories(), tagService.getAllTags()]);

    res.render("admin/posts", {
      title: "게시물 관리",
      posts,
      totalPosts,
      pagination,
      categories,
      tags,
      status,
      activeMenu: "posts",
    });
  } catch (error) {
    req.flash("error", error.message || "게시물 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 댓글 관리 페이지 렌더링
 */
exports.renderCommentManagement = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    // 최근 댓글이 있는 게시물 조회
    const posts = await Post.find({ "comments.0": { $exists: true } })
      .populate("author", "username")
      .populate({
        path: "comments.author",
        select: "username profileImage",
      })
      .sort({ "comments.createdAt": -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // 전체 댓글 수 조회
    const commentsCountResult = await Post.aggregate([
      { $project: { commentCount: { $size: "$comments" } } },
      { $group: { _id: null, total: { $sum: "$commentCount" } } },
    ]);

    const totalComments = commentsCountResult.length > 0 ? commentsCountResult[0].total : 0;
    const totalPages = Math.ceil(totalComments / limit);

    res.render("admin/comments", {
      title: "댓글 관리",
      posts,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      activeMenu: "comments",
    });
  } catch (error) {
    req.flash("error", error.message || "댓글 목록을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 설정 페이지 렌더링
 */
exports.renderSettings = async (req, res) => {
  try {
    // 현재 설정 조회
    const settings = await Setting.find().sort({ key: 1 });

    // 설정을 키-값 맵으로 변환
    const settingsMap = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    res.render("admin/settings", {
      title: "블로그 설정",
      settings: settingsMap,
      activeMenu: "settings",
    });
  } catch (error) {
    req.flash("error", error.message || "설정을 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 설정 저장 처리
 */
exports.saveSettings = async (req, res) => {
  try {
    const settings = req.body;

    // 설정 항목 순회하며 저장/업데이트
    for (const [key, value] of Object.entries(settings)) {
      await Setting.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
    }

    req.flash("success", "설정이 성공적으로 저장되었습니다.");
    res.redirect("/admin/settings");
  } catch (error) {
    req.flash("error", error.message || "설정 저장 중 오류가 발생했습니다.");
    res.redirect("/admin/settings");
  }
};

/**
 * 콘텐츠 관리 페이지 렌더링
 */
exports.renderContentManagement = async (req, res) => {
  try {
    // 카테고리, 태그 등 컨텐츠 관련 데이터 조회
    const [categories, tags, postsByCategory, postsByTag] = await Promise.all([
      categoryService.getAllCategories(),
      tagService.getAllTags(),
      Post.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Post.aggregate([{ $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }]),
    ]);

    // 카테고리별 게시물 수 맵 생성
    const categoryCountMap = {};
    postsByCategory.forEach((item) => {
      if (item._id) {
        categoryCountMap[item._id.toString()] = item.count;
      }
    });

    // 태그별 게시물 수 맵 생성
    const tagCountMap = {};
    postsByTag.forEach((item) => {
      tagCountMap[item._id.toString()] = item.count;
    });

    // 카테고리 및 태그 데이터에 게시물 수 추가
    const categoriesWithCount = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      parent: cat.parent,
      count: categoryCountMap[cat._id.toString()] || 0,
    }));

    const tagsWithCount = tags.map((tag) => ({
      _id: tag._id,
      name: tag.name,
      count: tagCountMap[tag._id.toString()] || 0,
    }));

    res.render("admin/content-management", {
      title: "콘텐츠 관리",
      categories: categoriesWithCount,
      tags: tagsWithCount,
      activeMenu: "content",
    });
  } catch (error) {
    req.flash("error", error.message || "콘텐츠 관리 데이터를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};
