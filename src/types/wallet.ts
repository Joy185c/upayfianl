export type TransactionType =
  | 'send_money'
  | 'mobile_recharge'
  | 'pay_merchant'
  | 'pay_bill'
  | 'cash_out'
  | 'add_money'
  | 'cashback';

export type TransactionStatus = 'success' | 'pending' | 'failed';

export interface Wallet {
  id: string;
  display_name: string;
  phone_number: string;
  balance: number;
  segment: string;
  pin: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  wallet_id?: string;
  transaction_id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  total_amount: number;
  balance_after: number;
  counterparty?: string;
  operator?: string;
  biller?: string;
  note?: string;
  status: TransactionStatus;
  is_imported: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  wallet_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  transaction_id?: string;
  created_at: string;
}

export interface BenefitClaim {
  id: string;
  wallet_id?: string;
  benefit_id: string;
  title: string;
  cashback_amount: number;
  status: string;
  created_at: string;
}

export interface BenefitItem {
  id: string;
  title: string;
  description: string;
  why_this: string[];
  cashback_amount?: number;
  relevance: string;
}
