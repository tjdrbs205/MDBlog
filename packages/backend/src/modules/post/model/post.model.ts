import { IPost } from "@mdblog/shared/src/types/post.interface";
import { Document, model, Schema } from "mongoose";

interface IPostDocument extends Omit<IPost, "id" | "author" | "category">, Document {
  author: Schema.Types.ObjectId;
  category: Schema.Types.ObjectId;
}

const postSchema = new Schema<IPostDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    featuredImage: {
      type: String,
      default: "",
    },
    view: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    comments: [
      {
        author: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 데이터 저장 시 slug와 excerpt 자동 생성
postSchema.pre("save", function (next) {
  if ((this.isModified("title") || this.isNew) && !this.slug) {
    const timestamps = new Date().getTime();
    this.slug = `${this.title.replace(/\s+/g, "-").toLowerCase()}-${timestamps}`;
  }

  if ((this.isModified("content") || this.isNew) && !this.excerpt) {
    const textContent = this.content.replace(/<[^>]*>/g, "");
    this.excerpt = textContent.substring(0, 100) + (textContent.length > 100 ? "..." : "");
  }
  next();
});

postSchema.virtual("plainPost").get(function (this: IPostDocument): IPost {
  return {
    ...this,
    id: this._id?.toString() || "",
    author: this.author ? this.author.toString() : "",
    category: this.category ? this.category.toString() : "",
  };
});

const PostModel = model<IPostDocument>("Post", postSchema);

export { PostModel, IPostDocument };
