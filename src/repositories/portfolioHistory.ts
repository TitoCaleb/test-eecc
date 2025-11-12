import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { config } from "../config";
import { Portfolio } from "../domain/Portfolio";
import { PortfolioHistory } from "../domain/PortfolioHistory";

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

export async function findByPortfolioAndYearAndMonth(
  portfolio: Portfolio,
  year: string,
  month: string
): Promise<PortfolioHistory | undefined> {
  const startTimestamp = Date.UTC(Number(year), Number(month), 0);
  const endTimestamp = startTimestamp + 24 * 60 * 60 * 1000 - 1;

  const { Items } = await dynamoDbClient.send(
    new QueryCommand({
      TableName: `PortfolioHistoryDb${config.env}`,
      KeyConditionExpression:
        "portfolioId = :portfolioId AND #timestamp BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#timestamp": "timestamp",
      },
      ExpressionAttributeValues: {
        ":portfolioId": portfolio.id,
        ":start": startTimestamp,
        ":end": endTimestamp,
      },
      ScanIndexForward: false,
      Limit: 1,
    })
  );

  if (!Items || Items.length === 0) {
    return undefined;
  }

  return new PortfolioHistory(Items[0]);
}
