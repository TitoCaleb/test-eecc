import { Customer } from "./Customer";
import { ExchangeHistory } from "./ExchangeHistory";
import { Portfolio } from "./Portfolio";
import { PortfolioHistory } from "./PortfolioHistory";
import { Transaction } from "./Transaction";

export class Eecc {
  year: string;

  month: string;

  customer: Customer;

  transactions: Transaction[];

  portfolioHistoryOfMonth: PortfolioHistory;

  portfolioHistoryPastMonth?: PortfolioHistory;

  signedUrl: string;

  exchangeHistory: ExchangeHistory;

  constructor(data?: Partial<Eecc>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
