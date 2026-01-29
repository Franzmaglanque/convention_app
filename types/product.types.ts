// Shared Product Types for the Convention POS App

// export interface Product {
//   id: string;
//   barcode: string;
//   name: string;
//   price: number;
//   stock: number;
//   category?: string;
//   imageUrl?: string;
//   description?: string;
//   sku?: string;
//   unit?: string;
//   MSSDSC: string;
// }

export interface Product {
  description:string;
  category:string;
  price:number;
  sku:string;
}

export interface ScanProductParams {
  barcode: string;
}

export interface ScanProductResponse {
  data: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  priceAtTime?: number; // Price when added to cart
}
