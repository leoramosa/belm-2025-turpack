export interface IOrder {
  id: number;
  customer_id: number;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items: IOrderItem[];
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    dni?: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
    company?: string;
    billing_distrito_pro?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    dni?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    company?: string;
    billing_distrito_pro?: string;
  };
  payment_method: string;
  payment_method_title: string;
  customer_note: string;
  date_paid?: string;
  date_completed?: string;
  subtotal: string;
  shipping_total: string;
  total_tax: string;
  discount_total: string;
  meta_data?: Array<{ key: string; value: string | number | boolean }>;
  payment_url?: string;
}

export interface IOrderItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  total: string;
  subtotal: string;
  price?: string;
  meta_data?: Array<{ key: string; value: string | number | boolean }>;
  image?: { src: string; alt?: string };
}
