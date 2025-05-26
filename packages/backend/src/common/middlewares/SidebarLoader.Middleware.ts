import { NextFunction, Request, Response } from "express";
import { CategoryModel } from "../../modules/category/model/categories.model";
import { TagModel } from "../../modules/tag/model/tag.model";
import { PostModel } from "../../modules/post/model/post.model";
import { StatsModel } from "../../config/models/Stats";

class SidebarLoaderMiddleware {
  static async handle(req: Request, res: Response, next: NextFunction) {
    const [
      categoriesHierarchical,
      tags,
      recentPosts,
      totalPosts,
      categoryPostCounts,
      todayStats,
      totalStats,
    ] = await Promise.all([
      CategoryModel.getCategoryHierarchy(),
      TagModel.find().sort({ name: 1 }),
      PostModel.find({ isPublic: true }).sort({ createAt: -1 }).limit(5),
      PostModel.countDocuments({ isPublic: true }),
      PostModel.aggregate([
        { $match: { isPublic: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      StatsModel.getTodayVisits(),
      StatsModel.getTotalStats(),
    ]);

    const categoryMap: Record<string, any> = {};
    categoryPostCounts.forEach((item) => {
      if (item._id) {
        categoryMap[item._id.toString()] = item.count;
      }
    });

    const activateVisitorsCount = await StatsModel.getActiveVisitorsCount();

    const stats = {
      posts: {
        total: totalPosts,
      },
      visits: {
        today: todayStats || 0,
        total: totalStats?.totalVisits || 0,
        totalPageViews: totalStats?.totalPageViews || 0,
        totalUniqueVisitors: totalStats?.totalUniqueVisitors || 0,
        active: activateVisitorsCount,
      },
    };

    const categories = await CategoryModel.find().sort({ name: 1 });

    res.locals.categories = categories.map((cat) => cat.plainCategory);
    res.locals.categoriesHierarchical = categoriesHierarchical;
    res.locals.tags = tags.map((tag) => tag.plainTag);
    res.locals.recentPosts = recentPosts.map((post) => post.plainPost);
    res.locals.categoryMap = categoryMap;
    res.locals.postStats = stats.posts;
    res.locals.stats = stats;

    if (typeof res.locals.selectedCategory === "undefined") {
      res.locals.selectedCategory = null;
    }

    if (typeof res.locals.selectedTag === "undefined") {
      res.locals.selectedTag = null;
    }

    if (typeof res.locals.sort === "undefined") {
      res.locals.sort = "newest";
    }

    if (typeof res.locals.q === "undefined") {
      res.locals.q = "";
    }

    next();
  }
}

export default SidebarLoaderMiddleware;
