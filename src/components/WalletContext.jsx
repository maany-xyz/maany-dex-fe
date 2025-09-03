"use client";

import { createContext, useContext, useState, useMemo } from "react";

const WalletContext = createContext({ address: "", setAddress: () => {} });

export function WalletProvider({ children }) {
  const [address, setAddress] = useState("");

  const value = useMemo(() => ({ address, setAddress }), [address]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}

