"use client";

import { useMemo, useState, useCallback } from "react";
import { useWallet } from "@/components/WalletContext";
import { swapExactAmountIn } from "@/lib/swap";

export default function SwapTokensButton({ className, onClick }) {
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  const chainId = useMemo(
    () => process.env.NEXT_PUBLIC_CHAIN_ID || "cosmoshub-4",
    []
  );
  const rpc = useMemo(() => process.env.NEXT_PUBLIC_RPC || "", []);
  const gasPrice = useMemo(() => process.env.NEXT_PUBLIC_GAS_PRICE || "", []);

  // Hardcoded swap params for now; adjust as needed
  const swapParams = useMemo(() => {
    return {
      routes: [
        {
          poolId: process.env.NEXT_PUBLIC_SWAP_POOL_ID || "1",
          tokenOutDenom: process.env.NEXT_PUBLIC_SWAP_OUT_DENOM || "tokenB",
        },
      ],
      tokenIn: {
        denom: process.env.NEXT_PUBLIC_SWAP_IN_DENOM || "stake",
        amount: process.env.NEXT_PUBLIC_SWAP_IN_AMOUNT || "5000", // base units
      },
      tokenOutMinAmount: process.env.NEXT_PUBLIC_SWAP_OUT_MIN || "1", // slippage floor
    };
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
      const res = await swapExactAmountIn({
        rpc,
        chainId,
        signer,
        sender: address,
        routes: swapParams.routes,
        tokenIn: swapParams.tokenIn,
        tokenOutMinAmount: swapParams.tokenOutMinAmount,
        gasPrice,
      });
      console.log("Swap tx success:", res.transactionHash);
    } catch (e) {
      console.error("Swap failed:", e?.message || e);
    } finally {
      setSubmitting(false);
    }
  }, [onClick, address, rpc, chainId, gasPrice, swapParams]);

  if (!address) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={submitting}
    >
      {submitting ? "Swapping…" : "Swap Tokens"}
    </button>
  );
}
