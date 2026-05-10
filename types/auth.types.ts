export interface RegisterCashierPayload {
  firstname:string;
  middlename:string;
  lastname:string;
  username:string;
  password:string;
}

export interface ResetUserLogin {
  user_id:number;
}

export interface ChangeUserPassword {
  password:string;
  user_id:string;
}
