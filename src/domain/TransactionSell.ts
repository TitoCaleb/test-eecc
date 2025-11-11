import { Account, None, Transaction, TransactionType } from "./Transaction";

export enum TransactionSubType {
  TOTAL = "TOTAL",
  PARTIAL = "PARTIAL",
}

export class TransactionSell extends Transaction<None, Account> {
  readonly type = TransactionType.SELL;

  subType: TransactionSubType;

  otp: {
    id: string;
  };

  confirmedBy: string;

  comments?: {
    confirmed: {
      by: string;
      at: number;
      comment: string;
    };
  };

  constructor(data?: Partial<TransactionSell>) {
    super();
    if (data) {
      Object.assign(this, data);
      this.type = TransactionType.SELL;
    }
  }

  getEventData(): any {
    return {
      ...super.getEventData(),
      subType: this.subType,
      // TODO: remove backwards compatibility
      ...(this.fund && { origin: { fund: this.fund } }),
    };
  }

  getApiData(): any {
    return {
      ...super.getApiData(),
      subType: this.subType,
    };
  }
}
