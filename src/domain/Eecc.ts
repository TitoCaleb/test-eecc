import { Customer } from "./Customer";
import { ExchangeHistory } from "./ExchangeHistory";
import { Currency, Portfolio } from "./Portfolio";
import { PortfolioHistory } from "./PortfolioHistory";
import { Transaction } from "./Transaction";

export interface PortfolioResume {
  name: string;
  currency: string;
  saves: string;
  contribution: string;
  rentability: string;
}

export class Eecc {
  year: string;

  month: string;

  customer: Customer;

  transactions: Transaction[];

  portfolioHistoryOfMonth: PortfolioHistory;

  portfolioHistoryPastMonth?: PortfolioHistory;

  exchangeHistory: ExchangeHistory;

  portfolio: Portfolio;

  signedUrl: string;

  portfolioResume: PortfolioResume[];

  constructor(data?: Partial<Eecc>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
