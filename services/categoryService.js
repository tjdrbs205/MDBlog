/**
 * Category Service
 * 카테고리 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const Category = require("../models/Category");
const Post = require("../models/Post");

/**
 * 모든 카테고리 조회 서비스
 * @param {Object} options - 정렬 등 옵션
 * @returns {Promise<Array>} 카테고리 목록
 */
exports.getAllCategories = async (options = {}) => {
  const { sort = { order: 1, name: 1 } } = options;
  return Category.find().sort(sort);
};

/**
 * 계층 구조로 카테고리 조회 서비스
 * @returns {Promise<Array>} 계층 구조의 카테고리 목록
 */
exports.getHierarchicalCategories = async () => {
  return Category.getHierarchicalCategories();
};

/**
 * 카테고리별 게시물 수 조회 서비스
 * @returns {Promise<Object>} 카테고리 ID를 키로 하는 게시물 수 객체
 */
exports.getCategoryPostCounts = async () => {
  const categoryPostCounts = await Post.aggregate([
    { $match: { isPublic: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const categoryMap = {};
  categoryPostCounts.forEach((item) => {
    if (item._id) {
      categoryMap[item._id.toString()] = item.count;
    }
  });

  return categoryMap;
};

/**
 * 특정 카테고리 조회 서비스
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<Object>} 카테고리 정보
 */
exports.getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);

  if (!category) {
    const error = new Error("카테고리를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  return category;
};

/**
 * 카테고리의 하위 카테고리 ID 목록 조회 서비스
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<Array>} 하위 카테고리 ID 목록 (재귀적)
 */
exports.getDescendantCategoryIds = async (categoryId) => {
  // 모든 카테고리 조회
  const allCategories = await Category.find();

  // 재귀적으로 하위 카테고리 찾기
  const findDescendants = (parentId) => {
    const directChildren = allCategories.filter((cat) => cat.parent && cat.parent.toString() === parentId.toString());

    let descendants = [...directChildren.map((child) => child._id)];

    // 각 직계 자식의 자손들도 추가
    directChildren.forEach((child) => {
      const childDescendants = findDescendants(child._id);
      descendants = [...descendants, ...childDescendants];
    });

    return descendants;
  };

  return findDescendants(categoryId);
};

/**
 * 카테고리 생성 서비스
 * @param {Object} categoryData - 카테고리 데이터
 * @returns {Promise<Object>} 생성된 카테고리
 */
exports.createCategory = async (categoryData) => {
  const { name, parent } = categoryData;

  // 이름 중복 검사
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    const error = new Error("이미 존재하는 카테고리 이름입니다");
    error.statusCode = 400;
    throw error;
  }

  // 카테고리 생성
  const newCategory = await Category.create({
    name,
    parent: parent || null,
  });

  return newCategory;
};

/**
 * 카테고리 업데이트 서비스
 * @param {string} categoryId - 카테고리 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 카테고리
 */
exports.updateCategory = async (categoryId, updateData) => {
  const { name, parent } = updateData;

  // 카테고리 존재 확인
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error("카테고리를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 순환 참조 방지 (자기 자신이나 자신의 하위 카테고리를 부모로 지정할 수 없음)
  if (parent) {
    // 자기 자신을 부모로 지정하는 경우
    if (parent.toString() === categoryId.toString()) {
      const error = new Error("자기 자신을 부모 카테고리로 지정할 수 없습니다");
      error.statusCode = 400;
      throw error;
    }

    // 하위 카테고리를 부모로 지정하는 경우
    const descendantIds = await this.getDescendantCategoryIds(categoryId);
    if (descendantIds.some((id) => id.toString() === parent.toString())) {
      const error = new Error("하위 카테고리를 부모로 지정할 수 없습니다");
      error.statusCode = 400;
      throw error;
    }
  }

  // 이름 중복 검사 (자기 자신 제외)
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory && existingCategory._id.toString() !== categoryId) {
      const error = new Error("이미 존재하는 카테고리 이름입니다");
      error.statusCode = 400;
      throw error;
    }
  }

  // 카테고리 업데이트
  category.name = name || category.name;
  category.parent = parent === undefined ? category.parent : parent || null;

  await category.save();
  return category;
};

/**
 * 카테고리 삭제 가능 여부 확인 서비스
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<Object>} 삭제 가능 여부 및 관련 정보
 */
exports.checkCategoryDeletable = async (categoryId) => {
  // 카테고리 존재 확인
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error("카테고리를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 하위 카테고리 확인
  const hasChildren = await Category.exists({ parent: categoryId });

  // 관련 게시물 확인
  const hasRelatedPosts = await Post.exists({ category: categoryId });

  return {
    isDeletable: !hasChildren && !hasRelatedPosts,
    hasChildren,
    hasRelatedPosts,
    category,
  };
};

/**
 * 카테고리 삭제 서비스
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<Object>} 삭제된 카테고리
 */
exports.deleteCategory = async (categoryId) => {
  // 삭제 가능 여부 확인
  const { isDeletable, hasChildren, hasRelatedPosts } = await this.checkCategoryDeletable(categoryId);

  if (!isDeletable) {
    const error = new Error(
      hasChildren
        ? "하위 카테고리가 있어 삭제할 수 없습니다"
        : "이 카테고리를 사용하는 게시물이 있어 삭제할 수 없습니다"
    );
    error.statusCode = 400;
    throw error;
  }

  // 카테고리 삭제
  const deletedCategory = await Category.findByIdAndDelete(categoryId);
  return deletedCategory;
};

/**
 * 특정 카테고리의 게시물 조회 서비스
 * @param {string} categoryId - 카테고리 ID
 * @param {Object} options - 페이지네이션, 정렬 등 옵션
 * @returns {Promise<Object>} 게시물 목록 및 페이지네이션 정보
 */
exports.getCategoryPosts = async (categoryId, options = {}) => {
  const { sort = { createdAt: -1 }, page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  // 카테고리 존재 확인
  const category = await Category.findById(categoryId);
  if (!category) {
    const error = new Error("카테고리를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 필터 설정 (하위 카테고리 포함 옵션 처리)
  let filter = { category: categoryId, isPublic: true };

  if (options.includeSubcategories) {
    const descendantIds = await this.getDescendantCategoryIds(categoryId);
    filter = {
      category: { $in: [categoryId, ...descendantIds] },
      isPublic: true,
    };
  }

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
    category,
    pagination: {
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
