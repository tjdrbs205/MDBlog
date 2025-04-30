import { ITag } from "@mdblog/shared/src/types/tag.interface";
import { Document, model, Schema } from "mongoose";

interface ITagDocument extends Omit<ITag, "id">, Document {
  readonly plainTag: ITag;
}

const tagSchema = new Schema<ITagDocument>(
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, // 생성 및 수정 시간 자동 관리
  }
);

tagSchema.pre("save", function (next) {
  if (this.isModified("name") || this.isNew) {
    this.slug = this.name.replace(/\s+/g, "-").toLowerCase();
  }
  next();
});

tagSchema.virtual("plainTag").get(function (this: ITagDocument): ITag {
  return {
    id: this._id ? this._id.toString() : "",
    name: this.name,
    slug: this.slug,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

tagSchema.set("toJSON", {
  transform: (_, ret) => {
    return ret.plainTag;
  },
});

const TagModel = model<ITagDocument>("Tag", tagSchema);

export { TagModel, ITagDocument };
