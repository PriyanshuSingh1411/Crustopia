/* Cart stored in localStorage (client-side only). */

export function getCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  // The native "storage" event only fires in OTHER tabs, not the tab that
  // made the change — so the Navbar's cart badge never updated on the
  // same page until a full reload. This custom event fixes that.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function clearCart() {
  localStorage.removeItem("cart");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function addToCart(product) {
  const cart = getCart();

  const customKey =
    product.size || product.toppings
      ? `${product.id}-${product.size?.id || "default"}-${(product.toppings || [])
          .map((t) => t.id)
          .sort()
          .join("-")}`
      : null;

  if (customKey) {
    const existing = cart.find((item) => item.customKey === customKey);
    if (existing) {
      existing.qty += product.quantity || 1;
    } else {
      cart.push({ ...product, qty: product.quantity || 1, customKey });
    }
  } else {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
  }

  saveCart(cart);
}

export function updateQty(id, qty) {
  const cart = getCart()
    .map((item) => {
      const matchKey = item.customKey || item.id;
      return matchKey === id ? { ...item, qty } : item;
    })
    .filter((item) => item.qty > 0);

  saveCart(cart);
}

export function removeItem(id) {
  const cart = getCart().filter((item) => {
    const matchKey = item.customKey || item.id;
    return matchKey !== id;
  });
  saveCart(cart);
}
