import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useRequest from "../../hooks/useRequest.hook";
import { ISettingData } from "@mdblog/shared/src/types/setting.interface";

const SettingPage: React.FC = () => {
  const { defaultProfileImage, accessToken, refreshToken } = useAuthContext();
  const { data, loading } = useRequest<ISettingData>("/admin/settings", {
    accessToken,
    onTokenRefresh: refreshToken,
  });
  const { execute: updateSettins } = useRequest("/admin/settings", {
    method: "PUT",
    headers: {},
    manual: true,
    accessToken,
    onTokenRefresh: refreshToken,
  });

  const [settings, setSettings] = useState<ISettingData | null>(null);
  const [blogProfileImage, setBlogProfileImage] = useState<string | null>(null);
  const [blogProfileImageFile, setBlogProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBlogProfileImageUploadClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };
  const handleBlogProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBlogProfileImageFile(file);
      const render = new FileReader();
      render.onload = (e) => {
        if (e.target?.result) {
          setBlogProfileImage(e.target.result as string);
        }
      };
      render.readAsDataURL(file);
    }
  };
  const handleDeleteBlogProfileImage = () => {
    if (confirm("프로필 이미지를 삭제하시겠습니까?")) {
      setBlogProfileImage(null);
      setBlogProfileImageFile(null);
      if (settings) {
        setSettings({
          ...settings,
          profileImage: defaultProfileImage,
        });
      }
    }
  };
  const handleSaveSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formData.append("currentBlogProfileImage", settings?.profileImage || defaultProfileImage);

    if (blogProfileImageFile) {
      formData.append("blogProfileImage", blogProfileImageFile);
    }

    formData.forEach((value, key) => {
      console.log(`FormData - ${key}: ${value}`);
    });

    updateSettins(formData).then((res) => {
      if (res.error) {
        console.error("설정 저장 실패:", res.error);
        alert("설정 저장 중 오류가 발생했습니다.");
        return;
      }
      alert("설정이 저장되었습니다.");
    });
  };

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="settings-container">
      <h1 className="mb-4">사이트 설정</h1>

      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">프로필 이미지</h5>
            </div>

            <div className="carf-body">
              <div className="text-center">
                <img
                  src={
                    blogProfileImage
                      ? blogProfileImage
                      : settings?.profileImage
                      ? settings.profileImage
                      : defaultProfileImage
                  }
                  alt="Blog Profile Image"
                  className="rounded-circle mb-3 profile-preview"
                  style={{ width: "150px", height: "150px", objectFit: "cover" }}
                />

                <div className="d-grid gap-2">
                  <div className="mb-3">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleBlogProfileImageUploadClick}
                    >
                      <i className="bi bi-upload me-1" />
                      이미지 업로드
                    </button>
                    {settings?.profileImage !== defaultProfileImage && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDeleteBlogProfileImage}
                      >
                        <i className="bi bi-trash me-1" />
                        이미지 삭제
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      ref={fileInputRef}
                      onChange={handleBlogProfileImageChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">기본 설정</h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleSaveSettings}>
                <div className="mb-3">
                  <label htmlFor="siteDescription" className="form-label">
                    사이트 설명
                  </label>
                  <textarea
                    name="siteDescription"
                    id="siteDescription"
                    className="form-control"
                    rows={3}
                    placeholder="사이트 하단에 표시될 설명을 입력하세요."
                    defaultValue={settings?.siteDescription || ""}
                  />
                  <div className="form-text">사이트 하단에 표시될 설명을 입력하세요.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="aboutBlog" className="form-label">
                    블로그 소개
                  </label>
                  <textarea
                    name="aboutBlog"
                    id="aboutBlog"
                    className="form-control"
                    rows={8}
                    placeholder="블로그에 대한 소개를 입력하세요."
                    defaultValue={settings?.aboutBlog || ""}
                  />
                  <div className="form-text">
                    블로그 소개 페이지에 표시되는 소개글입니다. 마크다운 형식을 지원합니다.
                  </div>
                </div>

                <hr className="my-4" />
                <h5 className="mb-3">연락처 정보</h5>

                <div className="mb-3">
                  <label htmlFor="contactEmail" className="form-label">
                    이메일
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope" />
                    </span>
                    <input
                      type="email"
                      name="contactEmail"
                      id="contactEmail"
                      className="form-control"
                      placeholder="연락 이메일 주소"
                      defaultValue={settings?.contactEmail || ""}
                    />
                  </div>
                  <div className="form-text">블로그 소개 페이지에 표시되는 연락 이메일입니다.</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="contactGithub" className="form-label">
                    GitHub
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-github" />
                    </span>
                    <input
                      type="text"
                      name="contactGithub"
                      id="contactGithub"
                      className="form-control"
                      placeholder="GitHub 프로필 URL"
                      defaultValue={settings?.contactGithub || ""}
                    />
                  </div>
                  <div className="form-text">GitHub 사용자명(예: mdblog) 또는 전체 URL</div>
                </div>

                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-1" />
                    설정 저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingPage;
