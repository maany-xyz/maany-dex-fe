"use client";

import { getSigningOsmosisClientOptions, osmosis } from "osmojs";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

/**
 * Broadcasts a GAMM MsgSwapExactAmountIn transaction.
 * params = {
 *   rpc: string,
 *   chainId: string,
 *   signer: OfflineSigner,
 *   sender: string,
 *   routes: Array<{ poolId: string | number, tokenOutDenom: string }>,
 *   tokenIn: { denom: string, amount: string },
 *   tokenOutMinAmount: string,
 *   gasPrice?: string
 * }
 */
export async function swapExactAmountIn(params) {
  const { rpc, chainId, signer, sender, routes, tokenIn, tokenOutMinAmount, gasPrice } = params;

  const { registry, aminoTypes } = await getSigningOsmosisClientOptions();
  const client = await SigningStargateClient.connectWithSigner(rpc, signer, {
    registry,
    aminoTypes,
    ...(gasPrice ? { gasPrice: GasPrice.fromString(gasPrice) } : {}),
  });

  const msg = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl.swapExactAmountIn({
    sender,
    routes,
    tokenIn,
    tokenOutMinAmount,
  });

  const result = await client.signAndBroadcast(sender, [msg], "auto");
  if (result.code !== 0) {
    const err = new Error(`Tx failed with code ${result.code}: ${result.rawLog}`);
    err.txRawLog = result.rawLog;
    throw err;
  }
  return result;
}

