import {
  BankTransfer,
  None,
  Transaction,
  TransactionType,
  UploadFile,
} from "./Transaction";

export type BuyOriginCode = {
  bank: {
    id: string;
    transaction: {
      id: string;
    };
  };
};

export type BuyOriginVoucher = {
  bank: {
    id: string;
    transaction: {
      voucher: {
        contentType: string;
        upload?: UploadFile;
      };
    };
  };
};

export class TransactionBuy extends Transaction<BankTransfer, None> {
  readonly type = TransactionType.BUY;

  amount: number;

  voucher?: {
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

  constructor(data?: Partial<TransactionBuy>) {
    super();
    if (data) {
      Object.assign(this, data);
      this.type = TransactionType.BUY;
    }
  }

  getEventData() {
    return {
      ...super.getEventData(),
      voucher: this.voucher,
      newDestiny: this.destiny,
      // TODO: remove backwards compatibility
      ...(this.fund && { destiny: { fund: this.fund } }),
    };
  }

  getApiData(): any {
    return {
      ...super.getApiData(),
      ...(this.comments && { comments: this.comments }),
    };
  }
}
