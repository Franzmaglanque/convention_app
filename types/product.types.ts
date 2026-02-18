// Shared Product Types for the Convention POS App

export interface Product {
  description:string;
  category:string;
  price:string;
  sku:string;
  id:number;
}

export interface ScanProductParams {
  barcode: string;
}

export interface ScanProductResponse {
  data: Product;
}

export interface ProductListReponse {
  data: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceAtTime?: number; // Price when added to cart
}
