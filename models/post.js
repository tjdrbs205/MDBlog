const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // 게시물 제목
      trim: true,
    },
    slug: {
      type: String,
      unique: true, // 고유한 slug 사용
      trim: true,
    },
    content: {
      type: String,
      required: true, // 게시물 내용
    },
    excerpt: {
      type: String,
      default: "", // 발췌문(미리보기용)
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 작성자 (User 모델 참조)
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // 카테고리 (Category 모델 참조)
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag", // 태그 배열 (Tag 모델 참조)
      },
    ],
    featuredImage: {
      type: String,
      default: "", // 대표 이미지
    },
    view: {
      type: Number,
      default: 0, // 조회수
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published", // 게시 상태
    },
    isPublic: {
      type: Boolean,
      default: true, // 공개 여부
    },
    publishedAt: {
      type: Date,
      default: Date.now, // 게시 날짜
    },
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // 댓글 작성자
          required: true,
        },
        content: {
          type: String,
          required: true, // 댓글 내용
        },
        createdAt: {
          type: Date,
          default: Date.now, // 댓글 작성 시간
        },
      },
    ],
    likes: {
      type: Number,
      default: 0, // 좋아요 수
    },
  },
  { timestamps: true } // 생성 및 수정 시간 자동 관리
);

// 저장 전에 slug 생성
postSchema.pre("save", function (next) {
  // title이 변경되었거나 새로운 문서이고 slug가 없는 경우
  if ((this.isModified("title") || this.isNew) && !this.slug) {
    // 제목에서 slug 생성 (중복 방지를 위해 timestamp 추가)
    const timestamp = new Date().getTime().toString().slice(-4);
    this.slug = `${this.title.replace(/\s+/g, "-").toLowerCase()}-${timestamp}`;
  }

  // excerpt가 없으면 content에서 추출 (첫 100자)
  if ((this.isModified("content") || this.isNew) && !this.excerpt) {
    // HTML 태그 제거 후 첫 100자 추출
    const textContent = this.content.replace(/<[^>]*>/g, "");
    this.excerpt =
      textContent.substring(0, 100) + (textContent.length > 100 ? "..." : "");
  }

  next();
});

module.exports = mongoose.model("Post", postSchema);
