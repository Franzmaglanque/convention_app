export interface ScanPwalletQrResponse {
  data:{
    reference_no: number;
    pwallet_number:string;
  }
}

export interface pwalletDebitResponse {
  status: String;
}

export interface pwalletDebitParams {
  reference_no: string;
  amount:number;
  store_code:number;
}

export interface cashPaymentParams {
  cash_bill:string;
  cash_change:string;
  amount:string;
  payment_method:string;
  order_no:string;
  
}

export interface cashPaymentResponse {
  status : String;
}