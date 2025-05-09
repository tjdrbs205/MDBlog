/**
 * File Service
 * 파일 업로드, 삭제 등의 기능을 제공하는 서비스
 */
const cloudinary = require("../config/cloudinary");
const { bufferToStream } = require("../utils/fileUpload");
const Setting = require("../models/Setting");
const User = require("../models/User");

/**
 * Cloudinary에 이미지 업로드
 * @param {Buffer} buffer - 이미지 버퍼
 * @param {string} folder - 업로드할 폴더 경로 (예: "blog/profile")
 * @returns {Promise<Object>} - Cloudinary 응답 객체
 */
async function uploadImageToCloudinary(buffer, folder) {
  const stream = bufferToStream(buffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.pipe(uploadStream);
  });
}

/**
 * Cloudinary URL에서 public_id 추출
 * @param {string} url - Cloudinary 이미지 URL
 * @param {string} folder - 이미지가 저장된 폴더 경로
 * @returns {string|null} - public_id 또는 null
 */
function extractPublicIdFromUrl(url, folder) {
  if (!url || !url.includes("cloudinary.com")) {
    return null;
  }

  try {
    // URL에서 파일명 추출 (확장자 제외)
    const urlParts = url.split("/");
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const filename = filenameWithExtension.split(".")[0];

    // Cloudinary 폴더 구조 포함한 public_id
    return `${folder}/${filename}`;
  } catch (error) {
    console.error("Public ID 추출 중 오류:", error);
    return null;
  }
}

/**
 * Cloudinary에서 이미지 삭제
 * @param {string} publicId - 삭제할 이미지의 public_id
 * @returns {Promise<Object>} - Cloudinary 응답 객체
 */
async function deleteImageFromCloudinary(publicId) {
  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("이미지 삭제 결과:", result);
    return result;
  } catch (error) {
    console.error("이미지 삭제 중 오류:", error);
    throw error;
  }
}

/**
 * 블로그 프로필 이미지 업로드 처리
 * @param {Buffer} buffer - 이미지 파일 버퍼
 * @returns {Promise<string>} - 업로드된 이미지 URL
 */
async function uploadBlogProfileImage(buffer) {
  // 현재 프로필 이미지 URL 가져오기
  const currentSetting = await Setting.findOne({ key: "profileImage" });
  const currentImageUrl = currentSetting ? currentSetting.value : null;

  // 기존 이미지 public_id 추출
  const oldPublicId = extractPublicIdFromUrl(currentImageUrl, "blog/profile");

  // 새 이미지 업로드
  const result = await uploadImageToCloudinary(buffer, "blog/profile");

  // 프로필 이미지 URL을 설정에 저장
  await Setting.findOneAndUpdate(
    { key: "profileImage" },
    { key: "profileImage", value: result.secure_url },
    { upsert: true, new: true }
  );

  // 이전 이미지 삭제 (있는 경우)
  if (oldPublicId) {
    try {
      await deleteImageFromCloudinary(oldPublicId);
      console.log("기존 이미지 삭제 완료:", oldPublicId);
    } catch (deleteError) {
      console.error("기존 이미지 삭제 중 오류:", deleteError);
      // 이미지 삭제 실패는 전체 프로세스를 실패시키지 않음
    }
  }

  return result.secure_url;
}

/**
 * 블로그 프로필 이미지 삭제 처리
 * @returns {Promise<string>} - 기본 이미지 URL
 */
async function deleteBlogProfileImage() {
  // 현재 프로필 이미지 URL 가져오기
  const currentSetting = await Setting.findOne({ key: "profileImage" });
  const currentImageUrl = currentSetting ? currentSetting.value : null;

  // 기존 이미지 public_id 추출
  const publicId = extractPublicIdFromUrl(currentImageUrl, "blog/profile");

  // Cloudinary에서 이미지 삭제 (있는 경우)
  if (publicId) {
    try {
      await deleteImageFromCloudinary(publicId);
      console.log("Cloudinary에서 이미지 삭제 완료:", publicId);
    } catch (error) {
      console.error("Cloudinary 이미지 삭제 중 오류:", error);
      // 이미지 삭제 실패는 전체 프로세스를 실패시키지 않음
    }
  }

  // 기본 프로필 이미지 URL로 설정
  const defaultImage = "/images/default-profile.png";
  await Setting.findOneAndUpdate(
    { key: "profileImage" },
    { key: "profileImage", value: defaultImage },
    { upsert: true, new: true }
  );

  return defaultImage;
}

