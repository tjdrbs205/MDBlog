/**
 * Auth Service
 * 인증 관련 비즈니스 로직을 처리하는 서비스 계층
 */
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * 사용자 등록 서비스
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<Object>} 생성된 사용자
 */
exports.registerUser = async (userData) => {
  const { username, email, password, displayName } = userData;

  // 이메일 중복 확인
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("이미 사용 중인 이메일입니다");
    error.statusCode = 400;
    throw error;
  }

  // 사용자명 중복 확인
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    const error = new Error("이미 사용 중인 사용자명입니다");
    error.statusCode = 400;
    throw error;
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 12);

  // 사용자 생성
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    displayName: displayName || username,
    role: "user",
    isActive: true,
    joinedAt: Date.now(),
  });

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

/**
 * 사용자 로그인 서비스
 * @param {string} email - 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<Object>} 사용자 정보
 */
exports.loginUser = async (email, password) => {
  // 이메일로 사용자 찾기
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("이메일 또는 비밀번호가 일치하지 않습니다");
    error.statusCode = 401;
    throw error;
  }

  // 비밀번호 확인
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("이메일 또는 비밀번호가 일치하지 않습니다");
    error.statusCode = 401;
    throw error;
  }

  // 계정 활성화 상태 확인
  if (!user.isActive) {
    const error = new Error("비활성화된 계정입니다");
    error.statusCode = 403;
    throw error;
  }

  // 마지막 로그인 시간 업데이트
  user.lastLogin = Date.now();
  await user.save();

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

/**
 * 비밀번호 변경 서비스
 * @param {string} userId - 사용자 ID
 * @param {string} currentPassword - 현재 비밀번호
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 업데이트된 사용자
 */
exports.changePassword = async (userId, currentPassword, newPassword) => {
  // 사용자 찾기
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 현재 비밀번호 확인
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    const error = new Error("현재 비밀번호가 일치하지 않습니다");
    error.statusCode = 401;
    throw error;
  }

  // 새 비밀번호와 현재 비밀번호가 같은지 확인
  if (currentPassword === newPassword) {
    const error = new Error("새 비밀번호는 현재 비밀번호와 다르게 설정해주세요");
    error.statusCode = 400;
    throw error;
  }

  // 새 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 비밀번호 업데이트
  user.password = hashedPassword;
  await user.save();

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

/**
 * 프로필 업데이트 서비스
 * @param {string} userId - 사용자 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 사용자
 */
exports.updateProfile = async (userId, updateData) => {
  const { displayName, bio, website } = updateData;

  // 사용자 찾기
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 필드 업데이트
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (website !== undefined) user.website = website;

  user.updatedAt = Date.now();
  await user.save();

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

/**
 * 사용자 정보 조회 서비스
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} 사용자 정보
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

/**
 * 비밀번호 재설정 토큰 생성 서비스
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 토큰 및 사용자 정보
 */
exports.generatePasswordResetToken = async (email) => {
  // 사용자 찾기
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("해당 이메일을 가진 사용자가 없습니다");
    error.statusCode = 404;
    throw error;
  }

  // 토큰 생성
  const token = crypto.randomBytes(32).toString("hex");

  // 토큰 저장 및 만료 시간 설정 (1시간)
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1시간

  await user.save();

  return {
    user,
    token,
  };
};

/**
 * 비밀번호 재설정 서비스
 * @param {string} token - 비밀번호 재설정 토큰
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 업데이트된 사용자
 */
exports.resetPassword = async (token, newPassword) => {
  // 토큰으로 사용자 찾기
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("유효하지 않거나 만료된 토큰입니다");
    error.statusCode = 400;
    throw error;
  }

  // 새 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // 비밀번호 업데이트 및 토큰 정보 초기화
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  // 비밀번호 필드 제거하고 반환
  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};
