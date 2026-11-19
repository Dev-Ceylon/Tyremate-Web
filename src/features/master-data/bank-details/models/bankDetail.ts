export type BankDetailRecord = {
  ID: string | number;
  BankName: string;
  AccountNumber: string;
  AccountName: string;
  Branch: string;
}

export type BankDetailPayload = {
  BankName: string;
  AccountNumber: string;
  AccountName: string;
  Branch: string;
}
