import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { Customer } from "../domain/Customer";
import { config } from "../config";

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

export async function findById(request: Customer): Promise<Customer> {
  const { Item } = await dynamoDbClient.send(
    new GetCommand({
      TableName: `CustomersDb${config.env}`,
      Key: { id: request.id },
    })
  );

  if (!Item) {
    throw Error("Customer not found");
  }

  return new Customer({
    id: Item?.id,
    type: Item?.type,
    name: Item?.name,
    email: Item?.email,
    middleName: Item?.middleName,
    lastName: Item?.lastName,
    motherLastName: Item?.motherLastName,
    identityDocuments: Item?.identityDocuments,
    birthday: Item?.birthday,
    nationality: Item?.nationality,
    mobile: Item?.mobile,
    address: {
      street: Item?.address?.street,
      location: {
        level1: Item?.address?.location?.level1,
        level2: Item?.address?.location?.level2,
        level3: Item?.address?.location?.level3,
      },
    },
    education: Item?.education,
  });
}
