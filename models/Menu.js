const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // 메뉴 제목
    url: { type: String, required: true }, // 메뉴 URL
    order: { type: Number, default: 0 }, // 메뉴 순서 (숫자가 작을수록 먼저 표시)
    isVisible: { type: Boolean, default: true }, // 메뉴 표시 여부
  },
  {
    timestamps: true, // 생성 및 수정 시간 자동 관리
  }
);

module.exports = mongoose.model("Menu", menuSchema);
