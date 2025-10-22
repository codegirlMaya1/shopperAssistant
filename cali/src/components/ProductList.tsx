// src/components/ProductList.tsx
import React from "react";
import { Product } from "../types";
import styles from "./ProductList.module.css";

interface Props {
  products: Product[];
}

const ProductList: React.FC<Props> = ({ products }) => (
  <div className={styles.grid}>
    {products.map((p) => (
      <div key={p.id} className={styles.card}>
        <img src={p.image} alt={p.title} />
        <h3>{p.title}</h3>
        <p>${p.price}</p>
        <p className={styles.category}>{p.category}</p>
      </div>
    ))}
  </div>
);

export default ProductList;
