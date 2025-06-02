import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { IReadOnlyUser } from "@mdblog/shared/src/types/user.interface";
import useRequest from "../../hooks/useRequest.hook";

const ProfilePage: React.FC = () => {
  const defaultProfileImage =
    "https://github.com/tjdrbs205/MDBlog/blob/main/public/images/default-profile.png?raw=true";
  const { userData, isAuthenticated, accessToken, profile } = useAuthContext();
  const { execute } = useRequest("/users/profile/update", {
    method: "PUT",
    headers: {},
    manual: true,
    accessToken,
  });
  const [user, setUser] = useState<IReadOnlyUser | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setUser(userData);
      profileImageFile && setProfileImageFile(null);
      profileImage && setProfileImage(null);
    }
  }, [userData]);

  const handleImageUploadClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDeleteImage = () => {
    if (confirm("프로필 이미지를 삭제하시겠습니까?")) {
      setProfileImage(null);
      setProfileImageFile(null);
      if (user) {
        setUser({
          ...user,
          profileImage: defaultProfileImage,
        });
      }
    }
  };

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFormData = new FormData();

    const currentUsername = formData.get("username")?.toString() || "";
    const currentBio = formData.get("bio")?.toString() || "";

    newFormData.append("username", currentUsername);
    newFormData.append("bio", currentBio);
    if (!profileImage) {
      newFormData.append("deleteCheck", "true");
    }
    if (profileImageFile) {
      newFormData.append("profileImage", profileImageFile);
    }
    execute(newFormData).then(() => profile());
  };

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!user) return <div className="text-center">로딩 중...</div>;

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">내 프로필</h3>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-3 text-center">
              <img
                src={
                  profileImage
                    ? profileImage
                    : user.profileImage
                    ? user.profileImage
                    : defaultProfileImage
                }
                alt="Profile"
                className="img-thumbnail rounded-circle mb-3 profile-preview"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
                onError={(e) => (e.currentTarget.src = defaultProfileImage)}
              />
              <div className="space-y-2">
                <button className="btn btn-sm btn-primary w-full" onClick={handleImageUploadClick}>
                  <i className="bi bi-upload me-1"></i>
                  이미지 업로드
                </button>
                {user.profileImage !== "/images/default-profile.png" && (
                  <button className="btn btn-outline-danger w-full" onClick={handleDeleteImage}>
                    <i className="bi bi-trash me-1"></i>
                    이미지 삭제
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <div className="col-md-9">
              <form onSubmit={handleProfileSubmit} id="profileForm">
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    유저 이름
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    defaultValue={user.username}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    이메일
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={user.email}
                    readOnly
                  />
                  <div className="form-text">이메일은 변경할 수 없습니다.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="bio" className="form-label">
                    자기소개
                  </label>
                  <textarea
                    className="form-control"
                    id="bio"
                    name="bio"
                    rows={3}
                    defaultValue={user.bio || ""}
                  ></textarea>
                  <div className="form-text">자신을 소개하는 짧은 글을 작성해보세요.</div>
                </div>

                <div className="d-flex justify-content-between">
                  <Link className="btn btn-outline-secondary" to="">
                    <i className="bi bi-key me-1"></i>비밀번호 변경
                  </Link>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-1"></i> 프로필 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="mb-0">계정 정보</h3>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p>
                <strong>가입일: </strong>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "정보 없음"}
              </p>
              <p>
                <strong>마지막 로그인: </strong>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "정보 없음"}
              </p>
            </div>
            <div className="col-md-6">
              <p>
                <strong>계정 유형: </strong>
                {user.role ? user.role : "정보 없음"}
              </p>
              <p>
                <strong>이메일 인증: </strong>
                준비중
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
