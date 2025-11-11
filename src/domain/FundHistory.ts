export class FundHistory {
  id: string;

  series: string;

  date: number;

  price: number;

  lastUpdate: number;

  startDate?: number;

  endDate?: number;

  constructor(data?: Partial<FundHistory>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getEventData(): any {
    return this;
  }

  getApiData() {
    return {
      date: this.date,
      price: this.price,
      lastUpdate: this.lastUpdate,
    };
  }
}
