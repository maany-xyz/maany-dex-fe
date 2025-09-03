"use client";

import { useMemo, useState, useCallback } from "react";
import { useWallet } from "@/components/WalletContext";
import { exitPool } from "@/lib/exitPool";

export default function ExitPoolButton({ className, onClick }) {
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  const chainId = useMemo(
    () => process.env.NEXT_PUBLIC_CHAIN_ID || "cosmoshub-4",
    []
  );
  const rpc = useMemo(() => process.env.NEXT_PUBLIC_RPC || "", []);
  const gasPrice = useMemo(() => process.env.NEXT_PUBLIC_GAS_PRICE || "", []);

  const params = useMemo(() => {
    const poolId = process.env.NEXT_PUBLIC_EXIT_POOL_ID || "1";
    const shareInAmount =
      process.env.NEXT_PUBLIC_EXIT_SHARE_IN_AMOUNT || "100020026033843996902";
    const denomA = "stake"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_A;
    const denomB = "tokenB"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_B;
    const amountA = "1000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_A;
    const amountB = "1000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_B;
    const tokenOutMins = [];
    if (denomA && amountA)
      tokenOutMins.push({ denom: denomA, amount: amountA });
    if (denomB && amountB)
      tokenOutMins.push({ denom: denomB, amount: amountB });
    return { poolId, shareInAmount, tokenOutMins };
  }, []);

  const handleClick = useCallback(async () => {
    if (typeof onClick === "function") return onClick();
    if (!address) return;
    if (!rpc) {
      console.error("NEXT_PUBLIC_RPC is not set");
      return;
    }
    if (typeof window === "undefined" || !window.getOfflineSignerAuto) {
      console.error("Offline signer not available");
      return;
    }

    setSubmitting(true);
    try {
      const signer = await window.getOfflineSignerAuto(chainId);
      const res = await exitPool({
        rpc,
        chainId,
        signer,
        sender: address,
        poolId: params.poolId,
        shareInAmount: params.shareInAmount,
        tokenOutMins: params.tokenOutMins,
        gasPrice,
      });
      console.log("Exit pool tx success:", res.transactionHash);
    } catch (e) {
      console.error("Exit pool failed:", e?.message || e);
    } finally {
      setSubmitting(false);
    }
  }, [onClick, address, rpc, chainId, gasPrice, params]);

  if (!address) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={submitting}
    >
      {submitting ? "Exiting…" : "Exit Pool"}
    </button>
  );
}
