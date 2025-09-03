import Image from "next/image";
import styles from "./page.module.css";
import ConnectKeplrButton from "@/components/ConnectKeplrButton";
import PoolsWindow from "@/components/PoolsWindow";
import SwapTokensButton from "@/components/SwapTokensButton";
import CreatePoolButton from "@/components/CreatePoolButton";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.ctas}>
          <ConnectKeplrButton className={styles.secondary} />
          <CreatePoolButton className={styles.secondary} />
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", width: "100%" }}>
          <PoolsWindow />
        </div>
        <div className={styles.ctas} style={{ marginTop: 16 }}>
          <SwapTokensButton className={styles.secondary} />
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
