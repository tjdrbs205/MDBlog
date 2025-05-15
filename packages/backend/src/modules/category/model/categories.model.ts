import { ICategory, ICategoryWithChildren } from "@mdblog/shared/src/types/categories.interface";
import { Document, Model, model, Schema } from "mongoose";

interface ICategoryDocument extends Omit<ICategory, "id" | "parent">, Document {
  parent: Schema.Types.ObjectId;
  readonly plainCategory: ICategory;
}

interface ICategoryModel extends Model<ICategoryDocument> {
  getChildCategories(parentId: string): Promise<ICategory[]>;
  getCategoryHierarchy(): Promise<ICategoryWithChildren[]>;
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
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// 저장 전에 slug 생성
categorySchema.pre("save", function (next) {
  // name이 변경되었거나 새로운 문서인 경우에만 slug 업데이트
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name.replace(/\s+/g, "-").toLowerCase();
  }
  next();
});

categorySchema.virtual("plainCategory").get(function (this: ICategoryDocument): ICategory {
  return {
    id: this._id ? this._id.toString() : "",
    name: this.name,
    slug: this.slug,
    description: this.description,
    order: this.order,
    parent: this.parent ? this.parent.toString() : "",
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

categorySchema.set("toJSON", {
  transform: (_, ret) => {
    return ret.plainCategory;
  },
});

// 하위 카테고리 가져오기 메서드
categorySchema.statics.getChildCategories = async function (
  parentId: string
): Promise<ICategory[]> {
  return this.find({ parent: parentId });
};

// 계층 구조 카테고리 가져오기
categorySchema.statics.getCategoryHierarchy = async function (): Promise<ICategoryWithChildren[]> {
  const allCategories = await this.find().sort({ order: 1, name: 1 });

  const categoryMap: Record<string, ICategoryWithChildren> = {};
  allCategories.forEach((cat: ICategoryDocument) => {
    const catObj: any = {
      ...cat.plainCategory,
    };
    catObj.children = [];
    categoryMap[catObj.id.toString()] = catObj;
  });

  const rootCategories: ICategoryWithChildren[] = [];
  allCategories.forEach((cat: ICategoryDocument) => {
    const catObj: any = {
      ...cat.plainCategory,
    };
    const id = catObj.id;
    if (!cat.parent) {
      rootCategories.push(categoryMap[id]);
    } else {
      const parentId = cat.parent.toString();
      if (categoryMap[parentId]) {
        categoryMap[parentId].children.push(categoryMap[id]);
      }
    }
  });
  return rootCategories;
};

const CategoryModel = model<ICategoryDocument, ICategoryModel>("Category", categorySchema);

export { ICategoryDocument, CategoryModel };
