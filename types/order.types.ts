export interface ProcessReturnPayload {
  order_no: string;
  total_return_credit: string;
  return_items: Array<{
    id: number;
    name: string;
    price: string;
    maxQty: number;
    returnQty: number;
  }>;
}

export interface PostReturnPayload {
  order_no:string;
  total:number;
  balance_due:number
}

export interface SyncExchangeCartPayload {
  order_no: string;
  return_items: Array<{
    id: number;
    name: string;
    price: string;
    maxQty: number;
    returnQty: number;
  }>;
}

// export interface SyncCartPayload {
//   order_no: string;
//   cart_items: Array<{
//     id: number;
//     name: string;
//     price: string;
//     maxQty: number;
//     returnQty: number;
//   }>;
// }

export interface SyncCartPayload {
  order_no:string;
  cart_items:Array<{
    product: {
        id: number;
        description: string;
        price: string;
        sku: string;
        barcode?: string;
      };
      quantity: number;
  }>
}
