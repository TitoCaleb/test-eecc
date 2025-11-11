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

    const usdRate =
      exchangeHistory.buy.currency === "PEN" ? exchangeHistory.buy.amount : 1;

    for (const funds of this.portfolio.funds.filter(
      (fondo) => fondo.id !== "cash"
    )) {
      const { amount, currency } = funds.balance;

      // Sumar por moneda original (para mostrar resultado final)
      totalByCurrency[currency] = (totalByCurrency[currency] || 0) + amount;

      // Convertir a USD equivalente
      const amountInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / usdRate
          : amount;

      totalInUSD.push({ currency, amountInUSD });
    }

    const totalUSD = totalInUSD.reduce((acc, f) => acc + f.amountInUSD, 0);

    const result = Object.entries(totalByCurrency).map(([currency, amount]) => {
      let valueInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / usdRate
          : amount;

      const percentage = Number(((valueInUSD / totalUSD) * 100).toFixed(2));

      return { label: currency, value: percentage };
    });

    // Asegurar USD y PEN siempre presentes
    const currencies = ["USD", "PEN"];
    for (const currency of currencies) {
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

    // Tipo de cambio
    const usdRate =
      exchangeHistory.buy.currency === "PEN"
        ? exchangeHistory.buy.amount // Ej: 1 USD = 3.85 PEN
        : 1;

    // Recorremos fondos y convertimos montos
    for (const fund of this.portfolio.funds.filter((f) => f.id !== "cash")) {
      const { amount, currency } = fund.balance;

      // Convertimos a USD
      const amountInUSD =
        currency === "USD"
          ? amount
          : currency === "PEN"
          ? amount / usdRate
          : amount;

      totalInUSD.push({
        fund: fund.name ?? fund.id, // etiqueta (usa name si existe)
        amountInUSD,
      });
    }

    // Total general en USD
    const totalUSD = totalInUSD.reduce((acc, f) => acc + f.amountInUSD, 0);

    // Calcular porcentajes por fondo
    const result = totalInUSD.map((f) => ({
      label: f.fund,
      value: Number(((f.amountInUSD / totalUSD) * 100).toFixed(2)),
    }));

    return result;
  }
}
