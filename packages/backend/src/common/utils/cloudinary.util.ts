import cloudinary from "../../config/data/cloudinary";
import { SettingModel } from "../../config/models/Setting";
import { UserModel } from "../../modules/user/model/user.model";
import { bufferToStream } from "./fileUpload.util";

async function uploadImageToCloudinary(buffer: Buffer, folder: string): Promise<any> {
  const stream = bufferToStream(buffer);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    stream.pipe(uploadStream);
  });
}

async function extractPublicIdFromUrl(url: string | null, folder: string) {
  if (!url || !url.includes("cloudinary.com")) {
    return null;
  }

  try {
    const urlParts = url.split("/");
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const filename = filenameWithExtension.split(".")[0];

    return `${folder}/${filename}`;
  } catch (error) {
    console.error("Public ID 추출 중 오류:", error);
    return null;
  }
}

async function deleteImageFromCloudinary(publicId: string | null) {
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

async function uploadBlogProfileImage(buffer: Buffer) {
  const currentSetting = await SettingModel.findOne({ key: "profileImage" });
  const currentImageUrl = currentSetting ? currentSetting.value : null;

  const oldPulbicId = await extractPublicIdFromUrl(currentImageUrl, "blog/profile");

  const result = await uploadImageToCloudinary(buffer, "blog/profile");

  await SettingModel.findOneAndUpdate(
    { key: "profileImage" },
    { key: "profileImage", value: result.secure_url },
    { upsert: true, new: true }
  );

  if (oldPulbicId) {
    try {
      await deleteImageFromCloudinary(oldPulbicId);
      console.log("기존 이미지 삭제 성공", oldPulbicId);
    } catch (error) {
      console.error("기존 이미지 삭제 중 오류", error);
    }
  }
  return result.secure_url;
}

async function deleteBlogProfileImage() {
  const currentSetting = await SettingModel.findOne({ key: "profileImage" });
  const currentImageUrl = currentSetting ? currentSetting.value : null;

  const publicId = await extractPublicIdFromUrl(currentImageUrl, "blog/profile");

  if (publicId) {
    try {
      await deleteImageFromCloudinary(publicId);
      console.log("Cloudinary에서 이미지 삭제 완료:", publicId);
    } catch (error) {
      console.error("Cloudinary 이미지 삭제 중 오류:", error);
    }
  }

  const defaultImage = process.env.DEFAULT_IMAGE_URL;
  await SettingModel.findOneAndUpdate(
    { key: "profileImage" },
    { key: "profileImage", value: defaultImage },
    { upsert: true, new: true }
  );

  return defaultImage;
}

async function uploadUserProfileImage(userId: string, buffer: Buffer) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const oldPublicId = await extractPublicIdFromUrl(user.profileImage, "user/profile");

  const result = await uploadImageToCloudinary(buffer, "user/profile");

  await UserModel.findByIdAndUpdate(userId, { profileImage: result.secure_url });

  if (oldPublicId) {
    try {
      await deleteImageFromCloudinary(oldPublicId);
      console.log("기존 이미지 삭제 완료:", oldPublicId);
    } catch (deleteError) {
      console.error("기존 이미지 삭제 중 오류:", deleteError);
    }
  }

  return result.secure_url;
}

async function deleteUserProfileImage(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  console.log("현재 사용자 프로필 이미지:", user.profileImage);

  if (!user.profileImage || user.profileImage === process.env.DEFAULT_IMAGE_URL) {
    console.log("이미 기본 이미지를 사용 중이거나 이미지가 없습니다.");
    return user.profileImage || process.env.DEFAULT_IMAGE_URL;
  }

  const publicId = await extractPublicIdFromUrl(user.profileImage, "user/profile");
  console.log("추출된 이미지 public_id:", publicId);

  if (publicId) {
    try {
      await deleteImageFromCloudinary(publicId);
      console.log("Cloudinary에서 이미지 삭제 완료:", publicId);
    } catch (error) {
      console.error("Cloudinary 이미지 삭제 중 오류:", error);
    }
  } else {
    console.log("Cloudinary public_id를 추출할 수 없습니다. URL 형식을 확인하세요.");
  }

  const defaultImage = process.env.DEFAULT_IMAGE_URL;
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { profileImage: defaultImage },
    { new: true }
  );

  console.log("사용자 이미지가 기본 이미지로 업데이트됨:", updatedUser?.readOnlyUser.profileImage);

  return defaultImage;
}

function extractCloudinaryImagesFromContent(content: string | null): string[] {
  if (!content) return [];

  const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^"']+/g;
  return content.match(cloudinaryRegex) || [];
}

async function deleteImagesFromContent(content: string, folder: string) {
  if (!content) return [];

  const imageUrls = extractCloudinaryImagesFromContent(content);
  const results = [];

  for (const url of imageUrls) {
    const publicId = await extractPublicIdFromUrl(url, folder);
    console.log("추출된 publicId:", publicId);
    if (publicId) {
      try {
        const result = await deleteImageFromCloudinary(publicId);
        results.push({ url, publicId, result });
        console.log(`게시물 이미지 삭제 완료: ${publicId}`);
      } catch (error: any) {
        console.error(`이미지 삭제 중 오류 (${publicId}):`, error);
        results.push({ url, publicId, error: error.message });
      }
    }
  }

  return results;
}

async function moveImageToPostFolder(tempPublicId: string, postId: string) {
  try {
    const fileName = tempPublicId.replace("blog/content/temp/", "");
    const newPublicId = `blog/content/posts/${postId}/${fileName}`;

    const result = await cloudinary.uploader.rename(tempPublicId, newPublicId);
    console.log("이미지 이동 결과:", result);
    return result.secure_url;
  } catch (error) {
    console.error("이미지 이동 중 오류:", error);
    return null;
  }
}

async function moveImagesToPostFolder(content: string, postId: string): Promise<string> {
  try {
    const imageUrls = extractCloudinaryImagesFromContent(content);
    const tempImageUrls = imageUrls.filter((url) => url.includes("/temp/"));
    if (tempImageUrls.length === 0) {
      return content;
    }
    let updatedContent = content;

    for (const imageUrl of tempImageUrls) {
      const publicId = await extractPublicIdFromUrl(imageUrl, "blog/content/temp");

      if (publicId && publicId.includes("temp/")) {
        const newImageUrl = await moveImageToPostFolder(publicId, postId);
        if (newImageUrl) {
          console.log("새 이미지 URL:", newImageUrl);
          updatedContent = updatedContent.replace(imageUrl, newImageUrl);
        }
      }
    }
    return updatedContent;
  } catch (error) {
    console.error("이미지 이동 중 오류:", error);
    return content;
  }
}

export {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  uploadBlogProfileImage,
  deleteBlogProfileImage,
  uploadUserProfileImage,
  deleteUserProfileImage,
  extractCloudinaryImagesFromContent,
  deleteImagesFromContent,
  extractPublicIdFromUrl,
  moveImagesToPostFolder,
};
