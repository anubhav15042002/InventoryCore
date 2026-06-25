export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
};

export type OrderStatus = "placed" | "processing" | "completed" | "cancelled";

export type Order = {
  id: number;
  customer_id: number;
  status: OrderStatus;
  total_amount: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

export type InventoryTransaction = {
  id: number;
  product_id: number;
  change_quantity: number;
  transaction_type: string;
  reference_id: number | null;
  note: string | null;
  created_at: string;
};

export type DashboardSummary = {
  products: number;
  customers: number;
  orders: number;
  low_stock_products: number;
};

