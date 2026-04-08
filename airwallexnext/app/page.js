"use client";

import { useState, useRef } from "react";

export default function Home() {
  const ref = useRef(null);

  const [amount, setAmount] = useState(1);
  const [currency, setCurrency] = useState("SGD");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  async function startPayment() {
    try {
      setLoading(true);
      setStatus(null);

      const res = await fetch("http://192.168.1.23:5000/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency
        })
      });

      const intent = await res.json();

      ref.current.innerHTML = "";

      window.Airwallex.init({
        env: "demo"
      });

      const dropin = window.Airwallex.createElement("dropIn", {
        intent_id: intent.id,
        client_secret: intent.client_secret,
        currency: intent.currency
      });

      dropin.mount(ref.current);

      dropin.on("ready", () => {
        setLoading(false);
      });

      dropin.on("success", () => {
        window.location.href = `/success?amount=${amount}&currency=${currency}`;
      });

      dropin.on("error", (err) => {
        console.error(err);
        setStatus("error");
        setLoading(false);
      });

    } catch (err) {
      console.error(err);
      setStatus("error");
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <h2 style={styles.title}>💳 Airwallex Payment</h2>

        {/* FORM */}
        <div style={styles.form}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter Amount"
            style={styles.input}
          />

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={styles.select}
          >
            <option>SGD</option>
            <option>USD</option>
            <option>MYR</option>
          </select>

          <button onClick={startPayment} style={styles.button}>
            Pay Now
          </button>
        </div>

        {/* STATUS */}
        {status === "error" && (
          <div style={styles.error}>❌ Payment Failed</div>
        )}

        {/* LOADING GIF */}
        {loading && (
          <img
            src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"
            alt="loading"
            style={{ width: 80, marginTop: 20 }}
          />
        )}

        {/* DROP-IN */}
        <div ref={ref} style={{ marginTop: 20 }} />

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
    alignItems: "center"
  },
  card: {
    background: "white",
    padding: 30,
    borderRadius: 20,
    width: 600,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    color: "white"
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    color: "black",
  },
  form: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    color: "black",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "1px",
    color: "black",
  },
  select: {
    padding: 10,
    borderRadius: 8,
    border: "none"
  },
  button: {
    padding: "10px 16px",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer"
  },
  error: {
    color: "#f87171",
    textAlign: "center",
    marginTop: 10
  }
};