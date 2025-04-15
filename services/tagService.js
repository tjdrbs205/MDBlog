/**
 * Tag Service
 * 태그 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const Tag = require("../models/Tag");
const Post = require("../models/Post");

/**
 * 모든 태그 조회 서비스
 * @param {Object} options - 정렬 등 옵션
 * @returns {Promise<Array>} 태그 목록
 */
exports.getAllTags = async (options = {}) => {
  const { sort = { name: 1 } } = options;
  return Tag.find().sort(sort);
};

/**
 * 특정 태그 조회 서비스
 * @param {string} tagId - 태그 ID
 * @returns {Promise<Object>} 태그 정보
 */
exports.getTagById = async (tagId) => {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    const error = new Error("태그를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return tag;
};

/**
 * 태그 생성 서비스
 * @param {Object} tagData - 태그 데이터
 * @returns {Promise<Object>} 생성된 태그
 */
exports.createTag = async (tagData) => {
  const { name } = tagData;

  // 이름이 없는 경우 예외 처리
  if (!name || !name.trim()) {
    const error = new Error("태그 이름을 입력해주세요");
    error.statusCode = 400;
    throw error;
  }

  // 이름 중복 검사
  const tagName = name.trim().toLowerCase();
  const existingTag = await Tag.findOne({ name: tagName });

  // 이미 존재하는 태그인 경우 기존 태그 반환
  if (existingTag) {
    return existingTag;
  }

  // 새 태그 생성
  const newTag = await Tag.create({ name: tagName });
  return newTag;
};

/**
 * 태그 삭제 가능 여부 확인 서비스
 * @param {string} tagId - 태그 ID
 * @returns {Promise<Object>} 삭제 가능 여부 및 관련 정보
 */
exports.checkTagDeletable = async (tagId) => {
  // 태그 존재 확인
  const tag = await Tag.findById(tagId);
  if (!tag) {
    const error = new Error("태그를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 관련 게시물 확인
  const hasRelatedPosts = await Post.exists({ tags: tagId });

  return {
    isDeletable: !hasRelatedPosts,
    hasRelatedPosts,
    tag,
  };
};

/**
 * 태그 삭제 서비스
 * @param {string} tagId - 태그 ID
 * @returns {Promise<Object>} 삭제된 태그
 */
exports.deleteTag = async (tagId) => {
  // 삭제 가능 여부 확인
  const { isDeletable, hasRelatedPosts } = await this.checkTagDeletable(tagId);

  if (!isDeletable) {
    const error = new Error("이 태그를 사용하는 게시물이 있어 삭제할 수 없습니다");
    error.statusCode = 400;
    throw error;
  }

  // 태그 삭제
  const deletedTag = await Tag.findByIdAndDelete(tagId);
  return deletedTag;
};

/**
 * 특정 태그의 게시물 조회 서비스
 * @param {string} tagId - 태그 ID
 * @param {Object} options - 페이지네이션, 정렬 등 옵션
 * @returns {Promise<Object>} 게시물 목록 및 페이지네이션 정보
 */
exports.getTagPosts = async (tagId, options = {}) => {
  const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  // 태그 존재 확인
  const tag = await Tag.findById(tagId);
  if (!tag) {
    const error = new Error("태그를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 필터 설정
  const filter = { tags: tagId, isPublic: true };

  // 게시물 및 총 개수 조회
  const [posts, totalPosts] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("author", "username")
      .populate("category", "name")
      .populate("tags", "name"),
    Post.countDocuments(filter),
  ]);

  // 페이지네이션 정보 계산
  const totalPages = Math.ceil(totalPosts / limit);

  return {
    posts,
    totalPosts,
    tag,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * 태그 사용 빈도 통계 조회 서비스
 * @returns {Promise<Array>} 태그별 사용 빈도 통계
 */
exports.getTagStats = async () => {
  // 각 태그의 사용 빈도 집계
  const tagStats = await Post.aggregate([
    { $match: { isPublic: true } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // 태그 정보와 함께 반환
  const tagIds = tagStats.map((stat) => stat._id);
  const tags = await Tag.find({ _id: { $in: tagIds } });

  // 태그 정보와 사용 빈도를 결합
  const tagsWithStats = tagStats.map((stat) => {
    const tag = tags.find((t) => t._id.toString() === stat._id.toString());
    return {
      _id: stat._id,
      name: tag ? tag.name : "알 수 없음",
      count: stat.count,
    };
  });

  return tagsWithStats;
};

/**
 * 태그 이름으로 태그 조회 서비스
 * @param {string} name - 태그 이름
 * @returns {Promise<Object>} 태그 정보
 */
exports.getTagByName = async (name) => {
  const tag = await Tag.findOne({ name: name.toLowerCase() });

  if (!tag) {
    const error = new Error("태그를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return tag;
};
