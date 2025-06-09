import { SettingModel } from "../../../config/models/Setting";
import { StatsModel } from "../../../config/models/Stats";
import { CategoryModel } from "../../category/model/categories.model";
import { PostModel } from "../../post/model/post.model";
import { TagModel } from "../../tag/model/tag.model";
import { UserModel } from "../../user/model/user.model";

declare global {
  var contentStatsCache: any;
}

class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  async getDashboardData() {
    const statsData = await StatsModel.getTotalStats();
    const todayVisits = await StatsModel.getTodayVisits();
    const activeVisitors = await StatsModel.getActiveVisitorsCount();

    const [
      totalPosts,
      totalUsers,
      totalCategories,
      totalTags,
      recentPosts,
      recentUsers,
      recentComments,
      mostVisitedPosts,
    ] = await Promise.all([
      PostModel.countDocuments(),
      UserModel.countDocuments(),
      CategoryModel.countDocuments(),
      TagModel.countDocuments(),
      PostModel.find().sort({ createAt: -1 }).limit(5).populate("author", "username"),
      UserModel.find().sort({ joinedAt: -1 }).limit(5).select("-password"),
      PostModel.aggregate([
        { $unwind: "$comments" },
        { $sort: { "comments.createAt": -1 } },
        { $limit: 5 },
        {
          $project: {
            title: 1,
            _id: 1,
            comment: "$comments",
          },
        },
      ]),
      PostModel.find().sort({ view: -1 }).limit(5),
    ]);

    return {
      users: {
        total: totalUsers,
        recent: recentUsers.map((user) => user.readOnlyUser),
      },
      posts: {
        total: totalPosts,
        recent: recentPosts,
        mostVisited: mostVisitedPosts,
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
      counts: {
        posts: totalPosts,
        users: totalUsers,
        categories: totalCategories,
        tags: totalTags,
      },
    };
  }

  async getVisitorStats() {
    const currentDate = new Date();
    const startOfThisWeek = new Date(currentDate);
    startOfThisWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const statsData = await StatsModel.getTotalStats();
    const todayVisits = await StatsModel.getTodayVisits();

    const monthlyStats = await StatsModel.getStatsByDateRange(startOfThisMonth, currentDate);
    const weeklyVisits = monthlyStats
      .filter((stat) => stat.date >= startOfThisWeek)
      .reduce((sum, stat) => (sum + stat.visits) as number, 0);

    const monthlyVisits = monthlyStats.reduce((sum, stat) => (sum + stat.visits) as number, 0);

    const chartData = monthlyStats.map((stat) => ({
      data: stat.date.toISOString().slice(0, 10),
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
  }

  async getContentStats() {
    let cacheData = global.contentStatsCache;
    const currentTime = Date.now();
    const cacheExpiry = 1000 * 60 * 5;

    if (!cacheData || !cacheData.timestamp || currentTime - cacheData.timestamp > cacheExpiry) {
      const [
        totalPosts,
        totalCategories,
        totalTags,
        postsByCategory,
        postsByTag,
        postsCreationByMonth,
      ] = await Promise.all([
        PostModel.countDocuments(),
        CategoryModel.countDocuments(),
        TagModel.countDocuments(),
        PostModel.aggregate([
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
        PostModel.aggregate([
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
        PostModel.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$createAt" },
                month: { $month: "$createAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

      const monthlyPostsData = postsCreationByMonth.map((item) => {
        const data = new Date(item._id.year, item._id.month - 1);
        return {
          date: data.toISOString().slice(0, 7),
          count: item.count,
        };
      });

      cacheData = {
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
      global.contentStatsCache = cacheData;
    }
    return cacheData.data;
  }

  async getUserWithPagination(page: number = 1, limit: number = 20) {
    const [users, totalUsers] = await Promise.all([
      UserModel.find()
        .sort({ joinedAt: -1 })
        .select("-password")
        .skip((page - 1) * limit)
        .limit(limit),
      UserModel.countDocuments(),
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
  }

  async getPostsWithPagination(
    page: number = 1,
    limit: number = 20,
    filter: Record<string, any> = {},
    sortField: string = "createAt",
    sortOrder: string = "desc"
  ) {
    const sort: Record<string, any> = {};
    sort[sortField] = sortOrder === "desc" ? -1 : 1;

    const [posts, totalPosts] = await Promise.all([
      PostModel.find(filter)
        .sort(sort)
        .populate("author", "username")
        .populate("category", "name")
        .populate("tags", "name")
        .limit(limit)
        .skip((page - 1) * limit),
      PostModel.countDocuments(filter),
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
      },
    };
  }

  async getSettings() {
    const settings = await SettingModel.find().sort({ key: 1 });

    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });
    return settingsMap;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("해당 사용자를 찾을 수 없습니다.");
      throw error;
    }

    user.isActive = isActive;
    const newUser = await user.save();

    return newUser.readOnlyUser;
  }

  async updateUserRole(userId: string, role: string) {
    const validRoles = ["user", "author", "admin"];
    if (!validRoles.includes(role)) {
      const error = new Error("유효하지 않은 역할입니다.");
      throw error;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error("해당 사용자를 찾을 수 없습니다.");
      throw error;
    }

    user.role = role;
    const newUser = await user.save();

    return newUser.readOnlyUser;
  }
}

export default AdminService;
