import { Document, Model, model, Schema } from "mongoose";
import { IStats } from "@mdblog/shared/src/types/stats.interface";
import {
  IVisitor,
  IVisitorIncrement,
  IVisitorsActive,
} from "@mdblog/shared/src/types/visitor.interface";

declare global {
  var activeVisitors: Map<string, any>;
}

interface IStatsDocument extends Omit<IStats, "id">, Document {}

interface IStatsModel extends Model<IStatsDocument> {
  getToday(): Promise<IStatsDocument | null>;
  getTodayVisits(): Promise<number>;
  incrementVisit(visitor: IVisitor, isNewVisitor: boolean): Promise<void>;
  getTotalStats(): Promise<Record<string, number>>;
  getStatsByDateRange(startDate: Date, endDate: Date): Promise<IStats[]>;
  getActiveVisitorsCount(): Promise<number>;
  getActiveVisitors(): Promise<IVisitorsActive[] | []>;
}

const statsSchema = new Schema<IStatsDocument>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    visits: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    pageViews: {
      type: Number,
      default: 0,
    },
    // 방문한 페이지 기록 (해당 경로별 방문 횟수)
    pages: {
      type: Map,
      of: Number,
      default: {},
    },
    // 방문자의 국가/지역별 통계
    regions: {
      type: Map,
      of: Number,
      default: {},
    },
    // 방문자의 브라우저별 통계
    browsers: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

statsSchema.statics.getToday = async function (): Promise<IStatsDocument> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayStats = await this.findOne({ date: today });
  if (!todayStats) {
    todayStats = await this.create({ date: today });
  }

  return todayStats;
};

statsSchema.statics.getTodayVisits = async function (): Promise<number> {
  const todayStats = await StatsModel.getToday();
  return todayStats ? todayStats.visits : 0;
};

statsSchema.statics.incrementVisit = async function (
  visitorObj: IVisitorIncrement,
  isNewVisitor: boolean
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updatedFields: Record<string, any> = {
    $inc: {
      pageViews: 1,
    },
  };

  if (!visitorObj.isDuplicate) {
    updatedFields.$inc.visits = 1;
  }

  if (isNewVisitor) {
    updatedFields.$inc.uniqueVisitors = 1;
  }

  if (visitorObj.path) {
    const pathKey = `pages.${visitorObj.path
      .replace(/\./g, "_")
      .replace(/\//g, "_")}`;
    updatedFields.$inc[pathKey] = 1;
  }

  if (visitorObj.region) {
    const regionKey = `regions.${visitorObj.region}`;
    updatedFields.$inc[regionKey] = 1;
  }

  if (visitorObj.browser) {
    const browserKey = `browsers.${visitorObj.browser}`;
    updatedFields.$inc[browserKey] = 1;
  }

  await this.findOneAndUpdate({ data: today }, updatedFields, {
    upsert: true,
    new: true,
  });
};

statsSchema.statics.getTotalStats = async function (): Promise<{
  totalVisits: number;
  totalPageViews: number;
  totalUniqueVisitors: number;
}> {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVisits: { $sum: "$visits" },
        totalPageViews: { $sum: "$pageViews" },
        totalUniqueVisitors: { $sum: "$uniqueVisitors" },
      },
    },
  ]);

  return result.length > 0
    ? {
        totalVisits: result[0].totalVisits || 0,
        totalPageViews: result[0].totalPageViews || 0,
        totalUniqueVisitors: result[0].totalUniqueVisitors || 0,
      }
    : {
        totalVisits: 0,
        totalPageViews: 0,
        totalUniqueVisitors: 0,
      };
};

statsSchema.statics.getStatsByDateRange = async function (
  startDate: Date,
  endDate: Date
): Promise<IStats[]> {
  return await this.find({
    data: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

statsSchema.statics.getActiveVisitorsCount =
  async function (): Promise<number> {
    return global.activeVisitors ? global.activeVisitors.size : 0;
  };

statsSchema.statics.getActiveVisitors = async function () {
  if (!global.activeVisitors) {
    return [];
  }

  const visitors = [];

  for (const [id, data] of global.activeVisitors.entries()) {
    visitors.push({
      id: id.substring(0, 0) + "...",
      time: data.time,
      path: data.path,
      browser: data.browser,
      region: data.region,
    });
  }
  return visitors;
};

const StatsModel = model<IStatsDocument, IStatsModel>("Stats", statsSchema);

export { IStatsDocument, StatsModel };
