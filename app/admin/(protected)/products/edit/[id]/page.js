"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    is_featured: false,
    is_available: true,
  });

  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     LOAD PRODUCT
  =============================== */
  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/products/${id}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load product");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setForm({
            name: data.product.name || "",
            description: data.product.description || "",
            price: data.product.price || "",
            category: data.product.category || "",
            is_featured: !!data.product.is_featured,
            is_available: data.product.is_available !== false,
          });
          setCurrentImage(data.product.image || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  /* ===============================
     UPDATE PRODUCT
  =============================== */
  const submit = async () => {
    setError("");
    if (!form.name || !form.price) {
      setError("Name and price are required");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("price", form.price);
      data.append("category", form.category);
      data.append("is_featured", String(form.is_featured));
      data.append("is_available", String(form.is_available));

      if (imageFile) {
        data.append("image", imageFile);
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        body: data,
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Update failed");
        return;
      }

      router.push("/admin/products");
    } catch (err) {
      setError("Server error");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     UI
  =============================== */
  if (loading) {
    return <p style={{ padding: 40 }}>Loading product...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">✏️ Edit Pizza</h1>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* NAME */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        {/* DESCRIPTION */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows="3"
            className="w-full border rounded-lg px-3 py-2"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>

        {/* PRICE */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Price (₹)</label>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: e.target.value }))
            }
          />
        </div>

        {/* CATEGORY */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
          />
        </div>

        {/* IMAGE */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Image</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          <img
            src={imageFile ? URL.createObjectURL(imageFile) : currentImage}
            alt="Preview"
            className="mt-3 w-full h-48 object-cover rounded-lg border"
          />
        </div>

        {/* FEATURED / AVAILABLE */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
              className="h-4 w-4 accent-orange-500"
            />
            Featured on homepage
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))}
              className="h-4 w-4 accent-orange-500"
            />
            Available for ordering
          </label>
        </div>

        {/* ACTION */}
        <button
          onClick={submit}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Product"}
        </button>
      </div>
    </div>
  );
}
