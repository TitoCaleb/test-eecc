import { Customer } from "./Customer";

export declare enum Currency {
  USD = "USD",
  PEN = "PEN",
}

export type PortfolioFund = {
  id: string;
  name?: string;
  series?: string;
  creationDate?: number;
  costBasis?: number;
  sharePrice?: number;
  currency: Currency;
  balance: {
    shares?: number;
    amount: number;
    currency: Currency;
  };
  availableBalance?: {
    shares?: number;
    amount: number;
    currency: Currency;
  };
  returns: {
    realized: number;
    unrealized: number;
  };
};

export type PortfolioBalance = {
  currency: Currency;
  amount: number;
};

export enum PortfolioStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

export class Portfolio {
  readonly type = "CUSTOMER_PORTFOLIO";

  id: string;

  customer: Customer;

  transaction?: {
    id: string;
  };

  currency: Currency;

  funds: PortfolioFund[];

  balances: PortfolioBalance[];

  lastBalanceUpdate?: number;

  lastAvailableBalanceUpdate?: number;

  status: PortfolioStatus;

  /** @description Latest portfolio date */
  currentDate: number;

  /** @description Portfolio date */
  date?: string;

  creationDate: number;

  constructor(data?: Partial<Portfolio>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getDateAsString(timestamp: number) {
    const [month, day, year] = new Date(timestamp)
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Lima",
      })
      .split("/");
    return `${day}/${month}/${year}`;
  }

  getEventData() {
    return {
      id: this.id,
    };
  }
}
