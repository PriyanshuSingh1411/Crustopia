"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";

export default function MenuPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ===============================
     FETCH PRODUCTS FROM DB
  =============================== */
  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.products);
          setFilteredProducts(data.products);
        } else {
          setError("Failed to load pizzas");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter((pizza) => pizza.name.toLowerCase().includes(query)),
      );
    }
  }, [searchQuery, products]);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heading}>🍕 Explore Our Pizzas</h1>
        <p style={styles.subheading}>
          Handcrafted pizzas made with premium ingredients ❤️
        </p>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search pizzas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* LOADING */}
      {loading && <p style={{ textAlign: "center" }}>Loading pizzas...</p>}

      {/* ERROR */}
      {!loading && error && (
        <p style={{ textAlign: "center", color: "red" }}>{error}</p>
      )}

      {/* EMPTY */}
      {!loading && !error && products.length === 0 && (
        <p style={{ textAlign: "center" }}>No pizzas available</p>
      )}

      {/* PRODUCTS */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div style={styles.grid}>
          {filteredProducts.map((pizza) => (
            <div key={pizza.id} style={styles.card}>
              {/* CLICKABLE AREA (GO TO INNER PAGE) */}
              <Link
                href={`/menu/${pizza.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div>
                  <div style={styles.imageWrap}>
                    <img
                      src={
                        pizza.image ||
                        "/pizza-bg.jpg"
                      }
                      alt={pizza.name}
                      style={styles.image}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/pizza-bg.jpg";
                      }}
                    />
                  </div>

                  <div style={styles.content}>
                    <h3>{pizza.name}</h3>
                    <p style={styles.desc}>{pizza.description}</p>
                  </div>
                </div>
              </Link>

              {/* PRICE + ADD BUTTON (OUTSIDE LINK) */}
              <div style={styles.bottom}>
                <span style={styles.price}>₹{pizza.price}</span>

                <button
                  style={{
                    ...styles.button,
                    background:
                      addedId === pizza.id
                        ? "#28a745"
                        : styles.button.background,
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent Link click
                    addToCart({
                      id: pizza.id,
                      name: pizza.name,
                      price: pizza.price,
                      image: pizza.image,
                    });

                    setAddedId(pizza.id);

                    setTimeout(() => {
                      setAddedId(null);
                    }, 1500);
                  }}
                >
                  {addedId === pizza.id ? "Added ✓" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===============================
   STYLES
================================ */
const styles = {
  page: {
    padding: "0 0 40px 0",
    background: "linear-gradient(180deg, #fff5f5 0%, #fafafa 100%)",
    minHeight: "100vh",
    color: "black",
  },

  hero: {
    background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
    padding: "50px 20px 40px",
    marginBottom: "30px",
  },

  heading: {
    textAlign: "center",
    fontSize: "38px",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#fff",
  },

  subheading: {
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    fontSize: "16px",
    marginBottom: "24px",
  },

  searchContainer: {
    maxWidth: "500px",
    margin: "0 auto",
  },

  searchInput: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: "30px",
    border: "none",
    fontSize: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    outline: "none",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
  },

  card: {
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease",
  },

  imageWrap: {
    aspectRatio: "1 / 1",
    overflow: "hidden",
    background: "#eee",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  content: {
    padding: "16px",
  },

  desc: {
    color: "#666",
    fontSize: "14px",
    margin: "8px 0 12px",
  },

  bottom: {
    padding: "0 16px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    fontSize: "18px",
    fontWeight: "700",
  },

  button: {
    background: "#ff4d4f",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
