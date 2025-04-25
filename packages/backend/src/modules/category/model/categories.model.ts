import { ICategory } from "@mdblog/shared/src/types/categories.interface";
import { Schema } from "mongoose";

interface ICategoryDocument extends Omit<ICategory, "id" | "parent">, Document {
  parent: Schema.Types.ObjectId;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: true, // 카테고리 이름은 필수
      unique: true, // 카테고리 이름은 고유해야 함
      trim: true, // 공백 제거
    },
    slug: {
      type: String,
      unique: true, // 고유한 slug 사용
    },
    description: {
      type: String,
      default: "", // 설명은 선택사항
    },
    order: {
      type: Number,
      default: 0, // 기본 순서 값
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null, // 기본값은 null (최상위 카테고리)
    },
  },
  {
    timestamps: true, // 생성 및 수정 시간 자동 관리
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
