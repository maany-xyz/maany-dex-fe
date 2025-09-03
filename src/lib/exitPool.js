"use client";

import { getSigningOsmosisClientOptions, osmosis } from "osmojs";
import { SigningStargateClient, GasPrice } from "@cosmjs/stargate";

/**
 * Broadcasts a GAMM MsgExitPool transaction.
 * params = {
 *   rpc: string,
 *   chainId: string,
 *   signer: OfflineSigner,
 *   sender: string,
 *   poolId: string | number,
 *   shareInAmount: string,
 *   tokenOutMins?: Array<{ denom: string, amount: string }>,
 *   gasPrice?: string
 * }
 */
export async function exitPool(params) {
  const { rpc, chainId, signer, sender, poolId, shareInAmount, tokenOutMins = [], gasPrice } = params;

  const { registry, aminoTypes } = await getSigningOsmosisClientOptions();
  const client = await SigningStargateClient.connectWithSigner(rpc, signer, {
    registry,
    aminoTypes,
    ...(gasPrice ? { gasPrice: GasPrice.fromString(gasPrice) } : {}),
  });

  const msg = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl.exitPool({
    sender,
    poolId,
    shareInAmount,
    tokenOutMins,
  });

  const result = await client.signAndBroadcast(sender, [msg], "auto");
  if (result.code !== 0) {
    const err = new Error(`Tx failed with code ${result.code}: ${result.rawLog}`);
    err.txRawLog = result.rawLog;
    throw err;
  }
  return result;
}

