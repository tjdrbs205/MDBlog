import { FormEvent, useEffect, useState } from "react";
import { useSearchContext } from "../context/SearchContext";
import { useMainContext } from "../context/MainContext";

const SearchComponent: React.FC<SearchComponentProps> = ({
  placeholder = "검색어를 입력하세요",
  className = "",
}) => {
  const { searchTerm, setSearchTerm } = useSearchContext();
  const { categories } = useMainContext();
  const [localSearchTerm, setLocalSearchTerm] = useState<SearchParams>(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParams: SearchParams = {
      category: formData.get("category")?.toString() || undefined,
      sort: formData.get("sort")?.toString() || undefined,
      q: formData.get("q")?.toString() || undefined,
    };

    setSearchTerm(newParams);
  };

  return (
    <form onSubmit={handleFormSubmit} className={`Search_${className}`}>
      <div className="col-md-4">
        <label htmlFor="category" className="form-label">
          카테고리
        </label>
        <select
          id="category"
          name="category"
          className="form-select"
          defaultValue={localSearchTerm.category}
        >
          <option value="">전체</option>
          {categories.map((cat) => (
            <option value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="col-md-4">
        <label htmlFor="sort" className="form-label">
          정렬
        </label>
        <select name="sort" id="sort" className="form-select" defaultValue={localSearchTerm.sort}>
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="title">제목순</option>
          <option value="views">조회수순</option>
        </select>
      </div>

      <div className="col-md-4">
        <label htmlFor="q" className="form-label">
          검색
        </label>
        <div className="input-group">
          <input
            name="q"
            id="q"
            className="form-control"
            placeholder={placeholder}
            defaultValue={localSearchTerm.q}
          />
          <button type="submit" className="btn btn-primary">
            검색
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchComponent;
