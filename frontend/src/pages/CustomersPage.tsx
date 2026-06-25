import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { StateMessage } from "../components/StateMessage";
import type { Customer } from "../types";

type CustomerPayload = { name: string; email: string; phone: string; address: string };

export function CustomersPage() {
  const queryClient = useQueryClient();
  const customers = useQuery({ queryKey: ["customers"], queryFn: () => api<Customer[]>("/customers") });
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [search, setSearch] = useState("");
  const save = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: CustomerPayload }) =>
      api<Customer>(id ? `/customers/${id}` : "/customers", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api<void>(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const filtered = customers.data?.filter((customer) =>
    `${customer.name} ${customer.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Customers" subtitle="Keep customer details accurate for smooth order processing." action={<button className="button primary" onClick={() => setEditing("new")}>Add customer</button>} />
      <section className="panel">
        <div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" /><span>{filtered?.length ?? 0} customers</span></div>
        {customers.isLoading ? <StateMessage>Loading customers...</StateMessage> : customers.error ? <StateMessage>{customers.error.message}</StateMessage> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
              <tbody>{filtered?.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td><td>{customer.email}</td><td>{customer.phone || "-"}</td><td>{customer.address || "-"}</td>
                  <td className="actions"><button onClick={() => setEditing(customer)}>Edit</button><button className="danger-link" onClick={() => confirm("Delete this customer?") && remove.mutate(customer.id)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <Modal title={editing === "new" ? "Add customer" : "Edit customer"} onClose={() => setEditing(null)}><CustomerForm customer={editing === "new" ? undefined : editing} error={save.error?.message} onSubmit={(payload) => save.mutate({ id: editing === "new" ? undefined : editing.id, payload })} /></Modal>}
    </>
  );
}

function CustomerForm({ customer, error, onSubmit }: { customer?: Customer; error?: string; onSubmit: (payload: CustomerPayload) => void }) {
  const [values, setValues] = useState<CustomerPayload>({ name: customer?.name ?? "", email: customer?.email ?? "", phone: customer?.phone ?? "", address: customer?.address ?? "" });
  const update = (key: keyof CustomerPayload, value: string) => setValues({ ...values, [key]: value });
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
      {error && <p className="form-error">{error}</p>}
      <label>Name<input required value={values.name} onChange={(event) => update("name", event.target.value)} /></label>
      <label>Email<input required type="email" value={values.email} onChange={(event) => update("email", event.target.value)} /></label>
      <label>Phone<input value={values.phone} onChange={(event) => update("phone", event.target.value)} /></label>
      <label className="full-width">Address<textarea value={values.address} onChange={(event) => update("address", event.target.value)} /></label>
      <button className="button primary full-width">Save customer</button>
    </form>
  );
}

