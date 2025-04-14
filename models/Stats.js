const mongoose = require("mongoose");

const statsSchema = new mongoose.Schema(
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

// 오늘 날짜의 통계 데이터를 조회하거나 생성하는 정적 메서드
statsSchema.statics.getToday = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간 (00:00:00)

  let todayStats = await this.findOne({ date: today });

  if (!todayStats) {
    todayStats = await this.create({ date: today });
  }

  return todayStats;
};

// 오늘 방문자 수를 가져오는 정적 메서드
statsSchema.statics.getTodayVisits = async function () {
  const todayStats = await this.getToday();
  return todayStats.visits;
};

/**
 * 방문자 수 증가 정적 메서드 (개선된 버전)
 * @param {Object} visitor - 방문자 정보 객체
 * @param {string} visitor.visitorId - 방문자 고유 식별자
 * @param {string} visitor.ip - 방문자 IP 주소
 * @param {string} visitor.userAgent - 방문자 브라우저 정보
 * @param {string} visitor.path - 방문한 페이지 경로
 * @param {string} visitor.region - 방문자 지역 (선택적)
 * @param {string} visitor.browser - 방문자 브라우저 종류 (선택적)
 * @param {boolean} isNewVisitor - 새 방문자 여부
 */
statsSchema.statics.incrementVisit = async function (visitor, isNewVisitor) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 업데이트할 필드 설정
  const updateFields = {
    $inc: {
      // 페이지뷰는 항상 증가
      pageViews: 1,
    },
  };

  // 방문자 수는 중복 방문이 아닌 경우에만 증가
  if (!visitor.isDuplicate) {
    updateFields.$inc.visits = 1;
  }

  // 유니크 방문자는 새 방문자인 경우에만 증가
  if (isNewVisitor) {
    updateFields.$inc.uniqueVisitors = 1;
  }

  // 방문한 페이지 통계 증가
  if (visitor.path) {
    const pathKey = `pages.${visitor.path.replace(/\./g, "_").replace(/\//g, "_")}`;
    updateFields.$inc[pathKey] = 1;
  }

  // 지역 정보가 있으면 지역별 통계 증가
  if (visitor.region) {
    const regionKey = `regions.${visitor.region}`;
    updateFields.$inc[regionKey] = 1;
  }

  // 브라우저 정보가 있으면 브라우저별 통계 증가
  if (visitor.browser) {
    const browserKey = `browsers.${visitor.browser}`;
    updateFields.$inc[browserKey] = 1;
  }

  // 통계 업데이트
  await this.findOneAndUpdate({ date: today }, updateFields, { upsert: true, new: true });
};

// 전체 통계 정보를 가져오는 정적 메서드
statsSchema.statics.getTotalStats = async function () {
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

// 특정 기간의 통계 조회
statsSchema.statics.getStatsByDateRange = async function (startDate, endDate) {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

// 실시간 활성 방문자 수 조회
statsSchema.statics.getActiveVisitorsCount = function () {
  return global.activeVisitors ? global.activeVisitors.size : 0;
};

// 실시간 활성 방문자 정보 조회
statsSchema.statics.getActiveVisitors = function () {
  if (!global.activeVisitors) {
    return [];
  }

  const visitors = [];
  for (const [id, data] of global.activeVisitors.entries()) {
    visitors.push({
      id: id.substr(0, 8) + "...", // ID 일부만 표시 (프라이버시)
      time: data.time,
      path: data.path,
      browser: data.browser,
      region: data.region,
    });
  }

  return visitors;
};

// 지역별 방문자 통계 조회
statsSchema.statics.getRegionStats = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setHours(0, 0, 0, 0);

  const stats = await this.find({
    date: { $gte: lastMonth, $lte: today },
  });

  const regionStats = {};

  stats.forEach((dayStat) => {
    if (dayStat.regions) {
      for (const [region, count] of Object.entries(dayStat.regions.toJSON())) {
        if (!regionStats[region]) {
          regionStats[region] = 0;
        }
        regionStats[region] += count;
      }
    }
  });

  return regionStats;
};

// 브라우저별 방문자 통계 조회
statsSchema.statics.getBrowserStats = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setHours(0, 0, 0, 0);

  const stats = await this.find({
    date: { $gte: lastMonth, $lte: today },
  });

  const browserStats = {};

  stats.forEach((dayStat) => {
    if (dayStat.browsers) {
      for (const [browser, count] of Object.entries(dayStat.browsers.toJSON())) {
        if (!browserStats[browser]) {
          browserStats[browser] = 0;
        }
        browserStats[browser] += count;
      }
    }
  });

  return browserStats;
};

// 인기 페이지 통계 조회
statsSchema.statics.getPopularPages = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  lastMonth.setHours(0, 0, 0, 0);

  const stats = await this.find({
    date: { $gte: lastMonth, $lte: today },
  });

  const pagesStats = {};

  stats.forEach((dayStat) => {
    if (dayStat.pages) {
      for (const [page, count] of Object.entries(dayStat.pages.toJSON())) {
        if (!pagesStats[page]) {
          pagesStats[page] = 0;
        }
        pagesStats[page] += count;
      }
    }
  });

  return pagesStats;
};

module.exports = mongoose.model("Stats", statsSchema);
