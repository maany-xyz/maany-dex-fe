"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@/components/WalletContext";
import { createPool } from "@/lib/createPool";

export default function CreatePoolButton({ className, onClick }) {
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState(false);

  const chainId = useMemo(
    () => process.env.NEXT_PUBLIC_CHAIN_ID || "maanydex",
    []
  );
  const rpc = useMemo(() => process.env.NEXT_PUBLIC_RPC || "", []);
  const gasPrice = useMemo(() => process.env.NEXT_PUBLIC_GAS_PRICE || "", []);

  const handleClick = useCallback(async () => {
    if (typeof onClick === "function") return onClick();
    if (!address) return;

    if (typeof window === "undefined" || !window.keplr?.getOfflineSignerAuto) {
      console.error("Keplr offline signer not available");
      return;
    }
    if (!rpc) {
      console.error("NEXT_PUBLIC_RPC is not set");
      return;
    }

    const denomA = "umaany"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_A;
    const denomB = "tokenB"; //process.env.NEXT_PUBLIC_CREATE_POOL_DENOM_B;
    const amountA = "10000000000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_A;
    const amountB = "10000000000"; //process.env.NEXT_PUBLIC_CREATE_POOL_AMOUNT_B;
    const weightA = process.env.NEXT_PUBLIC_CREATE_POOL_WEIGHT_A || "50";
    const weightB = process.env.NEXT_PUBLIC_CREATE_POOL_WEIGHT_B || "50";

    if (!denomA || !denomB || !amountA || !amountB) {
      console.error(
        "Missing pool env vars: set NEXT_PUBLIC_CREATE_POOL_[DENOM_A|DENOM_B|AMOUNT_A|AMOUNT_B]"
      );
      return;
    }

    setSubmitting(true);
    try {
      await window.keplr.enable(chainId);
      const signer = await window.keplr.getOfflineSignerAuto(chainId);
      console.log("until here clear.", gasPrice);
      const res = await createPool({
        rpc,
        signer,
        sender: address,
        poolAssets: [
          { token: { denom: denomA, amount: amountA }, weight: weightA },
          { token: { denom: denomB, amount: amountB }, weight: weightB },
        ],
        gasPrice,
      });

      console.log("Pool creation tx success:", res.transactionHash);
    } catch (e) {
      console.error("Pool creation failed:", e?.message || e);
    } finally {
      setSubmitting(false);
    }
  }, [onClick, address, chainId, rpc, gasPrice]);

  if (!address) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={submitting}
    >
      {submitting ? "Creating…" : "Create Pool"}
    </button>
  );
}
