/**
 * Admin Service
 * 관리자 기능 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const User = require("../models/User");
const Post = require("../models/Post");
const Category = require("../models/Category");
const Tag = require("../models/Tag");
const Stats = require("../models/Stats");
const Visitor = require("../models/Visitor");

/**
 * 대시보드 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 대시보드 통계 데이터
 */
exports.getDashboardStats = async () => {
  const currentDate = new Date();
  const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  // Stats 모델을 활용한 통계 데이터 조회
  const statsData = await Stats.getTotalStats();
  const todayVisits = await Stats.getTodayVisits();
  const activeVisitors = Stats.getActiveVisitorsCount();

  // 나머지 필요한 데이터 병렬로 조회
  const [
    totalPosts,
    totalUsers,
    totalCategories,
    totalTags,
    recentPosts,
    recentUsers,
    recentComments,
    mostViewedPosts,
  ] = await Promise.all([
    Post.countDocuments(),
    User.countDocuments(),
    Category.countDocuments(),
    Tag.countDocuments(),
    Post.find().sort({ createdAt: -1 }).limit(5).populate("author", "username"),
    User.find().sort({ joinedAt: -1 }).limit(5).select("-password"),
    Post.aggregate([
      { $unwind: "$comments" },
      { $sort: { "comments.createdAt": -1 } },
      { $limit: 5 },
      {
        $project: {
          title: 1,
          _id: 1,
          comment: "$comments",
        },
      },
    ]),
    Post.find().sort({ view: -1 }).limit(5),
  ]);

  // 대시보드 EJS 템플릿에서 사용하는 구조로 데이터 반환
  return {
    users: {
      total: totalUsers,
      recent: recentUsers,
    },
    posts: {
      total: totalPosts,
      recent: recentPosts,
      mostViewed: mostViewedPosts,
    },
    categories: {
      total: totalCategories,
    },
    tags: {
      total: totalTags,
    },
    comments: {
      recent: recentComments,
    },
    visits: {
      today: todayVisits,
      total: statsData.totalVisits,
      totalPageViews: statsData.totalPageViews,
      totalUniqueVisitors: statsData.totalUniqueVisitors,
      active: activeVisitors,
    },
    // 하위 호환성을 위해 기존 counts 객체도 유지
    counts: {
      posts: totalPosts,
      users: totalUsers,
      categories: totalCategories,
      tags: totalTags,
    },
    recentPosts,
    recentUsers,
    recentComments,
    mostViewedPosts,
  };
};

/**
 * 방문자 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 방문자 통계 데이터
 */
exports.getVisitorStats = async () => {
  const currentDate = new Date();
  const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const startOfThisWeek = new Date(currentDate);
  startOfThisWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Stats 모델을 활용한 통계 데이터 조회 (중복 호출 제거)
  const statsData = await Stats.getTotalStats();
  const todayVisits = await Stats.getTodayVisits();

  // 일별 방문자 통계 데이터를 한 번의 쿼리로 가져옴
  const monthlyStats = await Stats.getStatsByDateRange(startOfThisMonth, currentDate);

  // 주간 방문자 수 계산
  const weeklyVisits = monthlyStats
    .filter((stat) => stat.date >= startOfThisWeek)
    .reduce((sum, stat) => sum + stat.visits, 0);

  // 월간 방문자 수 계산
  const monthlyVisits = monthlyStats.reduce((sum, stat) => sum + stat.visits, 0);

  // 차트용 데이터 가공
  const chartData = monthlyStats.map((stat) => ({
    date: stat.date.toISOString().slice(0, 10),
    count: stat.visits,
  }));

  return {
    today: todayVisits,
    weekly: weeklyVisits,
    monthly: monthlyVisits,
    total: statsData.totalVisits,
    chartData,
    pageViews: statsData.totalPageViews,
    uniqueVisitors: statsData.totalUniqueVisitors,
  };
};

/**
 * 콘텐츠 통계 데이터 조회 서비스
 * @returns {Promise<Object>} 콘텐츠 통계 데이터
 */
