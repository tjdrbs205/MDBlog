import { IReadOnlyUser, IUser } from "@mdblog/shared/src/types/user.interface";
import { Document, model, Schema } from "mongoose";
import bcrypt from "bcrypt";

interface IUserDocument extends Omit<IUser, "id">, Document {
  readonly readOnlyUser: IReadOnlyUser;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>(
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
      default: process.env.DEFAULT_IMAGE_URL, // 기본 프로필 이미지
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
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: false },
    toJSON: { virtuals: false },
  }
);

userSchema.virtual("readOnlyUser").get(function (this: IUserDocument): IReadOnlyUser {
  return {
    id: this._id ? this._id.toString() : "",
    username: this.username,
    email: this.email,
    profileImage: this.profileImage,
    bio: this.bio,
    role: this.role,
    lastLogin: this.lastLogin,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

userSchema.set("toJSON", {
  transform: (_, ret) => {
    return ret.readOnlyUser;
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserModel = model<IUserDocument>("User", userSchema);

export { UserModel, IUserDocument };
