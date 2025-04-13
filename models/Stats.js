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

// 방문자 수 증가 정적 메서드
statsSchema.statics.incrementVisit = async function (sessionId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 세션 ID를 기준으로 고유 방문자 수 관리를 위한 컬렉션을 별도로 만들 수도 있지만,
  // 간단한 구현을 위해 총 방문자 수만 증가시키는 방식으로 구현
  await this.findOneAndUpdate(
    { date: today },
    { $inc: { visits: 1 } },
    { upsert: true, new: true }
  );
};

// 전체 통계 정보를 가져오는 정적 메서드
statsSchema.statics.getTotalStats = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVisits: { $sum: "$visits" },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalVisits: 0 };
};

module.exports = mongoose.model("Stats", statsSchema);
