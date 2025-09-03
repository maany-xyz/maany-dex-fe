"use client";

import { useMemo, useState, useCallback } from "react";
import { useWallet } from "@/components/WalletContext";
import { joinPool } from "@/lib/joinPool";

export default function JoinPoolButton({ className, onClick }) {
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  const chainId = useMemo(
    () => process.env.NEXT_PUBLIC_CHAIN_ID || "cosmoshub-4",
    []
  );
  const rpc = useMemo(() => process.env.NEXT_PUBLIC_RPC || "", []);
  const gasPrice = useMemo(() => process.env.NEXT_PUBLIC_GAS_PRICE || "", []);

  const joinParams = useMemo(() => {
    const poolId = process.env.NEXT_PUBLIC_JOIN_POOL_ID || "1";
    const shareOutAmount =
      process.env.NEXT_PUBLIC_JOIN_SHARE_OUT_AMOUNT || "100010013016921998451"; // LP shares
    const denomA = "stake"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_A;
    const denomB = "tokenB"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_B;
    const amountA = "50000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_A;
    const amountB = "50000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_B;
    const tokenInMaxs = [];
    if (denomA && amountA) tokenInMaxs.push({ denom: denomA, amount: amountA });
    if (denomB && amountB) tokenInMaxs.push({ denom: denomB, amount: amountB });
    // Fallback single token if none provided
    if (tokenInMaxs.length === 0) {
      tokenInMaxs.push({
        denom: process.env.NEXT_PUBLIC_JOIN_FALLBACK_DENOM || "stake",
        amount: process.env.NEXT_PUBLIC_JOIN_FALLBACK_AMOUNT || "100000",
      });
    }
    return { poolId, shareOutAmount, tokenInMaxs };
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
      const res = await joinPool({
        rpc,
        chainId,
        signer,
        sender: address,
        poolId: joinParams.poolId,
        shareOutAmount: joinParams.shareOutAmount,
        tokenInMaxs: joinParams.tokenInMaxs,
        gasPrice,
      });
      console.log("Join pool tx success:", res.transactionHash);
    } catch (e) {
      console.error("Join pool failed:", e?.message || e);
    } finally {
      setSubmitting(false);
    }
  }, [onClick, address, rpc, chainId, gasPrice, joinParams]);

  if (!address) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={submitting}
    >
      {submitting ? "Joining…" : "Join Pool"}
    </button>
  );
}
