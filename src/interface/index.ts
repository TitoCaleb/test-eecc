// Interfaz para los datos de cada fondo (para la tabla)
export interface FondoData {
  fondo: string;
  moneda: "s/" | "$";
  ahorros: number;
  aporte: number;
  rentabilidad: number;
}

// Interfaces para los datos que llegan de la API
export interface Balance {
  amount: number;
  currency: string;
  shares?: number;
}

export interface Returns {
  realized: number;
  unRealized: number;
}

export interface FundAPI {
  id: string;
  availableBalance?: Balance;
  balance: Balance;
  costBasis?: number;
  currency: string;
  returns?: Returns;
  series?: string;
  sharePrice?: number;
}

// Interfaces para el nuevo formato de portafolio (posiciones)
export interface PortfolioBalance {
  amount: number;
  currency: string;
}

export interface PortfolioFundBalance {
  amount: number;
  currency: string;
  shares?: number;
}

export interface PortfolioFund {
  balance: PortfolioFundBalance;
  costBasis?: number;
  currency: string;
  id: string;
  returns?: Returns;
  series?: string;
  sharePrice?: number;
}

export interface Portfolio {
  balances: PortfolioBalance[];
  funds: PortfolioFund[];
  id: string;
}

export interface PortfolioData {
  portfolioId: string;
  timestamp: number;
  customerId: string;
  formattedDate: string;
  lastUpdate: number;
  portfolio: Portfolio;
}

// Interfaz para las filas de la tabla de posiciones
export interface PosicionData {
  fondo: string;
  saldoAl: string;
  numCuotas: number;
  valorCuota: number;
  moneda: string;
  saldo: number;
  saldoUSD: number;
}
