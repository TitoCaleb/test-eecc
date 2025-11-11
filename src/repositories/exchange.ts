import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { config } from "../config";
import { ExchangeHistory } from "../domain/ExchangeHistory";

const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    credentials: fromIni({ profile: "blum" }),
  }),
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);

export async function findLastExchangeHistory(
  request: ExchangeHistory
): Promise<ExchangeHistory> {
  const { Item } = await dynamoDbClient.send(
    new GetCommand({
      TableName: `ComplianceExchangeRateHistoryDb${config.env}`,
      Key: { date: request.date },
    })
  );

  if (!Item) {
    throw new Error("Exchange history not found");
  }

  return new ExchangeHistory({
    date: Item.date,
    formattedDate: Item.formattedDate,
    buy: Item.buy,
    sell: Item.sell,
  });
}
