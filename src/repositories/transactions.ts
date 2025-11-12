import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Transaction, TransactionType } from "../domain/Transaction";
import { fromIni } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { config } from "../config";
import { CustomerType } from "../domain/Customer";
import { TransactionFactory } from "../domain/TransactionFactory";

const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    // credentials: fromIni({ profile: "blum" }),
  }),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);

export async function findTransactionsByCustomerAndMonth({
  customerId,
  startDate,
  endDate,
}: {
  customerId: string;
  startDate: number;
  endDate: number;
}): Promise<Transaction[]> {
  const response: Transaction[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  do {
    const {
      Items,
      LastEvaluatedKey,
    }: { Items?: any[]; LastEvaluatedKey?: Record<string, any> } =
      await dynamoDbClient.send(
        new QueryCommand({
          TableName: `TransactionsDb${config.env}`,
          IndexName: "customerId-creationDate-index",
          KeyConditionExpression:
            "customerId = :customerId AND creationDate BETWEEN :start AND :end",
          FilterExpression: "#type = :buyType OR #type = :sellType",
          ExpressionAttributeNames: {
            "#type": "type",
          },
          ExpressionAttributeValues: {
            ":customerId": customerId,
            ":start": startDate,
            ":end": endDate,
            ":buyType": TransactionType.BUY,
            ":sellType": TransactionType.SELL,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );

    if (Items && Items.length > 0) {
      response.push(...Items.map((i) => createTransactionFromDb(i)));
    }

    lastEvaluatedKey = LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return response;
}

function createTransactionFromDb(
  item: Record<string, any>,
  customerType?: CustomerType
) {
  return TransactionFactory.create({
    id: item.id,
    customer: {
      id: item.customerId,
      employeeId: item.employeeId,
      type: customerType,
    },
    voucher: item.voucher,
    fund: item.fund,
    ...(item.type === TransactionType.BUY &&
      item.origin?.bank && {
        origin: {
          bank: item.origin.bank,
        },
      }),
    ...(item.type === TransactionType.SELL &&
      item.destiny?.account && {
        destiny: {
          account: item.destiny.account,
        },
      }),
    shares: Number(item.shares),
    amount: Number(item.amount),
    taxes: Number(item.taxes),
    price: Number(item.price),
    currency: item.currency,
    type: item.type,
    ...(item.subType ? { subType: item.subType } : {}),
    status: item.status,
    transactionDate: item.transactionDate,
    settlementDate: item.settlementDate,
    priceDate: item.priceDate,
    creationDate: item.creationDate,
    confirmedBy: item.confirmedBy,
    lastUpdate: item.lastUpdate,
    metadata: item.metadata,
    clientId: item.clientId,
    ...(item.comments && { comments: item.comments }),
  });
}
