import { Customer } from "./domain/Customer";
import { Eecc, PortfolioResume } from "./domain/Eecc";
import { ExchangeHistory } from "./domain/ExchangeHistory";
import { FundHistory } from "./domain/FundHistory";
import { Portfolio } from "./domain/Portfolio";
import { PortfolioHistory } from "./domain/PortfolioHistory";
import { generatePdf } from "./pdf/v2";
import { findById } from "./repositories/customer";
import { findLastExchangeHistory } from "./repositories/exchange";
import { findByIdAndDate } from "./repositories/fundHistory";
import { findByCustomer } from "./repositories/portfolio";
import { findByPortfolioAndYearAndMonth } from "./repositories/portfolioHistory";
import { findTransactionsByCustomerAndMonth } from "./repositories/transactions";

async function init({
  customerId,
  year,
  month,
}: {
  customerId: string;
  year: string;
  month: string;
}) {
  const customer = await findById(new Customer({ id: customerId }));
  const portfolio = await findByCustomer({
    request: { id: customer.id, type: customer.type },
  });
  const lastPortfolioHistoryOfYearAndPastMonth =
    await findByPortfolioAndYearAndMonth(
      portfolio,
      year,
      String(Number(month) - 1)
    );
  const lastPortfolioHistoryOfYearAndMonth =
    await findByPortfolioAndYearAndMonth(portfolio, year, month);
  if (!lastPortfolioHistoryOfYearAndMonth) {
    throw new Error("Portfolio history not found on this month");
  }

  const transactionsOf3MonthsAgo = await findTransactionsByCustomerAndMonth({
    customerId: customer.id,
    startDate: lastPortfolioHistoryOfYearAndMonth.getTimestampOf3MonthsAgo(),
    endDate: lastPortfolioHistoryOfYearAndMonth.timestamp,
  });

  const exchangeLastDateOfMonth = await findLastExchangeHistory(
    new ExchangeHistory({
      date: lastPortfolioHistoryOfYearAndMonth.timestamp,
    })
  );

  console.log(exchangeLastDateOfMonth);

  const portfolioResume = await getPortfolioResume(
    portfolio,
    lastPortfolioHistoryOfYearAndMonth
  );

  const eecc = new Eecc({
    year: year,
    month: month,
    customer: customer,
    transactions: transactionsOf3MonthsAgo,
    portfolioHistoryOfMonth: lastPortfolioHistoryOfYearAndMonth,
    portfolioHistoryPastMonth: lastPortfolioHistoryOfYearAndPastMonth,
    exchangeHistory: exchangeLastDateOfMonth,
    portfolio: portfolio,
    portfolioResume: portfolioResume,
  });

  generatePdf(eecc);
}

init({
  customerId: "a0501ff0-3ba4-423b-8242-23df4ed0da25",
  year: "2025",
  month: "09",
});

const getPortfolioResume = async (
  portfolio: Portfolio,
  lastPortfolioHistoryOfYearAndMonth: PortfolioHistory
): Promise<any> => {
  return await Promise.all(
    lastPortfolioHistoryOfYearAndMonth.portfolio.funds
      .filter((fondo) => fondo.id !== "cash")
      .map(async (fondo) => {
        const normalizeToStartOfDay = (timestamp: number) => {
          const date = new Date(timestamp);
          date.setHours(0, 0, 0, 0);
          return date.getTime(); // retorna el nuevo timestamp en ms
        };

        const lastFundHistory = await findByIdAndDate(
          new FundHistory({
            id: fondo.id,
            series: fondo.series!,
            date: lastPortfolioHistoryOfYearAndMonth.timestamp,
          })
        );
        const startFundHistory = await findByIdAndDate(
          new FundHistory({
            id: fondo.id,
            series: fondo.series!,
            date: normalizeToStartOfDay(
              portfolio.funds.find((f) => f.id === fondo.id)?.creationDate!
            ),
          })
        );
        const rentability =
          ((lastFundHistory.price - startFundHistory.price) /
            startFundHistory.price) *
          100;

        return {
          name: `${fondo.id} ${fondo.series}`,
          currency: fondo.currency,
          saves: fondo.balance.amount,
          contribution: fondo.costBasis,
          rentability: `${rentability.toFixed(2)}%`,
        };
      })
  );
};
