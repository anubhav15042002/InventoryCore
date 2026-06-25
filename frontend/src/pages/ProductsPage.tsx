import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StateMessage } from "../components/StateMessage";
import type { Product } from "../types";

type ProductPayload = {
  sku: string;
  name: string;
  description: string;
  price: string;
  stock_quantity?: number;
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: ProductPayload }) =>
      api<Product>(id ? `/products/${id}` : "/products", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api<void>(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const adjust = useMutation({
    mutationFn: ({ id, quantity_delta, note }: { id: number; quantity_delta: number; note: string }) =>
      api<Product>(`/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ quantity_delta, note }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAdjusting(null);
    },
  });

  const filtered = products.data?.filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Maintain your catalogue, pricing, and current stock levels."
        action={<button className="button primary" onClick={() => setEditing("new")}>Add product</button>}
      />
      <section className="panel">
        <div className="toolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" />
          <span>{filtered?.length ?? 0} products</span>
        </div>
        {products.isLoading ? (
          <StateMessage>Loading products...</StateMessage>
        ) : products.error ? (
          <StateMessage>{products.error.message}</StateMessage>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered?.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><small>{product.description || "No description"}</small></td>
                    <td><code>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td><span className={`stock ${product.stock_quantity <= 5 ? "low" : ""}`}>{product.stock_quantity}</span></td>
                    <td className="actions">
                      <button onClick={() => setAdjusting(product)}>Adjust stock</button>
                      <button onClick={() => setEditing(product)}>Edit</button>
                      <button className="danger-link" onClick={() => confirm("Delete this product?") && remove.mutate(product.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && (
        <Modal title={editing === "new" ? "Add product" : "Edit product"} onClose={() => setEditing(null)}>
          <ProductForm product={editing === "new" ? undefined : editing} error={save.error?.message} onSubmit={(payload) => save.mutate({ id: editing === "new" ? undefined : editing.id, payload })} />
        </Modal>
      )}
      {adjusting && (
        <Modal title={`Adjust stock: ${adjusting.name}`} onClose={() => setAdjusting(null)}>
          <StockForm error={adjust.error?.message} onSubmit={(quantity_delta, note) => adjust.mutate({ id: adjusting.id, quantity_delta, note })} />
        </Modal>
      )}
    </>
  );
}

function ProductForm({ product, error, onSubmit }: { product?: Product; error?: string; onSubmit: (payload: ProductPayload) => void }) {
  const [values, setValues] = useState<ProductPayload>({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    stock_quantity: product ? undefined : 0,
  });
  const update = (key: keyof ProductPayload, value: string | number) => setValues({ ...values, [key]: value });
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
      {error && <p className="form-error">{error}</p>}
      <label>SKU<input required value={values.sku} onChange={(event) => update("sku", event.target.value)} /></label>
      <label>Product name<input required value={values.name} onChange={(event) => update("name", event.target.value)} /></label>
      <label>Price<input required min="0" step="0.01" type="number" value={values.price} onChange={(event) => update("price", event.target.value)} /></label>
      {product === undefined && <label>Starting stock<input required min="0" type="number" value={values.stock_quantity} onChange={(event) => update("stock_quantity", Number(event.target.value))} /></label>}
      <label className="full-width">Description<textarea value={values.description} onChange={(event) => update("description", event.target.value)} /></label>
      <button className="button primary full-width">Save product</button>
    </form>
  );
}

function StockForm({ error, onSubmit }: { error?: string; onSubmit: (quantity: number, note: string) => void }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  return (
    <form className="form-grid" onSubmit={(event: FormEvent) => { event.preventDefault(); onSubmit(quantity, note); }}>
      {error && <p className="form-error">{error}</p>}
      <label>Quantity change<input required type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /><small>Use a negative number to remove stock.</small></label>
      <label>Reason<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Shipment received, damaged item..." /></label>
      <button className="button primary full-width">Apply adjustment</button>
    </form>
  );
}

