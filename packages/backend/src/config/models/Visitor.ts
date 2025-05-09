import { IVisitor } from "@mdblog/shared/src/types/visitor.interface";
import { Document, model, Schema } from "mongoose";

interface IVisitorDocument extends Omit<IVisitor, "id">, Document {}

const visitorSchema = new Schema<IVisitorDocument>(
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

const VisitorModel = model("Visitor", visitorSchema);

export { IVisitorDocument, VisitorModel };
