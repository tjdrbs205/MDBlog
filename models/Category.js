const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
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

// 자식 카테고리를 위한 가상 필드 추가
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// 저장 전에 slug 생성
categorySchema.pre("save", function (next) {
  // name이 변경되었거나 새로운 문서인 경우에만 slug 업데이트
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name.replace(/\s+/g, "-").toLowerCase();
  }
  next();
});

// 하위 카테고리 가져오기 메서드
categorySchema.statics.getChildCategories = async function (parentId) {
  return this.find({ parent: parentId });
};

// 계층 구조 카테고리 가져오기
categorySchema.statics.getHierarchicalCategories = async function () {
  // 모든 카테고리 가져오기
  const allCategories = await this.find().sort({ order: 1, name: 1 });

  // 카테고리 맵 생성
  const categoryMap = {};
  allCategories.forEach((category) => {
    // 자식 배열 추가
    category = category.toObject();
    category.children = [];
    categoryMap[category._id.toString()] = category;
  });

  // 계층 구조 구성
  const rootCategories = [];
  allCategories.forEach((category) => {
    const id = category._id.toString();
    // 부모가 없으면 루트 카테고리에 추가
    if (!category.parent) {
      rootCategories.push(categoryMap[id]);
    } else {
      // 부모가 있으면 부모의 children에 추가
      const parentId = category.parent.toString();
      if (categoryMap[parentId]) {
        categoryMap[parentId].children.push(categoryMap[id]);
      }
    }
  });

  return rootCategories;
};

module.exports = mongoose.model("Category", categorySchema);
