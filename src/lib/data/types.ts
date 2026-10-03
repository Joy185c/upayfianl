export interface RawTransaction {
  transactionId: string;
  date: string;
  type: "recharge" | "merchant_payment" | "bill_payment" | "send_money" | "cash_out" | "add_money" | string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

export interface RawCampaignEvent {
  campaignEventId: string;
  campaignId: string;
  date: string;
  offer: string;
  exposed: boolean;
  responded: boolean;
}

export interface RawCustomer {
  customerId: string;
  profile: {
    name: string;
    age?: number;
    tenureDays: number;
  };
  account: {
    status: string;
  };
  transactions: RawTransaction[];
  campaignHistory: RawCampaignEvent[];
  preferences?: {
    preferredServices: string[];
  };
  consent?: {
    marketing: boolean;
  };
}

export interface CustomerDataset {
  datasetVersion: string;
  customers: RawCustomer[];
}

export interface ImportValidationResult {
  isValid: boolean;
  totalCustomers: number;
  newCustomers: number;
  existingCustomers: number;
  totalTransactions: number;
  totalCampaignEvents: number;
  errors: string[];
}
