"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { addToCart } from "@/lib/cart";

export default function PizzaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  // Pizza customization states
  const [selectedSize, setSelectedSize] = useState("medium");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Available sizes with price multipliers
  const sizes = [
    { id: "small", name: "Small", multiplier: 0.8, label: '8"' },
    { id: "medium", name: "Medium", multiplier: 1, label: '10"' },
    { id: "large", name: "Large", multiplier: 1.3, label: '12"' },
    { id: "xlarge", name: "Extra Large", multiplier: 1.6, label: '14"' },
  ];

  // Available toppings with type (veg/nonveg)
  const allToppings = [
    { id: "cheese", name: "Extra Cheese", price: 50, icon: "🧀", type: "veg" },
    { id: "mushrooms", name: "Mushrooms", price: 40, icon: "🍄", type: "veg" },
    { id: "olives", name: "Olives", price: 35, icon: "🫒", type: "veg" },
    { id: "onions", name: "Onions", price: 30, icon: "🧅", type: "veg" },
    {
      id: "tomatoes",
      name: "Fresh Tomatoes",
      price: 35,
      icon: "🍅",
      type: "veg",
    },
    { id: "jalapenos", name: "Jalapeños", price: 30, icon: "🌶️", type: "veg" },
    { id: "corn", name: "Sweet Corn", price: 35, icon: "🌽", type: "veg" },
    { id: "paneer", name: "Paneer", price: 60, icon: "🧈", type: "veg" },
    {
      id: "chicken",
      name: "Grilled Chicken",
      price: 70,
      icon: "🍗",
      type: "nonveg",
    },
    {
      id: "pepperoni",
      name: "Pepperoni",
      price: 65,
      icon: "🥓",
      type: "nonveg",
    },
  ];

  // Get toppings based on pizza type
  const isNonVeg =
    product?.category?.toLowerCase().includes("non veg") ||
    product?.category?.toLowerCase().includes("non-veg") ||
    product?.category?.toLowerCase().includes("nonveg");
  const toppings = isNonVeg
    ? allToppings
    : allToppings.filter((t) => t.type === "veg");

  useEffect(() => {
    fetch(`/api/products/${params.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.product);
        } else {
          setError("Product not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Something went wrong");
        setLoading(false);
      });
  }, [params.id]);

  // Calculate total price
  const calculatePrice = () => {
    if (!product) return 0;

    const basePrice = product.price;
    const sizePrice =
      basePrice * sizes.find((s) => s.id === selectedSize).multiplier;
    const toppingsPrice = selectedToppings.reduce((total, toppingId) => {
      const topping = allToppings.find((t) => t.id === toppingId);
      return total + (topping ? topping.price : 0);
    }, 0);

    return (sizePrice + toppingsPrice) * quantity;
  };

  const handleAddToCart = () => {
    const sizeObj = sizes.find((s) => s.id === selectedSize);
    const selectedToppingsData = selectedToppings.map((id) =>
      allToppings.find((t) => t.id === id),
    );

    addToCart({
      id: product.id,
      name: product.name,
      price: calculatePrice(),
      image: product.image,
      size: sizeObj,
      toppings: selectedToppingsData,
      quantity: quantity,
      specialInstructions: specialInstructions,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const toggleTopping = (toppingId) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId],
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading pizza details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error || "Product not found"}</p>
        <button style={styles.backButton} onClick={() => router.back()}>
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => router.back()}>
        ← Back to Menu
      </button>

      <div style={styles.container}>
        {/* Product Image */}
        <div style={styles.imageSection}>
          <img
            src={
              product.image ||
              "/pizza-bg.jpg"
            }
            alt={product.name}
            style={styles.image}
            onError={(e) => {
              e.currentTarget.src =
                "/pizza-bg.jpg";
            }}
          />
        </div>

        {/* Product Details */}
        <div style={styles.detailsSection}>
          <h1 style={styles.title}>{product.name}</h1>
          <p style={styles.description}>{product.description}</p>
          <p style={styles.category}>{product.category}</p>

          {/* Size Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Choose Size</h3>
            <div style={styles.sizeGrid}>
              {sizes.map((size) => (
                <button
                  key={size.id}
                  style={{
                    ...styles.sizeButton,
                    ...(selectedSize === size.id
                      ? styles.sizeButtonActive
                      : {}),
                  }}
                  onClick={() => setSelectedSize(size.id)}
                >
                  <span style={styles.sizeName}>{size.name}</span>
                  <span style={styles.sizeLabel}>{size.label}</span>
                  <span style={styles.sizePrice}>
                    ₹{Math.round(product.price * size.multiplier)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Toppings Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Extra Toppings</h3>
            <p style={styles.sectionSubtitle}>Add as many as you like</p>
            <div style={styles.toppingsGrid}>
              {toppings.map((topping) => (
                <button
                  key={topping.id}
                  style={{
                    ...styles.toppingButton,
                    ...(selectedToppings.includes(topping.id)
                      ? styles.toppingButtonActive
                      : {}),
                  }}
                  onClick={() => toggleTopping(topping.id)}
                >
                  <span style={styles.toppingIcon}>{topping.icon}</span>
                  <span style={styles.toppingName}>{topping.name}</span>
                  <span style={styles.toppingPrice}>+₹{topping.price}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Quantity</h3>
            <div style={styles.quantityContainer}>
              <button
                style={styles.quantityButton}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span style={styles.quantityValue}>{quantity}</span>
              <button
                style={styles.quantityButton}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Special Instructions</h3>
            <textarea
              style={styles.textarea}
              placeholder="Any special requests? (allergies, extra sauce, etc.)"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div style={styles.priceSection}>
            <div style={styles.priceRow}>
              <span>Base Price (Size)</span>
              <span>
                ₹
                {Math.round(
                  product.price *
                    sizes.find((s) => s.id === selectedSize).multiplier,
                )}
              </span>
            </div>
            {selectedToppings.length > 0 && (
              <div style={styles.priceRow}>
                <span>Toppings ({selectedToppings.length})</span>
                <span>
                  ₹
                  {selectedToppings.reduce((total, id) => {
                    const topping = allToppings.find((t) => t.id === id);
                    return total + (topping ? topping.price : 0);
                  }, 0)}
                </span>
              </div>
            )}
            <div style={styles.priceRow}>
              <span>Quantity</span>
              <span>×{quantity}</span>
            </div>
            <div style={styles.totalPrice}>
              <span>Total</span>
              <span>₹{calculatePrice()}</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            style={{
              ...styles.addButton,
              background: added ? "#28a745" : styles.addButton.background,
            }}
            onClick={handleAddToCart}
          >
            {added ? "Added to Cart ✓" : `Add to Cart - ₹${calculatePrice()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== STYLES ==================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fff5f5 0%, #fafafa 100%)",
    padding: "20px",
    color: "#111827",
  },

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "18px",
  },

  errorContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    gap: "20px",
  },

  errorText: {
    color: "#ef4444",
    fontSize: "18px",
  },

  backButton: {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "20px",
    display: "inline-block",
  },

  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  imageSection: {
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  },

  image: {
    width: "100%",
    height: "500px",
    objectFit: "cover",
    display: "block",
  },

  detailsSection: {
    padding: "10px",
  },

  title: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "10px",
    color: "#111827",
  },

  description: {
    fontSize: "16px",
    color: "#6b7280",
    marginBottom: "8px",
    lineHeight: "1.6",
  },

  category: {
    fontSize: "14px",
    color: "#9ca3af",
    marginBottom: "24px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  section: {
    marginBottom: "24px",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#111827",
  },

  sectionSubtitle: {
    fontSize: "13px",
    color: "#9ca3af",
    marginBottom: "12px",
    marginTop: "-8px",
  },

  sizeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },

  sizeButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 8px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  sizeButtonActive: {
    borderColor: "#ff4d4f",
    background: "#fff5f5",
  },

  sizeName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },

  sizeLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "2px 0",
  },

  sizePrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ff4d4f",
  },

  toppingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
  },

  toppingButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 8px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "12px",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  toppingButtonActive: {
    borderColor: "#ff4d4f",
    background: "#fff5f5",
  },

  toppingIcon: {
    fontSize: "24px",
    marginBottom: "4px",
  },

  toppingName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },

  toppingPrice: {
    fontSize: "12px",
    color: "#ff4d4f",
    fontWeight: "600",
  },

  quantityContainer: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },

  quantityButton: {
    width: "40px",
    height: "40px",
    border: "2px solid #e5e7eb",
    borderRadius: "50%",
    background: "#fff",
    fontSize: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityValue: {
    fontSize: "20px",
    fontWeight: "700",
    minWidth: "30px",
    textAlign: "center",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },

  priceSection: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },

  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#6b7280",
  },

  totalPrice: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "2px dashed #e5e7eb",
  },

  addButton: {
    width: "100%",
    padding: "16px",
    background: "#ff4d4f",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};
