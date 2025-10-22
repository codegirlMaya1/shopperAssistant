// src/components/FilterButton.tsx
import React from "react";

type Props = {
  onFilter: (input: string) => void;
};

const FilterButton: React.FC<Props> = ({ onFilter }) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        placeholder="Search or filter products..."
        onChange={(e) => onFilter(e.target.value)}
        style={{ padding: "0.5rem", width: "60%" }}
      />
    </div>
  );
};

export default FilterButton;
