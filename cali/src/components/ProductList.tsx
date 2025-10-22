import React from "react";
import { Product } from "../types";
import styles from "./ProductList.module.css";

interface Props {
  products: Product[];
  onProductClick?: (product: Product) => void; // ✅ Add this line
}

const ProductList: React.FC<Props> = ({ products, onProductClick }) => (
  <div className={styles.grid}>
    {products.map((p) => (
      <div
        key={p.id}
        className={styles.card}
        onClick={() => onProductClick?.(p)} // ✅ Trigger AI read on click
        style={{ cursor: "pointer" }}
      >
        <img src={p.image} alt={p.title} />
        <h3>{p.title}</h3>
        <p>${p.price}</p>
        <p className={styles.category}>{p.category}</p>
      </div>
    ))}
  </div>
);

export default ProductList;
