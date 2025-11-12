import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Customer } from "../domain/Customer";
import { Portfolio } from "../domain/Portfolio";
import { config } from "../config";
import { fromIni } from "@aws-sdk/credential-providers";

export const lambdaClient = new LambdaClient({
  // region: "us-east-2",
  // credentials: fromIni({ profile: "blum" }),
});

export async function findByCustomer({
  request,
  forceUpdate = false,
}: {
  request: Pick<Customer, "id" | "type">;
  forceUpdate?: boolean;
}): Promise<Portfolio> {
  const { Payload } = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: `PortfolioLambda${config.env}`,
      Payload: JSON.stringify({
        httpMethod: "GET",
        resource: "/portfolio",
        queryStringParameters: {
          customerId: request.id,
          customerType: request.type,
          forceUpdate,
        },
      }),
    })
  );

  if (Payload) {
    const payload = JSON.parse(Buffer.from(Payload).toString());

    if (payload.statusCode === 200) {
      const body = JSON.parse(payload.body);
      const response = body?.[0];

      if (!response) {
        throw new Error("Customer portfolio not found");
      }

      return new Portfolio({
        ...response,
        id: response?.id,
        customer: new Customer({
          id: request.id,
          type: request.type,
        }),
        ...(response?.balances && {
          balances: response?.balances.map((balance: any) => ({
            ...balance,
            amount: balance?.amount,
          })),
        }),
        funds: response?.funds?.map((fund: any) => ({
          ...fund,
          balance: {
            ...fund.balance,
            amount: fund?.balance?.amount,
            shares: fund?.balance?.shares,
          },
          ...(fund?.availableBalance && {
            availableBalance: {
              ...fund.availableBalance,
              amount: fund?.availableBalance?.amount,
              shares: fund?.availableBalance?.shares,
            },
          }),
          sharePrice: fund?.sharePrice,
          costBasis: fund?.costBasis,
        })),
      });
    }
  }

  throw new Error("Get customer portfolio unknown error");
}