/**
 * 사용자 프로필 이미지 업로드 처리
 * @param {string} userId - 사용자 ID
 * @param {Buffer} buffer - 이미지 파일 버퍼
 * @returns {Promise<string>} - 업로드된 이미지 URL
 */
async function uploadUserProfileImage(userId, buffer) {
  // 현재 사용자 정보 가져오기
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  // 기존 이미지 public_id 추출
  const oldPublicId = extractPublicIdFromUrl(user.profileImage, "user/profile");

  // 새 이미지 업로드
  const result = await uploadImageToCloudinary(buffer, "user/profile");

  // 사용자 프로필 이미지 URL 업데이트
  await User.findByIdAndUpdate(userId, { profileImage: result.secure_url });

  // 이전 이미지 삭제 (있는 경우)
  if (oldPublicId) {
    try {
      await deleteImageFromCloudinary(oldPublicId);
      console.log("기존 이미지 삭제 완료:", oldPublicId);
    } catch (deleteError) {
      console.error("기존 이미지 삭제 중 오류:", deleteError);
      // 이미지 삭제 실패는 전체 프로세스를 실패시키지 않음
    }
  }

  return result.secure_url;
}

/**
 * 사용자 프로필 이미지 삭제 처리
 * @param {string} userId - 사용자 ID
 * @returns {Promise<string>} - 기본 이미지 URL
 */
async function deleteUserProfileImage(userId) {
  // 현재 사용자 정보 가져오기
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  console.log("현재 사용자 프로필 이미지:", user.profileImage);

  // 이미지가 기본 이미지이거나 없는 경우 처리
  if (!user.profileImage || user.profileImage === "/images/default-profile.png") {
    console.log("이미 기본 이미지를 사용 중이거나 이미지가 없습니다.");
    return user.profileImage || "/images/default-profile.png";
  }

  // 기존 이미지 public_id 추출
  const publicId = extractPublicIdFromUrl(user.profileImage, "user/profile");
  console.log("추출된 이미지 public_id:", publicId);

  // Cloudinary에서 이미지 삭제 (있는 경우)
  if (publicId) {
    try {
      await deleteImageFromCloudinary(publicId);
      console.log("Cloudinary에서 이미지 삭제 완료:", publicId);
    } catch (error) {
      console.error("Cloudinary 이미지 삭제 중 오류:", error);
      // 이미지 삭제 실패는 전체 프로세스를 실패시키지 않음
    }
  } else {
    console.log("Cloudinary public_id를 추출할 수 없습니다. URL 형식을 확인하세요.");
  }

  // 기본 프로필 이미지 URL로 설정
  const defaultImage = "/images/default-profile.png";
  const updatedUser = await User.findByIdAndUpdate(userId, { profileImage: defaultImage }, { new: true });

  console.log("사용자 이미지가 기본 이미지로 업데이트됨:", updatedUser.profileImage);

  return defaultImage;
}

/**
 * HTML 내용에서 Cloudinary 이미지 URL 추출
 * @param {string} content - HTML 내용
 * @returns {string[]} - 추출된 Cloudinary 이미지 URL 배열
 */
function extractCloudinaryImagesFromContent(content) {
  if (!content) return [];

  const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^"']+/g;
  return content.match(cloudinaryRegex) || [];
}

/**
 * HTML 내용에서 추출한 Cloudinary 이미지들을 삭제
 * @param {string} content - HTML 내용
 * @param {string} folder - Cloudinary 폴더 경로
 * @returns {Promise<Array>} - 삭제된 이미지 결과 배열
 */
async function deleteImagesFromContent(content, folder) {
  if (!content) return [];

  // HTML에서 Cloudinary 이미지 URL 추출
  const imageUrls = extractCloudinaryImagesFromContent(content);
  const results = [];

  // 각 이미지 URL에서 public_id 추출 후 삭제
  for (const url of imageUrls) {
    const publicId = extractPublicIdFromUrl(url, folder);
    if (publicId) {
      try {
        const result = await deleteImageFromCloudinary(publicId);
        results.push({ url, publicId, result });
        console.log(`게시물 이미지 삭제 완료: ${publicId}`);
      } catch (error) {
        console.error(`이미지 삭제 중 오류 (${publicId}):`, error);
        results.push({ url, publicId, error: error.message });
      }
    }
  }

  return results;
}

module.exports = {
  uploadBlogProfileImage,
  deleteBlogProfileImage,
  uploadUserProfileImage,
  deleteUserProfileImage,
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  extractPublicIdFromUrl,
  extractCloudinaryImagesFromContent,
  deleteImagesFromContent,
};
