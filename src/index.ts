import { Customer } from "./domain/Customer";
import { Eecc } from "./domain/Eecc";
import { ExchangeHistory } from "./domain/ExchangeHistory";
import { generatePdf } from "./pdf/v2";
import { findById } from "./repositories/customer";
import { findLastExchangeHistory } from "./repositories/exchange";
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

  const eecc = new Eecc({
    year: year,
    month: month,
    customer: customer,
    transactions: transactionsOf3MonthsAgo,
    portfolioHistoryOfMonth: lastPortfolioHistoryOfYearAndMonth,
    portfolioHistoryPastMonth: lastPortfolioHistoryOfYearAndPastMonth,
    exchangeHistory: exchangeLastDateOfMonth,
  });

  generatePdf(eecc);
}

init({
  customerId: "e4074a27-3310-4bf3-9ebb-0ee0006d78f6",
  year: "2025",
  month: "10",
});
