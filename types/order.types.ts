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