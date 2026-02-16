export interface ScanPwalletQrResponse {
  reference_no: String;
}

export interface pwalletDebitResponse {
  status: String;
}

export interface pwalletDebitParams {
  reference_no: string;
  amount:String;
  store_code:String;
}