exports.getContentStats = async () => {
  // getDashboardStats와의 중복 쿼리를 방지하기 위해 캐싱을 활용
  // 아래처럼 자주 바뀌지 않는 데이터를 메모리 캐싱할 수 있도록 수정
  let cachedData = global.contentStatsCache;
  const currentTime = Date.now();
  const cacheExpiry = 1000 * 60 * 10; // 10분 캐시

  // 캐시가 없거나 만료되었으면 데이터 새로 가져오기
  if (!cachedData || !cachedData.timestamp || currentTime - cachedData.timestamp > cacheExpiry) {
    // 병렬로 통계 데이터 조회
    const [totalPosts, totalCategories, totalTags, postsByCategory, postsByTag, postsCreationByMonth] =
      await Promise.all([
        Post.countDocuments(),
        Category.countDocuments(),
        Tag.countDocuments(),
        Post.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              name: "$category.name",
              count: 1,
            },
          },
        ]),
        Post.aggregate([
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "tags",
              localField: "_id",
              foreignField: "_id",
              as: "tag",
            },
          },
          { $unwind: { path: "$tag", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              name: "$tag.name",
              count: 1,
            },
          },
        ]),
        Post.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

    // 월별 게시물 생성 통계 데이터 가공
    const monthlyPostsData = postsCreationByMonth.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1, 1);
      return {
        date: date.toISOString().slice(0, 7),
        count: item.count,
      };
    });

    // 결과 생성 및 캐싱
    cachedData = {
      data: {
        total: {
          posts: totalPosts,
          categories: totalCategories,
          tags: totalTags,
        },
        topCategories: postsByCategory,
        topTags: postsByTag,
        monthlyPosts: monthlyPostsData,
      },
      timestamp: currentTime,
    };

    // 글로벌 변수에 캐시 데이터 저장
    global.contentStatsCache = cachedData;
  }

  return cachedData.data;
};

/**
 * 사용자 관리 데이터 조회 서비스
 * @param {Object} options - 페이지네이션, 정렬 등 옵션
 * @returns {Promise<Object>} 사용자 목록 및 페이지네이션 정보
 */
exports.getUsersWithPagination = async ({ page = 1, limit = 20 }) => {
  // 사용자 목록과 총 개수를 병렬로 조회하여 최적화
  const [users, totalUsers] = await Promise.all([
    User.find()
      .sort({ joinedAt: -1 })
      .select("-password")
      .limit(limit)
      .skip((page - 1) * limit),
    User.countDocuments(),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users,
    totalUsers,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * 게시물 관리 데이터 조회 서비스
 * @param {Object} options - 페이지네이션, 필터, 정렬 등 옵션
 * @returns {Promise<Object>} 게시물 목록 및 페이지네이션 정보
 */
exports.getPostsWithPagination = async ({
  page = 1,
  limit = 20,
  filter = {},
  sortField = "createdAt",
  sortOrder = "desc",
}) => {
  // 정렬 설정
  const sort = {};
  sort[sortField] = sortOrder === "desc" ? -1 : 1;

  // 게시물 목록과 총 개수를 병렬로 조회하여 최적화
  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name")
      .limit(limit)
      .skip((page - 1) * limit),
    Post.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts,
    totalPosts,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      currentPage: page,
      totalPages: totalPages,
    },
  };
};

/**
 * 사용자 상태 변경 서비스
 * @param {string} userId - 사용자 ID
 * @param {boolean} isActive - 활성화 상태 여부
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 */
exports.updateUserStatus = async (userId, isActive) => {
  // 사용자 존재 여부 확인
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("해당 사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  // 사용자 상태 업데이트
  user.isActive = isActive;
  await user.save();

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};

/**
 * 사용자 역할 변경 서비스
 * @param {string} userId - 사용자 ID
 * @param {string} role - 역할 (user, author, admin)
 * @returns {Promise<Object>} 업데이트된 사용자 정보
 */
exports.updateUserRole = async (userId, role) => {
  // 역할 유효성 검사
  const validRoles = ["user", "author", "admin"];
  if (!validRoles.includes(role)) {
    const error = new Error("유효하지 않은 역할입니다.");
    error.statusCode = 400;
    throw error;
  }

  // 사용자 존재 여부 확인
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("해당 사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    throw error;
  }

  // 사용자 역할 업데이트
  user.role = role;
  await user.save();

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};
