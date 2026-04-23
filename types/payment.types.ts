export interface ScanPwalletQrResponse {
  data:{
    reference_no: number;
    pwallet_number:string;
  }
}

export interface pwalletDebitResponse  {
  status: string;             // Use lowercase 'string', not 'String'
  message: string;            // Added from your backend response
  data: {
    status: string;
    message: string;
    remaining_balance: number;
  };
}

export interface pwalletDebitParams {
  reference_no: string;
  amount:number;
  store_code:number;
  order_no:string;
  payment_method:string;
}

export interface cashPaymentParams {
  cash_bill:string;
  cash_change:string;
  amount:number;
  payment_method:string;
  order_no:string;
}

export interface cashPaymentResponse {
  // status : String;
  status: string;             // Use lowercase 'string', not 'String'
  message: string;            // Added from your backend response
  data: {
    status: string;
    message: string;
    remaining_balance: number;
  };
}

export interface creditCardPaymentParams {
  reference_no:string;
  amount:number;
  payment_method:string;
  order_no:string;
  qr_code_data:string;
  terminal_type?:string;
  card_type?:string;
}

export interface gcashPaymentBody {
  order_no:string;
  payment_method:string;
  amount:number;
  reference_no:string;
}

export interface skyroPaymentBody {
  reference_no:string;
  amount:number;
  payment_method:string;
  order_no:string;
}
