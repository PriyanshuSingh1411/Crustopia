"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";

const STEPS = [
  { key: "Placed", label: "Order Placed", icon: "📦" },
  { key: "Preparing", label: "Preparing Food", icon: "🍳" },
  { key: "Out for Delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "Delivered", label: "Delivered", icon: "✅" },
  { key: "Cancelled", label: "Cancelled", icon: "❌" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const res = await fetch("/api/orders", { credentials: "include" });
    if (!res.ok) return setOrders([]);
    setOrders(await res.json());
  };

  useEffect(() => {
    loadOrders();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadOrders();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const i = setInterval(() => {
      if (!document.hidden) {
        loadOrders();
      }
    }, 5000);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div style={pageStyle}>
      <style jsx global>{`
        .order-card-content {
          grid-template-columns: 1fr 340px;
        }
        .order-card-left {
          border-right: 1px solid #e2e8f0;
        }
        @media (max-width: 860px) {
          .order-card-content {
            grid-template-columns: 1fr;
          }
          .order-card-left {
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
        }
      `}</style>
      <div style={headerStyle}>
        <div style={headerIconBox}>
          <span style={headerIcon}>📦</span>
        </div>
        <div>
          <h1 style={titleStyle}>My Orders</h1>
          <p style={subtitleStyle}>Track your food in real time</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={emptyStateStyle}>
          <span style={emptyIcon}>🍕</span>
          <p style={emptyTitle}>No orders yet</p>
          <p style={emptyText}>
            You haven&apos;t placed any orders yet. Start ordering your favorite
            pizza!
          </p>
          <Link href="/menu" style={orderNowButton}>
            Order Now
          </Link>
        </div>
      ) : (
        <div style={ordersListStyle}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={loadOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onStatusChange }) {
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);

  const downloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Pizza Shop", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", 105, 28, { align: "center" });
    doc.line(20, 34, 190, 34);
    doc.setFontSize(11);
    doc.text(`Order ID: #${order.id}`, 20, 44);
    doc.text(`Status: ${order.status}`, 20, 52);
    doc.text(
      `Date: ${new Date(order.created_at || Date.now()).toLocaleString()}`,
      20,
      60,
    );
    let y = 78;
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 10, "F");
    doc.text("Item", 22, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 150, y);
    doc.setFont("helvetica", "normal");
    y += 10;
    order.items?.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name}`, 22, y);
      doc.text(String(item.quantity), 122, y);
      doc.text(`Rs. ${item.price * item.quantity}`, 150, y);
      y += 8;
    });
    y += 8;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Total Amount:", 120, y);
    doc.text(`Rs. ${order.total}`, 150, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for ordering with Pizza Shop!", 105, 285, {
      align: "center",
    });
    doc.save(`invoice-order-${order.id}.pdf`);
  };

  const cancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    const res = await fetch(`/api/orders/${order.id}/cancel`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Failed to parse response:", e);
    }
    if (!res.ok) {
      alert(data?.message || "Unable to cancel order");
      return;
    }
    alert("Order cancelled successfully");
    if (onStatusChange) onStatusChange();
  };

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={orderInfoStyle}>
          <span style={orderIdStyle}>#{order.id}</span>
          <span style={orderDateStyle}>
            {new Date(order.created_at || Date.now()).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </span>
        </div>
        <span style={getStatusBadge(order.status)}>{order.status}</span>
      </div>

      <div style={cardContentStyle} className="order-card-content">
        <div style={leftColumnStyle} className="order-card-left">
          <div style={productsSectionStyle}>
            <h3 style={sectionTitleStyle}>Items Ordered</h3>
            <div style={productsListStyle}>
              {order.items?.map((item, i) => (
                <div key={i} style={productCardStyle}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={productImageStyle}
                  />
                  <div style={productDetailsStyle}>
                    <h4 style={productNameStyle}>{item.name}</h4>
                    <p style={productDescStyle}>{item.description}</p>
                    <div style={productMetaStyle}>
                      <span style={quantityBadgeStyle}>
                        Qty: {item.quantity}
                      </span>
                      <span style={itemPriceStyle}>
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={trackingSectionStyle}>
            <h3 style={sectionTitleStyle}>Order Tracking</h3>
            <div style={timelineStyle}>
              {STEPS.map((step, i) => {
                const completed = i < currentIndex;
                const active = i === currentIndex;
                const isCancelled = order.status === "Cancelled";
                return (
                  <div key={step.key} style={timelineStepStyle}>
                    <div style={timelineDotWrapperStyle}>
                      <div
                        style={{
                          ...timelineDotStyle,
                          background:
                            isCancelled && i === 4
                              ? "#ef4444"
                              : completed
                                ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                                : active
                                  ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                  : "#e5e7eb",
                          boxShadow:
                            completed || active
                              ? "0 4px 15px rgba(0,0,0,0.2)"
                              : "none",
                        }}
                      >
                        {completed
                          ? "✓"
                          : isCancelled && i === 4
                            ? "✕"
                            : step.icon}
                      </div>
                      {i !== STEPS.length - 1 && (
                        <div
                          style={{
                            ...timelineLineStyle,
                            background:
                              completed || (active && !isCancelled)
                                ? "linear-gradient(90deg, #16a34a 0%, #667eea 100%)"
                                : "#e5e7eb",
                          }}
                        />
                      )}
                    </div>
                    <div style={timelineLabelStyle}>
                      <span
                        style={{
                          ...timelineLabelTextStyle,
                          fontWeight: active ? "700" : "500",
                          color: completed || active ? "#1e293b" : "#9ca3af",
                        }}
                      >
                        {step.label}
                      </span>
                      <span style={timelineStatusStyle}>
                        {completed
                          ? "Done"
                          : active
                            ? "Current"
                            : isCancelled && i === 4
                              ? "Cancelled"
                              : "Upcoming"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={summaryHeaderStyle}>
            <div style={summaryIconStyle}>🍕</div>
            <h4 style={summaryTitleStyle}>Order Summary</h4>
          </div>
          <div style={summaryDetailsStyle}>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Order ID</span>
              <strong style={summaryValueStyle}>#{order.id}</strong>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Status</span>
              <strong style={getSummaryStatusStyle(order.status)}>
                {order.status}
              </strong>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Subtotal</span>
              <span>₹{order.total}</span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Delivery</span>
              <span>Free</span>
            </div>
            <div style={summaryDividerStyle} />
            <div style={totalRowStyle}>
              <span style={totalLabelStyle}>Total</span>
              <span style={totalAmountStyle}>₹{order.total}</span>
            </div>
          </div>
          <div style={summaryActionsStyle}>
            <button onClick={downloadInvoice} style={downloadButtonStyle}>
              📄 Download Invoice
            </button>
            {order.status !== "Cancelled" &&
              order.status !== "Delivered" &&
              order.status !== "Out for Delivery" && (
                <button onClick={cancelOrder} style={cancelButtonStyle}>
                  ❌ Cancel Order
                </button>
              )}
          </div>
          <p style={helpTextStyle}>Need help? Contact support anytime.</p>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   STYLES
================================ */
const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
  padding: "40px 24px",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  color: "#1e293b",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "36px",
  maxWidth: "1100px",
  margin: "0 auto 36px auto",
};

const headerIconBox = {
  width: "72px",
  height: "72px",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
};

const headerIcon = {
  fontSize: "36px",
};

const titleStyle = {
  fontSize: "36px",
  fontWeight: "800",
  margin: 0,
  color: "#1e293b",
};

const subtitleStyle = {
  fontSize: "16px",
  color: "#64748b",
  margin: "4px 0 0 0",
};

const emptyStateStyle = {
  textAlign: "center",
  padding: "80px 40px",
  background: "#fff",
  borderRadius: "24px",
  maxWidth: "500px",
  margin: "0 auto",
  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
};

const emptyIcon = {
  fontSize: "80px",
  display: "block",
  marginBottom: "20px",
};

const emptyTitle = {
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px 0",
  color: "#1e293b",
};

const emptyText = {
  fontSize: "16px",
  color: "#64748b",
  margin: "0 0 28px 0",
};

const orderNowButton = {
  display: "inline-block",
  padding: "14px 32px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  textDecoration: "none",
  borderRadius: "14px",
  fontWeight: "600",
  fontSize: "16px",
  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
};

const ordersListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "28px",
  maxWidth: "1100px",
  margin: "0 auto",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "24px",
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  border: "1px solid #e2e8f0",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 28px",
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  borderBottom: "1px solid #e2e8f0",
};

const orderInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const orderIdStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1e293b",
};

const orderDateStyle = {
  fontSize: "13px",
  color: "#64748b",
};

function getStatusBadge(status) {
  const statusConfig = {
    Delivered: {
      bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
      color: "#166534",
    },
    "Out for Delivery": {
      bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
      color: "#1e40af",
    },
    Preparing: {
      bg: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
      color: "#854d0e",
    },
    Placed: {
      bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
      color: "#7c3aed",
    },
    Cancelled: {
      bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
      color: "#991b1b",
    },
  };
  const config = statusConfig[status] || statusConfig["Placed"];
  return {
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "700",
    background: config.bg,
    color: config.color,
  };
}

const cardContentStyle = {
  display: "grid",
  // Column widths are set responsively via the .order-card-content CSS
  // class below — this fixed 340px right column used to force a
  // horizontal squeeze on phone-width screens.
};

const leftColumnStyle = {
  padding: "28px",
};

const productsSectionStyle = {
  marginBottom: "32px",
};

const sectionTitleStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1e293b",
  margin: "0 0 18px 0",
};

const productsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const productCardStyle = {
  display: "flex",
  gap: "16px",
  padding: "16px",
  background: "#f8fafc",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
};

const productImageStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "12px",
  objectFit: "cover",
  border: "2px solid #e2e8f0",
};

const productDetailsStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const productNameStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1e293b",
  margin: "0 0 4px 0",
};

const productDescStyle = {
  fontSize: "13px",
  color: "#64748b",
  margin: "0 0 8px 0",
};

const productMetaStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const quantityBadgeStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#64748b",
  background: "#e2e8f0",
  padding: "4px 10px",
  borderRadius: "20px",
};

const itemPriceStyle = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#667eea",
};

const trackingSectionStyle = {
  marginTop: "8px",
};

const timelineStyle = {
  display: "flex",
  justifyContent: "space-between",
  position: "relative",
  padding: "20px 0",
};

const timelineStepStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flex: 1,
  position: "relative",
};

const timelineDotWrapperStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  position: "relative",
};

const timelineDotStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: "700",
  zIndex: 2,
  flexShrink: 0,
};

const timelineLineStyle = {
  height: "4px",
  flex: 1,
  margin: "0 -8px",
  borderRadius: "4px",
  zIndex: 1,
};

const timelineLabelStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  marginTop: "12px",
};

const timelineLabelTextStyle = {
  fontSize: "13px",
};

const timelineStatusStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  marginTop: "2px",
};

const summaryCardStyle = {
  padding: "28px",
  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  display: "flex",
  flexDirection: "column",
};

const summaryHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid #e2e8f0",
};

const summaryIconStyle = {
  width: "52px",
  height: "52px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
};

const summaryTitleStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1e293b",
  margin: 0,
};

const summaryDetailsStyle = {
  flex: 1,
};

const summaryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
};

const summaryLabelStyle = {
  fontSize: "14px",
  color: "#64748b",
};

const summaryValueStyle = {
  fontSize: "14px",
  color: "#1e293b",
};

function getSummaryStatusStyle(status) {
  const colors = {
    Delivered: "#16a34a",
    "Out for Delivery": "#2563eb",
    Preparing: "#d97706",
    Placed: "#7c3aed",
    Cancelled: "#ef4444",
  };
  return { fontSize: "14px", color: colors[status] || "#64748b" };
}

const summaryDividerStyle = {
  height: "1px",
  background: "#e2e8f0",
  margin: "16px 0",
};

const totalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const totalLabelStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1e293b",
};

const totalAmountStyle = {
  fontSize: "24px",
  fontWeight: "800",
  color: "#667eea",
};

const summaryActionsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "24px",
};

const downloadButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  padding: "14px 20px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
  color: "#fff",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 4px 15px rgba(22, 163, 74, 0.3)",
};

const cancelButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  padding: "14px 20px",
  borderRadius: "14px",
  border: "2px solid #fee2e2",
  background: "#fff",
  color: "#ef4444",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
};

const helpTextStyle = {
  marginTop: "auto",
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center",
};
