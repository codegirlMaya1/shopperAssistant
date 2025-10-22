// src/components/CategoryList.tsx
import React from "react";

type Props = {
  categories: string[];
  onSelect: (category: string) => void;
};

const CategoryList: React.FC<Props> = ({ categories, onSelect }) => {
  return (
    <div className="mb-4">
      <h5>Categories:</h5>
      <div className="d-flex gap-2 flex-wrap">
        <button className="btn btn-secondary" onClick={() => onSelect("all")}>All</button>
        {categories.map((cat) => (
          <button key={cat} className="btn btn-outline-primary" onClick={() => onSelect(cat)}>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
