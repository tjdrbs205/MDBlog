import { stat } from "fs";
import { StatsModel } from "../../../config/models/Stats";
import { CategoryModel } from "../../category/model/categories.model";
import { PostModel } from "../../post/model/post.model";
import { TagModel } from "../../tag/model/tag.model";
import { UserModel } from "../../user/model/user.model";

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
    const currentDate = new Date();
    const startOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

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
        recent: recentUsers,
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
      recentPosts,
      recentUsers,
      recentComments,
      mostVisitedPosts,
    };
  }

  async getVisitorStats() {
    const currentDate = new Date();
    const startOfToday = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );
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
  }
}
