import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { StateMessage } from "../components/StateMessage";
import type { InventoryTransaction, Product } from "../types";

export function InventoryPage() {
  const transactions = useQuery({ queryKey: ["inventory"], queryFn: () => api<InventoryTransaction[]>("/inventory-transactions") });
  const products = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });
  const productNames = useMemo(() => new Map(products.data?.map((product) => [product.id, `${product.name} (${product.sku})`])), [products.data]);

  return (
    <>
      <PageHeader title="Inventory log" subtitle="An auditable history of manual stock updates and order movements." />
      <section className="panel">
        {transactions.isLoading ? <StateMessage>Loading inventory history...</StateMessage> : transactions.error ? <StateMessage>{transactions.error.message}</StateMessage> : (transactions.data?.length ?? 0) === 0 ? <StateMessage>No inventory movements have been recorded yet.</StateMessage> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Timestamp</th><th>Product</th><th>Movement</th><th>Type</th><th>Reference</th><th>Note</th></tr></thead>
              <tbody>{transactions.data?.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.created_at).toLocaleString()}</td>
                  <td><strong>{productNames.get(transaction.product_id) ?? `Product ${transaction.product_id}`}</strong></td>
                  <td><span className={`movement ${transaction.change_quantity > 0 ? "positive" : "negative"}`}>{transaction.change_quantity > 0 ? "+" : ""}{transaction.change_quantity}</span></td>
                  <td>{transaction.transaction_type.replaceAll("_", " ")}</td>
                  <td>{transaction.reference_id ? `Order #${transaction.reference_id}` : "-"}</td>
                  <td>{transaction.note || "-"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

