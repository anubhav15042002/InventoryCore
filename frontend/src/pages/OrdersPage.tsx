import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StateMessage } from "../components/StateMessage";
import type { Customer, Order, OrderStatus, Product } from "../types";

type DraftItem = { product_id: number; quantity: number };

export function OrdersPage() {
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/orders") });
  const customers = useQuery({ queryKey: ["customers"], queryFn: () => api<Customer[]>("/customers") });
  const products = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });
  const [creating, setCreating] = useState(false);
  const customerNames = useMemo(() => new Map(customers.data?.map((customer) => [customer.id, customer.name])), [customers.data]);
  const productNames = useMemo(() => new Map(products.data?.map((product) => [product.id, product.name])), [products.data]);
  const create = useMutation({
    mutationFn: (payload: { customer_id: number; items: DraftItem[] }) => api<Order>("/orders", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setCreating(false);
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => api<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <>
      <PageHeader title="Orders" subtitle="Place customer orders and track fulfilment from one workspace." action={<button className="button primary" onClick={() => setCreating(true)}>Create order</button>} />
      <section className="panel">
        {orders.isLoading ? <StateMessage>Loading orders...</StateMessage> : orders.error ? <StateMessage>{orders.error.message}</StateMessage> : (orders.data?.length ?? 0) === 0 ? <StateMessage>No orders have been placed yet.</StateMessage> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Placed</th><th>Status</th></tr></thead>
              <tbody>{orders.data?.map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.id}</strong></td>
                  <td>{customerNames.get(order.customer_id) ?? `Customer ${order.customer_id}`}</td>
                  <td>{order.items.map((item) => `${productNames.get(item.product_id) ?? `Product ${item.product_id}`} x ${item.quantity}`).join(", ")}</td>
                  <td><strong>${Number(order.total_amount).toFixed(2)}</strong></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td><select className={`status-select ${order.status}`} value={order.status} disabled={order.status === "completed" || order.status === "cancelled"} onChange={(event) => updateStatus.mutate({ id: order.id, status: event.target.value as OrderStatus })}><option value="placed">Placed</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {creating && <Modal title="Create order" onClose={() => setCreating(false)}><OrderForm customers={customers.data ?? []} products={products.data ?? []} error={create.error?.message} onSubmit={(payload) => create.mutate(payload)} /></Modal>}
    </>
  );
}

function OrderForm({ customers, products, error, onSubmit }: { customers: Customer[]; products: Product[]; error?: string; onSubmit: (payload: { customer_id: number; items: DraftItem[] }) => void }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? 0);
  const [items, setItems] = useState<DraftItem[]>([{ product_id: products[0]?.id ?? 0, quantity: 1 }]);
  const updateItem = (index: number, update: Partial<DraftItem>) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));
  const total = items.reduce((sum, item) => sum + Number(products.find((product) => product.id === item.product_id)?.price ?? 0) * item.quantity, 0);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ customer_id: customerId, items }); }}>
      {error && <p className="form-error">{error}</p>}
      {customers.length === 0 || products.length === 0 ? <p className="form-error">Add at least one customer and one product before creating an order.</p> : (
        <>
          <label className="full-width">Customer<select value={customerId} onChange={(event) => setCustomerId(Number(event.target.value))}>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} ({customer.email})</option>)}</select></label>
          <div className="full-width order-lines">
            {items.map((item, index) => <div className="order-line" key={index}>
              <label>Product<select value={item.product_id} onChange={(event) => updateItem(index, { product_id: Number(event.target.value) })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.stock_quantity} in stock)</option>)}</select></label>
              <label>Qty<input min="1" max={products.find((product) => product.id === item.product_id)?.stock_quantity} required type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></label>
              {items.length > 1 && <button className="icon-button" type="button" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>&times;</button>}
            </div>)}
            <button className="text-button" type="button" onClick={() => setItems([...items, { product_id: products[0].id, quantity: 1 }])}>+ Add another product</button>
          </div>
          <div className="order-total full-width"><span>Order total</span><strong>${total.toFixed(2)}</strong></div>
          <button className="button primary full-width">Place order</button>
        </>
      )}
    </form>
  );
}

