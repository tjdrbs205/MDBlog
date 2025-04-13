const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // 태그 이름은 필수
      unique: true, // 태그 이름은 고유해야 함
      trim: true, // 공백 제거
      lowercase: true, // 소문자로 저장
    },
    slug: {
      type: String,
      unique: true, // slug는 고유해야 함
    },
  },
  {
    timestamps: true, // 생성 및 수정 시간 자동 관리
  }
);

// 저장 전에 slug 생성
tagSchema.pre("save", function (next) {
  // name이 변경되었거나 새로운 문서인 경우에만 slug 업데이트
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name.replace(/\s+/g, "-").toLowerCase();
  }
  next();
});

module.exports = mongoose.model("Tag", tagSchema);
