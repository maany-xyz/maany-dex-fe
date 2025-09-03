"use client";

import { useEffect, useMemo, useState } from "react";
import { osmosis } from "osmojs";

function decodePool(item) {
  try {
    // LCD JSON with @type and expanded fields
    if (item?.["@type"]) {
      const t = item["@type"]; // e.g. "/osmosis.gamm.v1beta1.Pool"
      if (t === "/osmosis.gamm.v1beta1.Pool") {
        return {
          type: "balancer",
          id: item.id,
          poolAssets: (item.pool_assets || []).map((a) => ({
            token: a?.token,
            weight: a?.weight,
          })),
          poolParams: item.pool_params
            ? {
                swapFee: item.pool_params.swap_fee,
                exitFee: item.pool_params.exit_fee,
                smoothWeightChangeParams:
                  item.pool_params.smooth_weight_change_params,
              }
            : undefined,
          totalShares: item.total_shares,
          address: item.address,
          futurePoolGovernor: item.future_pool_governor,
        };
      }
      // Unknown typed JSON; return pass-through with type label
      return { type: t, raw: item };
    }

    // Any with type_url + base64 value (fallback)
    if (item?.type_url && item?.value) {
      if (item.type_url === "/osmosis.gamm.v1beta1.Pool") {
        const bytes =
          typeof atob === "function"
            ? Uint8Array.from(atob(item.value), (c) => c.charCodeAt(0))
            : Buffer.from(item.value, "base64");
        const pool = osmosis.gamm.v1beta1.Pool.decode(bytes);
        return { type: "balancer", ...pool };
      }
      return { type: item.type_url, raw: item };
    }

    // Fallback: unknown structure
    return { type: "unknown", raw: item };
  } catch (e) {
    console.warn("Failed to decode pool entry:", e);
    return { type: item?.["@type"] || item?.type_url || "unknown", raw: item };
  }
}

export default function PoolsWindow({ limit = 10, className }) {
  const rest = useMemo(() => process.env.NEXT_PUBLIC_REST || "", []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pools, setPools] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError("");
      if (!rest) {
        setError("NEXT_PUBLIC_REST is not set");
        return;
      }
      setLoading(true);
      try {
        const { createLCDClient } = await import("osmojs/osmosis/lcd");
        console.log("in useEffect with  rest ", rest);
        const lcd = await createLCDClient({ restEndpoint: rest });
        console.log("created LCD client ", lcd);

        const resp = await lcd.osmosis.gamm.v1beta1.pools({
          pagination: { limit: String(limit) },
        });
        console.log("here with res ", resp);

        const decoded = (resp?.pools || []).map(decodePool);
        console.log("decoded ", decoded);
        if (!cancelled) setPools(decoded);
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [rest, limit]);

  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--gray-alpha-200)",
        borderRadius: 12,
        padding: 16,
        width: "100%",
        maxWidth: 680,
        background: "var(--background)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Available Pools</h3>
        {loading ? (
          <span style={{ fontSize: 12, opacity: 0.7 }}>Loading…</span>
        ) : null}
      </div>
      {error ? (
        <div style={{ color: "#c00", fontSize: 13 }}>Error: {error}</div>
      ) : null}
      {!loading && !error && pools.length === 0 ? (
        <div style={{ fontSize: 13, opacity: 0.8 }}>No pools found.</div>
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        {pools.map((p, i) => {
          if (p?.type === "balancer") {
            // p contains decoded fields from the Balancer Pool proto
            const id = p.id?.toString?.() || String(p.id || i);
            const assets = (p.poolAssets || [])
              .map((a) => `${a?.token?.amount || ""} ${a?.token?.denom || ""}`)
              .join(" • ");
            const fee = p.poolParams?.swapFee || "";
            return (
              <div
                key={id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid var(--gray-alpha-200)",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>Pool #{id}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{assets}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, opacity: 0.8 }}>
                  swap fee: {fee}
                </div>
              </div>
            );
          }
          const label = p?.type || "unknown";
          return (
            <div
              key={i}
              style={{
                border: "1px solid var(--gray-alpha-200)",
                borderRadius: 8,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Unsupported pool type
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
