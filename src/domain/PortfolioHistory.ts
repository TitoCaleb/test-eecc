import { ExchangeHistory } from "./ExchangeHistory";
import { Portfolio, Currency } from "./Portfolio";

export class PortfolioHistory {
  portfolioId: string;

  timestamp: number;

  formattedDate: string;

  customerId: string;

  portfolio: Pick<Portfolio, "id" | "funds" | "balances">;

  lastUpdate: number;

  constructor(data?: Partial<PortfolioHistory>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getTimestampOf3MonthsAgo(): number {
    const date = new Date(this.timestamp);

    date.setMonth(date.getMonth() - 3);
    date.setHours(0, 0, 0, 0);

    return date.getTime();
  }

  getCurrencyPercentage(
    exchangeHistory: ExchangeHistory
  ): { label: string; value: number }[] {
    const totalByCurrency: Record<string, number> = {};
    const totalInUSD: { currency: Currency; amountInUSD: number }[] = [];

    // --- Tasa fija: 1 USD = X PEN ---
    const penPerUsd = exchangeHistory.buy?.amount ?? 1; // 3.53 en tu ejemplo

    for (const funds of this.portfolio.funds.filter(
      (fondo) => fondo.id !== "cash"
    )) {
      const { amount, currency } = funds.balance;

      // Sumar por moneda original
      totalByCurrency[currency] = (totalByCurrency[currency] || 0) + amount;

      // Convertir a USD equivalente
      const amountInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / penPerUsd
          : amount; // fallback

      totalInUSD.push({ currency, amountInUSD });
    }

    const totalUSD = totalInUSD.reduce((acc, f) => acc + f.amountInUSD, 0);

    const result = Object.entries(totalByCurrency).map(([currency, amount]) => {
      const valueInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / penPerUsd
          : amount;

      const percentage = Number(((valueInUSD / totalUSD) * 100).toFixed(2));
      return { label: currency, value: percentage };
    });

    // Asegurar USD y PEN siempre presentes
    for (const currency of ["USD", "PEN"]) {
      if (!result.some((r) => r.label === currency)) {
        result.push({ label: currency, value: 0 });
      }
    }

    return result;
  }

  getPercentageOfFunds(
    exchangeHistory: ExchangeHistory
  ): { label: string; value: number }[] {
    const totalInUSD: { fund: string; amountInUSD: number }[] = [];

    // ✅ Tipo de cambio fijo: 1 USD = X PEN
    const penPerUsd = exchangeHistory.buy?.amount ?? 1;

    for (const fund of this.portfolio.funds.filter((f) => f.id !== "cash")) {
      const { amount, currency } = fund.balance;

      // ✅ Convertir todo a USD
      const amountInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / penPerUsd
          : amount; // otras monedas (mantiene el valor)

      totalInUSD.push({
        fund: fund.name ?? fund.id,
        amountInUSD,
      });
    }

    const totalUSD =
      totalInUSD.reduce((acc, f) => acc + f.amountInUSD, 0) || 0.0000001;

    return totalInUSD.map((f) => ({
      label: f.fund,
      value: Number(((f.amountInUSD / totalUSD) * 100).toFixed(2)),
    }));
  }
}
