import { Document } from "mongoose";

type TransformOptions = {
  dateFields?: string[];
  excludeFields?: string[];
};

/**
 * Mongoose Document를 일반 객체로 변환하는 제네릭 유틸리티
 */
export function transformDocument<T extends Document, R>(doc: T, options: TransformOptions = {}): R {
  const { dateFields = ["createdAt", "updatedAt"], excludeFields = ["__v"] } = options;

  const obj = doc.toObject();

  // ID 변환
  if (obj.id) {
    obj.id = obj.id.toString();
  }

  // 날짜 필드 변환
  for (const field of dateFields) {
    if (obj[field] instanceof Date) {
      obj[field] = obj[field].toISOString();
    }
  }

  // 제외할 필드 제거
  for (const field of excludeFields) {
    delete obj[field];
  }

  return obj as R;
}
