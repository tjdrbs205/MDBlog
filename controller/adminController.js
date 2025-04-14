const User = require("../models/User");
const Post = require("../models/Post");
const Stats = require("../models/Stats");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Menu = require("../models/Menu");

/**
 * 관리자 대시보드
 */
exports.dashboard = async (req, res) => {
  try {
    // 전체 통계 데이터 가져오기
    const totalStats = await Stats.getTotalStats();

    // 통계 데이터 조회
    const stats = {
      users: {
        total: await User.countDocuments(),
      },
      posts: {
        total: await Post.countDocuments(),
      },
      visits: {
        total: totalStats.totalVisits || 0,
        today: await Stats.getTodayVisits(),
      },
    };

    // 최근 게시물 조회 (최근 5개)
    const recentPosts = await Post.find()
      .populate("author", "username")
      .select("title author createdAt views")
      .sort({ createdAt: -1 })
      .limit(5);

    // 최근 가입한 회원 조회 (최근 5명)
    const recentUsers = await User.find()
      .select("username email createdAt role")
      .sort({ createdAt: -1 })
      .limit(5);

    // 대시보드 페이지 렌더링
    res.render("layouts/main", {
      title: "관리자 대시보드",
      stats,
      recentPosts,
      recentUsers,
      contentView: "admin/dashboard",
    });
  } catch (error) {
    console.error("대시보드 에러:", error);
    req.flash("error", "대시보드 데이터를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/");
  }
};

/**
 * 사용자 목록 조회 (관리자용)
 */
exports.listUsers = async (req, res) => {
  const users = await User.find().sort({ username: 1 });

  res.render("layouts/main", {
    title: "사용자 관리",
    users,
    contentView: "admin/users",
  });
};

/**
 * 사용자 권한 변경 (관리자용)
 */
exports.changeUserRole = async (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    req.flash("error", "사용자 ID와 역할이 필요합니다.");
    return res.redirect("/admin/users");
  }

  // 역할이 유효한지 확인
  if (!["user", "admin"].includes(role)) {
    req.flash("error", "유효하지 않은 역할입니다.");
    return res.redirect("/admin/users");
  }

  // 자기 자신의 관리자 권한을 제거하는 것을 방지
  if (userId === req.user._id.toString() && role !== "admin") {
    req.flash("error", "자신의 관리자 권한을 제거할 수 없습니다.");
    return res.redirect("/admin/users");
  }

  // 사용자 찾기
  const user = await User.findById(userId);

  if (!user) {
    req.flash("error", "사용자를 찾을 수 없습니다.");
    return res.redirect("/admin/users");
  }

  // 사용자 역할 변경
  user.role = role;
  await user.save();

  req.flash("success", `${user.username} 사용자의 역할이 ${role}로 변경되었습니다.`);
  res.redirect("/admin/users");
};

/**
 * 통합 콘텐츠 관리 (카테고리, 태그, 메뉴)
 */
exports.contentManagement = async (req, res) => {
  try {
    // 모든 데이터를 병렬로 로드
    const [categories, allCategories, tags, menus] = await Promise.all([
      // 계층 구조를 갖는 루트 카테고리 목록
      Category.find({ parent: null })
        .sort({ name: 1 })
        .populate({
          path: "children",
          options: { sort: { order: 1, name: 1 } },
          populate: {
            path: "children",
            options: { sort: { order: 1, name: 1 } },
          },
        }),
      // 모든 카테고리 (플랫 목록)
      Category.find().sort({ name: 1 }),
      // 모든 태그
      Tag.find().sort({ name: 1 }),
      // 모든 메뉴
      Menu.find().sort({ order: 1 }),
    ]);

    // 통합 콘텐츠 관리 페이지 렌더링
    res.render("layouts/main", {
      title: "콘텐츠 관리",
      categories,
      allCategories,
      tags,
      menus,
      contentView: "admin/content-management",
    });
  } catch (error) {
    console.error("콘텐츠 관리 에러:", error);
    req.flash("error", "콘텐츠 관리 데이터를 불러오는 중 오류가 발생했습니다.");
    res.redirect("/admin");
  }
};

/**
 * 통계 대시보드 페이지 표시
 */
