import { ICategoryWithChildren } from "@mdblog/shared/src/types/categories.interface";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";

const CategoryTree: React.FC<{
  categories: ICategoryWithChildren[];
  categoryMap: Record<string, number>;
  selectedCategory?: string | null;
  level?: number;
}> = ({ categories, categoryMap, selectedCategory, level = 0 }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const clickCategory = (catId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", catId);

    // 현재 경로가 /posts가 아니면 /posts로 이동
    if (!location.pathname.includes("/posts")) {
      navigate(`/posts?${newParams.get("category")}`);
    } else {
      setSearchParams(newParams);
    }
  };

  return (
    <>
      {categories.map((cat) => {
        const postCount = categoryMap[cat.id] || 0;
        const hasChildren = cat.children && cat.children.length > 0;
        const isActive = selectedCategory && selectedCategory === cat.id;
        const collapseId = `collapse-cat-${cat.id}`;
        return (
          <li key={cat.id} className={`category-item level-${level}`}>
            <div className="category-header">
              {hasChildren ? (
                <button
                  className="toggle-btn"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${collapseId}`}
                  aria-expanded="false"
                  aria-controls={collapseId}
                  tabIndex={0}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              ) : (
                <span className="toggle-placeholder"></span>
              )}
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  clickCategory(cat.id);
                }}
                className={`category-link ${isActive ? "active" : ""}`}
              >
                <i className="bi bi-folder catrgory-icon"></i>
                {cat.name}
                {postCount > 0 && <span className="count">({postCount})</span>}
              </Link>
            </div>
            {hasChildren && (
              <ul className="sub-categories collapse" id={collapseId}>
                <CategoryTree
                  categories={cat.children}
                  categoryMap={categoryMap}
                  selectedCategory={selectedCategory}
                  level={level + 1}
                />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};

export default CategoryTree;
