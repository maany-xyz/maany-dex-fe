"use client";

import { getSigningOsmosisClientOptions, osmosis } from "osmojs";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

/**
 * Create a Balancer pool via GAMM (uses the model-specific message).
 * Kept as createPool() so the rest of your app doesn't change.
 */
export async function createPool({
  rpc,
  signer,
  sender,
  poolAssets,
  gasPrice,
}) {
  const { registry, aminoTypes } = await getSigningOsmosisClientOptions();
  console.log("in registry with: ", registry, aminoTypes, rpc, signer);

  try {
    const client = await SigningStargateClient.connectWithSigner(rpc, signer, {
      registry,
      aminoTypes,
      ...(gasPrice ? { gasPrice: GasPrice.fromString(gasPrice) } : {}),
    });
    console.log("in client with: ", client);

    // Use the Balancer-specific create message
    const msg =
      osmosis.gamm.poolmodels.balancer.v1beta1.MessageComposer.withTypeUrl.createBalancerPool(
        {
          sender,
          poolParams: {
            swapFee: "0.003000000000000000", // 0.3%
            exitFee: "0.000000000000000000", // 0%
            smoothWeightChangeParams: undefined,
          },
          poolAssets, // [{ token:{denom,amount}, weight }, ...]
          futurePoolGovernor: "", // 7 days
        }
      );
    console.log("in msg with: ", msg);

    const result = await client.signAndBroadcast(
      sender,
      [msg],
      "auto",
      "create balancer pool"
    );

    console.log("in res with: ", result);

    if (result.code !== 0) {
      const err = new Error(
        `Tx failed with code ${result.code}: ${result.rawLog}`
      );
      err.txRawLog = result.rawLog;
      throw err;
    }
    return result;
  } catch (error) {
    console.log("Caught big fat error", error);
    return;
  }
}
