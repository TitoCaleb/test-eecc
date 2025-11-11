import { CustomerType } from "./Customer";
import { Currency } from "./Portfolio";

export interface TransactionsFilter {
  status?: TransactionStatus;
  startDate: string;
  endDate: string;
  bucketKey?: string;
}

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
}

export enum TransactionStatus {
  ON_HOLD = "ON_HOLD",
  REQUESTED = "REQUESTED",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export type TransactionIndividual<T extends Transaction = Transaction> = T & {
  customer: {
    id: string;
    type: CustomerType.INDIVIDUAL;
  };
};

export type TransactionBusiness<T extends Transaction = Transaction> = T & {
  customer: {
    id: string;
    type: CustomerType.BUSINESS;
    employeeId?: string;
  };
};

export type UploadFile = {
  url?: string;
  fields?: {
    [key: string]: string;
  };
};

export type BankTransfer = {
  bank: {
    id: string;
    transaction: {
      id?: string;
      voucher?: {
        contentType: string;
        upload?: UploadFile;
      };
    };
  };
};

export type Account = {
  account: {
    id: string;
  };
};

export type TransactionFilterParams = {
  type?: TransactionType;
  fundId?: string;
  bankId?: string;
  serieId?: string;
  status?: TransactionStatus;
  startDate?: number;
  endDate?: number;
  onlyInProgress?: boolean;
  lastEvaluatedKey?: Record<string, any>;
};

export type TransactionComplianceFilters = {
  startDate?: number;
  endDate?: number;
  customerId?: string;
  lastEvaluatedKey?: Record<string, any>;
};

export type None = undefined;
export type AnyTransaction = Transaction<any, any>;

export class Transaction<O = unknown, D = unknown> {
  id: string;

  customer: {
    id: string;
    type?: CustomerType;
    employeeId?: string;
    name?: string;
    lastName?: string;
    middleName?: string;
    motherLastName?: string;
    identityDocument?: {
      type: string;
      number: string;
    }[];
  };

  fund: {
    id: string;
    series: string;
  };

  type: TransactionType;

  status: TransactionStatus;

  currency?: Currency;

  amount: number;

  shares?: number;

  taxes?: number;

  price?: number;

  origin: O;

  destiny: D;

  transactionDate: number;

  settlementDate?: number;

  priceDate?: number;

  creationDate: number;

  lastUpdate?: number;

  isProcessed?: boolean;

  metadata?: {
    analytics: string;
  };

  isBackOffice?: boolean;

  clientId?: string;

  message?: string;

  constructor(data?: Partial<Transaction<O, D>>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getEventData(): any {
    return {
      id: this.id,
      amount: this.amount,
      type: this.type,
      currency: this.currency,
      origin: this.origin,
      destiny: this.destiny,
      fund: this.fund,
      shares: this.shares,
      price: this.price,
      creationDate: this.creationDate,
      transactionDate: this.transactionDate,
      settlementDate: this.settlementDate,
      priceDate: this.priceDate,
      lastUpdate: this.lastUpdate,
      taxes: this.taxes,
      status: this.status,
      metadata: this.metadata,
      isProcessed: this.isProcessed,
      isBackOffice: this.isBackOffice,
      clientId: this.clientId,
    };
  }

  getApiData() {
    if (this.message) {
      return {
        id: this.id,
        status: this.status,
        message: this.message,
      };
    }

    return {
      id: this.id,
      customer: this.customer,
      status: this.status,
      shares: this.shares,
      amount: this.amount,
      price: this.price,
      taxes: this.taxes,
      type: this.type,
      fund: this.fund,
      currency: this.currency,
      origin: this.origin,
      destiny: this.destiny,
      priceDate: this.priceDate,
      settlementDate: this.settlementDate,
      transactionDate: this.transactionDate,
      creationDate: this.creationDate,
      clientId: this.clientId,
    };
  }

  getTransactionDateAsString() {
    const [month, day, year] = new Date(this.transactionDate)
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Lima",
      })
      .split("/");
    return `${day}/${month}/${year}`;
  }

  getCreationDateAsString() {
    const [month, day, year] = new Date(this.creationDate)
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Lima",
      })
      .split("/");
    return `${day}/${month}/${year}`;
  }

  getFormattedDate() {
    const [month, day, year] = new Date(this.transactionDate)
      .toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Lima",
      })
      .split("/");
    return `${year}-${month}-${day}`;
  }
}
