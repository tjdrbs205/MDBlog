import { MouseEvent, useEffect, useState } from "react";
import useRequest from "../hooks/useRequest.hook";
import { useAuthContext } from "../context/AuthContext";

type CategoryListProps = {
  categoriesHierarchical: any;
  level?: number;
  onEditCategory?: (categoryData: any) => void;
};

const CategoryList: React.FC<CategoryListProps> = ({
  categoriesHierarchical,
  level = 0,
  onEditCategory,
}) => {
  const { accessToken, refreshToken } = useAuthContext();
  const [catagoryId, setCategoryId] = useState<string | null>(null);
  const { execute: deleteCategory } = useRequest(`/category/${catagoryId}`, {
    method: "DELETE",
    manual: true,
    accessToken,
    onTokenRefresh: refreshToken,
  });

  const handleEditCategory = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const id = button.getAttribute("data-id");
    const name = button.getAttribute("data-name");
    const description = button.getAttribute("data-description");
    const order = button.getAttribute("data-order");
    const parent = button.getAttribute("data-parent");

    const categoryData = { id, name, description, order, parent };

    if (onEditCategory) {
      onEditCategory(categoryData);
    }
  };

  const handleDeleteCategory = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      const button = e.currentTarget;
      const id = button.getAttribute("data-id");
      setCategoryId(id);
    }
  };

  useEffect(() => {
    if (catagoryId) {
      deleteCategory()
        .then((res) => {
          if (res.error) {
            alert(res.error || "카테고리 삭제 중 오류가 발생했습니다.");
            return;
          }
          alert("카테고리가 성공적으로 삭제되었습니다.");
          setCategoryId(null);
        })
        .catch((error) => {
          console.error("Error deleting category:", error);
          alert("카테고리 삭제 중 오류가 발생했습니다.");
        });
    }
  }, [catagoryId]);

  return (
    <>
      {categoriesHierarchical.map((cat: any) => {
        const hasChildren = cat.children && cat.children.length > 0;
        return (
          <li key={cat.id} className={`category-item level-${level}`}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="category-info" style={{ paddingLeft: `${level * 1.25}px` }}>
                <span className="category-name fw-medium">{cat.name}</span>
              </div>
              <div className="category-actions">
                <button
                  className="btn btn-sm btn-outline-primary edit-category d-flex"
                  data-id={cat.id}
                  data-name={cat.name}
                  data-description={cat.description}
                  data-order={cat.order}
                  data-parent={cat.parent ? cat.parent : ""}
                  onClick={handleEditCategory}
                >
                  <i className="bi bi-pencil" />
                </button>
                <button
                  onClick={handleDeleteCategory}
                  data-id={cat.id}
                  className="btn btn-sm btn-outline-danger d-flex"
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            </div>
            {hasChildren && (
              <ul className="category-children">
                <CategoryList
                  categoriesHierarchical={cat.children}
                  level={level + 1}
                  onEditCategory={onEditCategory}
                />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};

export default CategoryList;