exports.stats = async (req, res) => {
  try {
    // 오늘 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 어제 날짜
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // 일주일 전 날짜
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // 한 달 전 날짜
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);

    // 필요한 통계 데이터 가져오기
    const [
      todayStats,
      yesterdayStats,
      dailyStats,
      totalStats,
      regionStats,
      browserStats,
      popularPages,
    ] = await Promise.all([
      Stats.getToday(),
      Stats.findOne({ date: yesterday }),
      Stats.find({ date: { $gte: monthAgo, $lte: today } }).sort({ date: 1 }),
      Stats.getTotalStats(),
      Stats.getRegionStats(),
      Stats.getBrowserStats(),
      Stats.getPopularPages(),
    ]);

    // 주간/월간 집계
    let weeklyStats = 0;
    let monthlyStats = 0;
    let weeklyPageViews = 0;
    let monthlyPageViews = 0;

    // 일별 차트 데이터 준비
    const dailyLabels = [];
    const dailyVisits = [];
    const dailyPageViews = [];

    dailyStats.forEach((stat) => {
      // 차트 데이터 준비
      const dateLabel = new Date(stat.date).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
      dailyLabels.push(dateLabel);
      dailyVisits.push(stat.visits || 0);
      dailyPageViews.push(stat.pageViews || 0);

      // 집계 계산
      const statDate = new Date(stat.date);

      // 주간 집계
      if (statDate >= weekAgo && statDate <= today) {
        weeklyStats += stat.visits || 0;
        weeklyPageViews += stat.pageViews || 0;
      }

      // 월간 집계 (이미 monthAgo 이후 데이터만 쿼리했으므로 모든 데이터가 해당됨)
      monthlyStats += stat.visits || 0;
      monthlyPageViews += stat.pageViews || 0;
    });

    // 객체가 undefined인 경우 빈 객체로 초기화
    const safeRegionStats = regionStats || {};
    const safeBrowserStats = browserStats || {};
    const safePopularPages = popularPages || {};

    // 활성 방문자 목록
    const activeVisitorsCount = Stats.getActiveVisitorsCount();
    const activeVisitors = Stats.getActiveVisitors();

    res.render("admin/stats/dashboard", {
      title: "통계 대시보드",
      todayStats: todayStats || { visits: 0, pageViews: 0, uniqueVisitors: 0 },
      yesterdayStats: yesterdayStats || { visits: 0, pageViews: 0, uniqueVisitors: 0 },
      totalStats: totalStats || { totalVisits: 0, totalPageViews: 0, totalUniqueVisitors: 0 },
      weeklyStats: weeklyStats || 0,
      monthlyStats: monthlyStats || 0,
      weeklyPageViews: weeklyPageViews || 0,
      monthlyPageViews: monthlyPageViews || 0,
      dailyLabels: dailyLabels || [],
      dailyVisits: dailyVisits || [],
      dailyPageViews: dailyPageViews || [],
      regionStats: safeRegionStats,
      browserStats: safeBrowserStats,
      popularPages: safePopularPages,
      activeVisitorsCount: activeVisitorsCount || 0,
      activeVisitors: activeVisitors || [],
    });
  } catch (error) {
    console.error("통계 대시보드 로드 중 오류:", error);
    res.status(500).render("error", {
      message: "통계 데이터를 불러오는 중 오류가 발생했습니다.",
      error: req.app.get("env") === "development" ? error : {},
    });
  }
};

/**
 * 차트 데이터 API (AJAX 요청용)
 */
exports.getChartData = async (req, res) => {
  const period = req.query.period || "month";

  let startDate;
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  // 기간 설정
  if (period === "week") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === "month") {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (period === "year") {
    startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else {
    return res.status(400).json({ error: "유효하지 않은 기간입니다" });
  }

  startDate.setHours(0, 0, 0, 0);

  // 통계 데이터 조회
  const stats = await Stats.find({
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  // 차트 데이터 준비
  const labels = [];
  const visits = [];
  const pageViews = [];

  // 날짜 포맷 옵션 설정
  let dateFormatOptions;
  if (period === "year") {
    dateFormatOptions = { month: "short", year: "numeric" };
  } else {
    dateFormatOptions = { month: "short", day: "numeric" };
  }

  stats.forEach((stat) => {
    const dateLabel = new Date(stat.date).toLocaleDateString("ko-KR", dateFormatOptions);
    labels.push(dateLabel);
    visits.push(stat.visits || 0);
    pageViews.push(stat.pageViews || 0);
  });

  res.json({
    labels,
    visits,
    pageViews,
  });
};

/**
 * 활성 방문자 데이터 API (AJAX 요청용)
 */
exports.getActiveVisitors = async (req, res) => {
  const count = Stats.getActiveVisitorsCount();
  const visitors = Stats.getActiveVisitors();

  res.json({
    count,
    visitors,
  });
};
