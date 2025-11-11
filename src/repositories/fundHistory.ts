import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { config } from "../config";
import { FundHistory } from "../domain/FundHistory";

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

export async function findByIdAndDate(
  request: FundHistory
): Promise<FundHistory> {
  const { Item } = await dynamoDbClient.send(
    new GetCommand({
      TableName: `FundHistoryDb${config.env}`,
      Key: { id: `${request.id}|${request.series}`, date: request.date },
    })
  );

  if (!Item) {
    throw new Error("Fund history not found");
  }

  const [id, series] = Item.id.split("|");
  return new FundHistory({
    id,
    series,
    date: Item.date,
    price: Item.price,
    lastUpdate: Item.lastUpdate,
  });
}
