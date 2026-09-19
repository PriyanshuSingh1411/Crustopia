"use client";
import { useEffect, useState } from "react";
import { getCart, updateQty, removeItem } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({});
  const router = useRouter();

  useEffect(() => {
    setCart(getCart());
    // NOTE: this page used to hardcode a ₹40 delivery fee, completely
    // disconnected from the delivery fee an admin actually sets in
    // Settings — which is what checkout uses. That mismatch was
    // confusing (cart said ₹40, checkout said FREE for the same order).
    // Both pages now read the same value.
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const refresh = () => setCart(getCart());

  const currency = settings.currency_symbol || "₹";
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const deliveryFee = Number(settings.delivery_fee || 0);
  const freeDeliveryAbove = Number(settings.free_delivery_above || 0);
  const delivery =
    cart.length === 0
      ? 0
      : freeDeliveryAbove > 0 && subtotal >= freeDeliveryAbove
        ? 0
        : deliveryFee;

  const total = subtotal + delivery;

  if (cart.length === 0) {
    return (
      <div style={{ ...styles.page, background: "#ffffff" }}>
        <div style={styles.empty}>
          <h1>🛒 Your cart is empty</h1>
          <p>Add some delicious pizzas to continue 🍕</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page} className="cart-page">
      <style jsx global>{`
        .cart-container {
          grid-template-columns: 2fr 1fr;
        }
        @media (max-width: 800px) {
          .cart-container {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .cart-page {
            padding: 20px !important;
          }
        }
      `}</style>
      <h1 style={styles.heading}>Your Cart</h1>

      <div style={styles.container} className="cart-container">
        {/* CART ITEMS */}
        <div style={styles.items}>
          {cart.map((item, index) => (
            <div key={item.customKey || item.id || index} style={styles.card}>
              <img
                src={
                  item.image
                    ? item.image
                    : "/pizza-bg.jpg"
                }
                alt={item.name}
                style={styles.image}
                onError={(e) => {
                  e.currentTarget.src =
                    "/pizza-bg.jpg";
                }}
              />

              <div style={styles.info}>
                <h3>{item.name}</h3>

                {/* Show customization details if available */}
                {(item.size || item.toppings) && (
                  <div style={styles.customizations}>
                    {item.size && (
                      <p style={styles.customText}>
                        📏 Size: {item.size.name} ({item.size.label})
                      </p>
                    )}
                    {item.toppings && item.toppings.length > 0 && (
                      <p style={styles.customText}>
                        🍕 Toppings:{" "}
                        {item.toppings.map((t) => t.name).join(", ")}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p style={styles.specialText}>
                        📝 Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                )}

                <p style={styles.price}>{currency}{item.price}</p>

                <div style={styles.qtyRow}>
                  <button
                    style={styles.qtyBtn}
                    onClick={() => {
                      updateQty(item.customKey || item.id, item.qty - 1);
                      refresh();
                    }}
                  >
                    −
                  </button>

                  <span style={styles.qty}>{item.qty}</span>

                  <button
                    style={styles.qtyBtn}
                    onClick={() => {
                      updateQty(item.customKey || item.id, item.qty + 1);
                      refresh();
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                style={styles.remove}
                onClick={() => {
                  removeItem(item.customKey || item.id);
                  refresh();
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* SUMMARY */}
        <div style={styles.summary}>
          <h3>Order Summary</h3>

          <div style={styles.row}>
            <span>Subtotal</span>
            <span>{currency}{subtotal}</span>
          </div>

          <div style={styles.row}>
            <span>Delivery</span>
            <span>{delivery === 0 ? "FREE" : `${currency}${delivery}`}</span>
          </div>

          <hr />

          <div style={{ ...styles.row, fontWeight: "bold" }}>
            <span>Total</span>
            <span>{currency}{total}</span>
          </div>

          <button
            style={styles.checkout}
            onClick={() => router.push("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */
const styles = {
  page: {
    background: "#f5f5f5",
    minHeight: "100vh",
    padding: "40px",
    color: "black",
  },

  heading: {
    textAlign: "center",
    marginBottom: "30px",
  },

  container: {
    display: "grid",
    // Column widths are set purely by the .cart-container CSS class /
    // media query below — this used to also be set inline right here,
    // which silently overrode the responsive class every time (inline
    // styles always beat class-based CSS, media query or not), so the
    // "responsive" fix never actually did anything.
    gap: "30px",
    maxWidth: "1100px",
    margin: "auto",
  },

  items: {},

  card: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: "12px",
    padding: "15px",
    marginBottom: "15px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
  },

  image: {
    width: "90px",
    height: "90px",
    borderRadius: "10px",
    objectFit: "cover",
    marginRight: "15px",
  },

  info: {
    flex: 1,
  },

  price: {
    color: "#555",
    marginBottom: "10px",
  },

  qtyRow: {
    display: "flex",
    alignItems: "center",
  },

  qtyBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: "18px",
  },

  qty: {
    margin: "0 12px",
    fontWeight: "bold",
  },

  remove: {
    background: "transparent",
    border: "none",
    color: "#ff4d4f",
    cursor: "pointer",
    fontWeight: "600",
  },

  summary: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    height: "fit-content",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
    position: "sticky",
    top: "20px",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    margin: "10px 0",
  },

  checkout: {
    width: "100%",
    background: "#ff4d4f",
    color: "#fff",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    marginTop: "15px",
    fontSize: "16px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    marginTop: "80px",
  },

  customizations: {
    marginBottom: "8px",
  },

  customText: {
    fontSize: "12px",
    color: "#666",
    margin: "2px 0",
  },

  specialText: {
    fontSize: "11px",
    color: "#888",
    fontStyle: "italic",
    margin: "4px 0",
  },
};