const mongoose = require("mongoose");

// 방문자 추적을 위한 스키마
const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    visitCount: {
      type: Number,
      default: 1,
    },
    firstVisit: {
      type: Date,
      default: Date.now,
    },
    region: {
      type: String,
      default: "unknown",
    },
    lastPath: {
      type: String,
      default: "/",
    },
    browser: {
      type: String,
      default: "unknown",
    },
    // 방문한 페이지들 기록
    visitedPages: [
      {
        path: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Visitor", visitorSchema);
