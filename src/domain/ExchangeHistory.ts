import { Currency } from "./Portfolio";

export class ExchangeHistory {
  date: number; // timestamp

  formattedDate: string; // 2025-07-22

  buy: {
    amount: number;
    currency: Currency;
  };

  sell: {
    amount: number;
    currency: Currency;
  };

  startDate: string; // not in the database

  endDate: string; // not in the database

  constructor(data?: Partial<ExchangeHistory>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getApiData() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      buy: this.buy,
      sell: this.sell,
    };
  }

  getEventData() {
    return {
      date: this.date,
      formattedDate: this.formattedDate,
      buy: this.buy,
      sell: this.sell,
    };
  }
}
