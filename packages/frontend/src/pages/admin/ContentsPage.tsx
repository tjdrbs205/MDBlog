import { FormEvent, useRef, useState } from "react";
import CategoryList from "../../components/CategoryList";
import { useMainContext } from "../../context/MainContext";
import useRequest from "../../hooks/useRequest.hook";
import { useAuthContext } from "../../context/AuthContext";

const ContentsPage: React.FC = () => {
  const { accessToken, refreshToken } = useAuthContext();
  const { categories, categoriesHierarchical, tags } = useMainContext();
  const editModalRef = useRef<HTMLDivElement>(null);
  const modalInstanceRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState({
    id: "",
    name: "",
    description: "",
    order: "0",
    parent: "",
  });

  const { execute: requestCategory } = useRequest("/category", {
    method: "POST",
    manual: true,
    accessToken,
    onTokenRefresh: refreshToken,
  });

  const handleEditCategorySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const categoryData = {
      id: editCategoryData.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      order: formData.get("order") as string,
      parent: formData.get("parent") as string,
    };

    console.log("수정할 카테고리 데이터:", categoryData);
  };

  const handleAddCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const categoryData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      order: formData.get("order") as string,
      parent: formData.get("parent") as string,
    };

    requestCategory(categoryData).then((res) => {
      if (res.error) {
        console.error("카테고리 추가 실패:", res.error);
        return;
      }
      console.log("카테고리 추가 성공:", res.data);
    });
  };

  const handleEditCategory = (categoryData: any) => {
    setEditCategoryData({
      id: categoryData.id,
      name: categoryData.name,
      description: categoryData.description || "",
      order: categoryData.order || "0",
      parent: categoryData.parent || "",
    });

    setIsModalOpen(true);

    setTimeout(() => {
      if (editModalRef.current) {
        modalInstanceRef.current = new (window as any).bootstrap.Modal(editModalRef.current, {
          backdrop: true,
          keyboard: true,
          focus: true,
        });
        modalInstanceRef.current.show();
      }
    }, 100);
  };

  const closeModal = () => {
    if (modalInstanceRef.current) {
      modalInstanceRef.current.hide();
    }
    setIsModalOpen(false);
    setEditCategoryData({
      id: "",
      name: "",
      description: "",
      order: "0",
      parent: "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditCategoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="content-managment">
      <h1 className="mb-4">콘텐츠 관리</h1>
      <ul className="nav nav-tabs mb-4" id="contentTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
            id="categories-tab"
            data-bs-toggle="tab"
            data-bs-target="#categories"
            type="button"
            role="tab"
            aria-controls="categories"
            aria-selected="true"
          >
            <i className="bi bi-folder me-1" />
            카테고리
          </button>
        </li>

        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="tags-tab"
            data-bs-toggle="tab"
            data-bs-target="#tags"
            type="button"
            role="tab"
            aria-controls="tags"
            aria-selected="false"
          >
            <i className="bi bi-tags me-1" />
            태그
          </button>
        </li>
      </ul>

      <div className="tab-content" id="contentTabsContent">
        <div
          className="tab-pane fade show active"
          id="categories"
          role="tabpanel"
          aria-labelledby="categories-tab"
        >
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">카테고리 추가</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddCategory}>
                    <div className="mb-3">
                      <label htmlFor="categoryName" className="form-label">
                        카테고리명
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="categoryName"
                        name="name"
                        placeholder="카테고리명을 입력하세요"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="categoryDescription" className="form-label">
                        설명
                      </label>
                      <textarea
                        className="form-control"
                        id="categoryDescription"
                        name="description"
                        placeholder="카테고리 설명을 입력하세요"
                        rows={2}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="categoryParent" className="form-label">
                        상위 카테고리
                      </label>
                      <select className="form-select" id="categoryParent" name="parent">
                        <option value="">최상위 카테고리로 생성</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="categoryOrder" className="form-label">
                        표시 순서
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="htmlForegoryOrder"
                        name="order"
                        placeholder="순서"
                        defaultValue={0}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-1" />
                      카테고리 추가
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-8">카테고리 목록</h5>
                  <span className="badge bg-primary">{categories ? categories.length : 0}</span>
                </div>
                <div className="card-body">
                  {categories && categories.length > 0 ? (
                    <ul className="list-group category-tree">
                      {
                        <CategoryList
                          categoriesHierarchical={categoriesHierarchical}
                          onEditCategory={handleEditCategory}
                        />
                      }
                    </ul>
                  ) : (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2" />
                      현재 등록된 카테고리가 없습니다. 카테고리를 추가해주세요.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tab-pane fade" id="tags" role="tabpanel" aria-labelledby="tags-tab">
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">태그 추가</h5>
                </div>
                <div className="card-body">
                  <form action="/tags" method="POST">
                    <div className="mb-3">
                      <label htmlFor="tagName" className="form-label">
                        태그명
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="tagName"
                        name="name"
                        placeholder="태그명"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                      <i className="bi bi-plus-circle me-1"></i>태그 추가
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">태그 목록</h5>
                  <span className="badge bg-primary">{tags ? tags.length : 0}</span>
                </div>
                <div className="card-body">
                  {tags && tags.length > 0 ? (
                    <div className="tag-cloud">
                      {tags.map((tag) => (
                        <div key={tag.id} className="tag-item d-inline-flex align-items-center">
                          <span className="badge bg-secondary me-2">#{tag.name}</span>
                          <form onSubmit={() => {}} className="tag-delete-form">
                            <button type="submit" className="btn btn-sm btn-danger">
                              <i className="bi bi-trash" />
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>등록된 태그가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 카테고리 수정 모달 */}
        <div
          className="modal fade"
          id="editCategoryModal"
          aria-hidden={!isModalOpen}
          tabIndex={-1}
          ref={editModalRef}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">카테고리 수정</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditCategorySubmit}>
                  <input
                    type="hidden"
                    id="editCategoryId"
                    name="id"
                    value={editCategoryData.id}
                    onChange={handleInputChange}
                  />
                  <div className="mb-3">
                    <label htmlFor="editName" className="form-label">
                      카테고리명
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="editName"
                      name="name"
                      value={editCategoryData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editDescription" className="form-label">
                      설명
                    </label>
                    <textarea
                      className="form-control"
                      id="editDescription"
                      name="description"
                      value={editCategoryData.description}
                      onChange={handleInputChange}
                      placeholder="카테고리 설명을 입력하세요"
                      rows={2}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editParent" className="form-label">
                      상위 카테고리
                    </label>
                    <select
                      className="form-select"
                      id="editParent"
                      name="parent"
                      value={editCategoryData.parent}
                      onChange={handleInputChange}
                    >
                      <option value="">최상위 카테고리로 설정</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editOrder" className="form-label">
                      표시 순서
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="editOrder"
                      name="order"
                      placeholder="순서"
                      value={editCategoryData.order}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="d-grid gap-2">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-circle me-1"></i>저장하기
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentsPage;
