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