import { AnyTransaction, TransactionType } from "./Transaction";
import { TransactionBuy } from "./TransactionBuy";
import { TransactionSell } from "./TransactionSell";

export class TransactionFactory {
  static create(data: Partial<TransactionBuy>): TransactionBuy;
  static create(data: Partial<TransactionSell>): TransactionSell;
  static create(
    data: Partial<AnyTransaction>
  ): TransactionBuy | TransactionSell;
  static create(data: Partial<AnyTransaction>): AnyTransaction {
    switch (data.type) {
      case TransactionType.BUY:
        return new TransactionBuy(data as Partial<TransactionBuy>);
      case TransactionType.SELL:
        return new TransactionSell(data as Partial<TransactionSell>);
      default:
        throw new Error("Unknown transaction type");
    }
  }
}
