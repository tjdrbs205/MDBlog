const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true, // 사용자 이름은 고유해야 함
      required: true, // 사용자 이름은 필수
      minlength: [3, "사용자 이름은 최소 3자 이상이어야 합니다."],
      maxlength: [20, "사용자 이름은 최대 20자까지만 가능합니다."],
      trim: true,
    },
    email: {
      type: String,
      required: true, // 이메일은 필수
      unique: true, // 이메일은 고유해야 함
      lowercase: true, // 소문자로 저장
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "유효한 이메일 주소를 입력해주세요.",
      ],
    },
    password: {
      type: String,
      required: true, // 비밀번호는 필수
      minlength: [6, "비밀번호는 최소 6자 이상이어야 합니다."],
    },
    profileImage: {
      type: String,
      default: "/images/default-profile.png", // 기본 프로필 이미지
    },
    bio: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true, // 생성 및 수정 시간 자동 관리
  }
);

// 비밀번호를 저장하기 전에 해시 처리
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // 비밀번호가 수정되지 않은 경우 건너뜀
  this.password = await bcrypt.hash(this.password, 10); // 비밀번호 해시 처리
  next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password); // 입력된 비밀번호와 저장된 비밀번호 비교
};

module.exports = mongoose.model("User", userSchema);
