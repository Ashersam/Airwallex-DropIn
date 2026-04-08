"use client";

import { useSearchParams } from "next/navigation";

export default function Success() {
  const params = useSearchParams();

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* 🎉 GIF Wrapper */}
        <div style={styles.gifWrapper}>
          <img
            src="/success.gif"
            alt="success"
            style={styles.gif}
          />
        </div>

        <h1 style={styles.title}>Payment Successful</h1>

        <p style={styles.subtitle}>
          Your payment has been processed successfully.
        </p>

        <div style={styles.amountBox}>
          {params.get("amount")} {params.get("currency")}
        </div>

        <a href="/table/1" style={styles.button}>
          Back to Home
        </a>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white"
  },

  card: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(12px)",
    padding: 40,
    borderRadius: 20,
    textAlign: "center",
    width: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
  },

  gifWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative"
  },

  gif: {
    width: 200,
    borderRadius: "30%",
    mixBlendMode: "lighten", // 🔥 blends with background
    filter: "drop-shadow(0 0 15px rgba(74,222,128,0.5))"
  },

  title: {
    fontSize: 26,
    marginBottom: 10,
    fontWeight: "600"
  },

  subtitle: {
    opacity: 0.7,
    marginBottom: 25,
    fontSize: 14
  },

  amountBox: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#4ade80",
    letterSpacing: "1px"
  },

  button: {
    padding: "12px 26px",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: 12,
    color: "white",
    textDecoration: "none",
    display: "inline-block",
    transition: "all 0.3s ease"
  }
};