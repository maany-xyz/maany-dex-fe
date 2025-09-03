"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@/components/WalletContext";

function truncate(addr) {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function buildChainConfigFromEnv(chainId) {
  const suggest = process.env.NEXT_PUBLIC_ENABLE_SUGGEST === "true";
  if (!suggest) return null;

  const rpc = process.env.NEXT_PUBLIC_RPC;
  const rest = process.env.NEXT_PUBLIC_REST;
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME;
  const baseDenom = process.env.NEXT_PUBLIC_MIN_DENOM; // e.g. 'uatom'
  const displayDenom = process.env.NEXT_PUBLIC_DENOM; // e.g. 'ATOM'
  const decimals = Number(process.env.NEXT_PUBLIC_DECIMALS || 6);
  const bech32 = process.env.NEXT_PUBLIC_BECH32_PREFIX; // e.g. 'cosmos'
  const coinType = Number(process.env.NEXT_PUBLIC_COIN_TYPE || 118);
  // Optional: comma-separated features. Deprecated ones will be stripped.
  const rawFeatures = (process.env.NEXT_PUBLIC_FEATURES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const deprecated = new Set(["stargate", "no-legacy-stdTx"]);
  const features = rawFeatures.filter((f) => !deprecated.has(f));

  if (!rpc || !rest || !chainName || !baseDenom || !displayDenom || !bech32) {
    return null;
  }

  return {
    chainId,
    chainName,
    rpc,
    rest,
    bip44: { coinType },
    bech32Config: {
      bech32PrefixAccAddr: bech32,
      bech32PrefixAccPub: `${bech32}pub`,
      bech32PrefixValAddr: `${bech32}valoper`,
      bech32PrefixValPub: `${bech32}valoperpub`,
      bech32PrefixConsAddr: `${bech32}valcons`,
      bech32PrefixConsPub: `${bech32}valconspub`,
    },
    currencies: [
      {
        coinDenom: displayDenom,
        coinMinimalDenom: baseDenom,
        coinDecimals: decimals,
      },
    ],
    feeCurrencies: [
      {
        coinDenom: displayDenom,
        coinMinimalDenom: baseDenom,
        coinDecimals: decimals,
      },
    ],
    stakeCurrency: {
      coinDenom: displayDenom,
      coinMinimalDenom: baseDenom,
      coinDecimals: decimals,
    },
    ...(features.length ? { features } : {}),
  };
}

export default function ConnectKeplrButton({ className }) {
  const [installed, setInstalled] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const { address, setAddress } = useWallet();

  const chainId = useMemo(
    () => process.env.NEXT_PUBLIC_CHAIN_ID || "cosmoshub-4",
    []
  );

  useEffect(() => {
    // Keplr injects window.keplr and window.getOfflineSignerAuto
    const t = setInterval(() => {
      if (typeof window !== "undefined" && window.keplr) {
        setInstalled(true);
        clearInterval(t);
      }
    }, 200);
    // Fallback in case it never appears
    const timeout = setTimeout(() => clearInterval(t), 5000);
    return () => {
      clearInterval(t);
      clearTimeout(timeout);
    };
  }, []);

  const connect = useCallback(async () => {
    setError("");
    if (!window?.keplr) {
      setInstalled(false);
      setError("Keplr not detected. Please install your forked extension.");
      return;
    }
    setConnecting(true);
    try {
      // Optionally suggest chain if configured
      const chainConfig = buildChainConfigFromEnv(chainId);
      if (chainConfig && window.keplr.experimentalSuggestChain) {
        try {
          await window.keplr.experimentalSuggestChain(chainConfig);
        } catch (e) {
          // Continue to try enable even if suggestion fails
          console.warn("Chain suggestion failed:", e);
        }
      }

      await window.keplr.enable(chainId);
      const signer = await window.getOfflineSignerAuto(chainId);
      const accounts = await signer.getAccounts();
      console.log("the accounts are ", accounts);
      if (accounts?.[0]?.address) {
        setAddress(accounts[0].address);
      } else {
        throw new Error("No accounts returned by Keplr");
      }
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [chainId]);

  const disconnect = useCallback(() => {
    setAddress("");
    setError("");
  }, [setAddress]);

  if (!installed) {
    return (
      <button type="button" className={className} onClick={connect}>
        install keplr to connect
      </button>
    );
  }

  if (address) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <span
          className={className}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            border: "1px solid var(--gray-alpha-200)",
            borderRadius: 128,
          }}
        >
          {truncate(address)}
        </span>
        <button type="button" className={className} onClick={disconnect}>
          disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={connect}
      disabled={connecting}
    >
      {connecting ? "connecting…" : "connect wallet"}
    </button>
  );
}
