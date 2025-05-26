import { FormEvent, useEffect, useState } from "react";
import { useMainContext } from "../context/MainContext";
import { useNavigate, useSearchParams } from "react-router-dom";

const SearchComponent: React.FC<SearchComponentProps> = ({
  placeholder = "검색어를 입력하세요",
  className = "",
}) => {
  const { categories } = useMainContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);

  const [localSearchTerm, setLocalSearchTerm] = useState<SearchParams>({
    q: query,
    category: category,
    sort: sort,
    page: page,
  });

  useEffect(() => {
    setLocalSearchTerm({
      q: query,
      category: category,
      sort: sort,
      page: page,
    });
  }, [query, category, sort, page]);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParams = new URLSearchParams();

    const currentPage = Number(formData.get("page")?.toString() || 1);
    const currentCategory = formData.get("category")?.toString() || "";
    const currentSort = formData.get("sort")?.toString() || "newest";
    const currentQ = formData.get("q")?.toString() || "";

    if (currentPage > 1) newParams.set("page", String(currentPage));
    if (currentCategory !== "") newParams.set("category", currentCategory);
    if (currentSort !== "newest") newParams.set("sort", currentSort);
    if (currentQ !== "") newParams.set("q", currentQ);

    if (className === "top") {
      navigate("/posts");
    }
    setSearchParams(newParams);
  };
  return (
    <form onSubmit={handleFormSubmit} className={`d-flex me-2`}>
      {className !== "top" && (
        <>
          <div className="col-md-4">
            <select
              id="category"
              name="category"
              className="form-select"
              defaultValue={localSearchTerm.category}
            >
              <option value="">카테고리</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <select
              name="sort"
              id="sort"
              className="form-select"
              defaultValue={localSearchTerm.sort}
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
              <option value="views">조회수순</option>
            </select>
          </div>
        </>
      )}

      <div className="col-md-4">
        <div className="input-group">
          <input
            name="q"
            id="q"
            className="form-control"
            placeholder={placeholder}
            defaultValue={localSearchTerm.q}
          />
          <button
            type="submit"
            className={className !== "top" ? "btn btn-primary" : "btn btn-light"}
          >
            <i className="bi bi-search"></i>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchComponent;
