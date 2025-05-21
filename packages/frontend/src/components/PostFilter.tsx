import { ICategory } from "@mdblog/shared/src/types/categories.interface";
import React, { useState } from "react";

interface PostFilterProps {
  onFilterChange: (filters: { category: string; tag: string; sort: string; q: string }) => void;
}

const PostFilter: React.FC<PostFilterProps> = ({ onFilterChange }) => {
  const [categories, setCategories] = useState<ICategory[]>([]);

  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");
  const [q, setQ] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // onFilterChange({ category, sort, q });
  };

  return (
    <form>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((cat: any) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </form>
  );
};
