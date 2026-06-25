import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { StateMessage } from "../components/StateMessage";
import type { DashboardSummary, Order, Product } from "../types";

const metrics = [
  { key: "products", label: "Active products", accent: "indigo" },
  { key: "customers", label: "Customers", accent: "teal" },
  { key: "orders", label: "Total orders", accent: "amber" },
  { key: "low_stock_products", label: "Low stock items", accent: "rose" },
] as const;

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardSummary>("/dashboard/summary"),
  });
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/orders") });
  const products = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });

  if (summary.isLoading) return <StateMessage>Loading operational overview...</StateMessage>;
  if (summary.error) return <StateMessage>{summary.error.message}</StateMessage>;

  const lowStock = products.data?.filter((product) => product.stock_quantity <= 5).slice(0, 5) ?? [];

  return (
    <>
      <PageHeader
        title="Today at a glance"
        subtitle="Track catalogue coverage, customer base, order volume, and stock pressure."
        action={<Link className="button primary" to="/orders">Create order</Link>}
      />
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article className={`metric-card ${metric.accent}`} key={metric.key}>
            <span>{metric.label}</span>
            <strong>{summary.data?.[metric.key] ?? 0}</strong>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>Latest sales activity across your customers.</p>
            </div>
            <Link to="/orders">View all</Link>
          </div>
          {(orders.data?.length ?? 0) === 0 ? (
            <StateMessage>No orders have been placed yet.</StateMessage>
          ) : (
            <div className="compact-list">
              {orders.data?.slice(0, 5).map((order) => (
                <div key={order.id}>
                  <div>
                    <strong>Order #{order.id}</strong>
                    <small>{new Date(order.created_at).toLocaleDateString()}</small>
                  </div>
                  <span className={`badge ${order.status}`}>{order.status}</span>
                  <b>${Number(order.total_amount).toFixed(2)}</b>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Low stock watchlist</h2>
              <p>Items at or below five units.</p>
            </div>
            <Link to="/products">Manage</Link>
          </div>
          {lowStock.length === 0 ? (
            <StateMessage>All stocked items look healthy.</StateMessage>
          ) : (
            <div className="compact-list">
              {lowStock.map((product) => (
                <div key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
                  </div>
                  <b className="low-stock">{product.stock_quantity} left</b>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}

