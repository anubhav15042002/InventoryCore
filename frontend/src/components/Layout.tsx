import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", short: "DB" },
  { to: "/products", label: "Products", short: "PR" },
  { to: "/customers", label: "Customers", short: "CU" },
  { to: "/orders", label: "Orders", short: "OR" },
  { to: "/inventory", label: "Inventory Log", short: "IL" },
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">IC</span>
          <div>
            <strong>InventoryCore</strong>
            <small>Stock, orders, and customer control</small>
          </div>
        </div>
        <div className="topbar-status">
          <span className="status-dot" />
          Live API
        </div>
      </header>
      <nav className="workspace-tabs" aria-label="Workspace navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === "/"}>
            <span>{link.short}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

