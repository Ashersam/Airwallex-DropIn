import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Test DB connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB Error:", err);
  } else {
    console.log("✅ DB Connected:", res.rows[0]);
  }
});

let accessToken = null;

// ======================
// 🔑 AIRWALLEX TOKEN
// ======================
async function getAccessToken() {
  const response = await axios.post(
    `${process.env.AIRWALLEX_BASE_URL}/api/v1/authentication/login`,
    {},
    {
      headers: {
        "x-client-id": process.env.AIRWALLEX_CLIENT_ID,
        "x-api-key": process.env.AIRWALLEX_API_KEY,
        "x-login-as": process.env.CONNECTED_ACCOUNT_ID,
        "Content-Type": "application/json",
      },
    }
  );

  accessToken = response.data.token;
  return accessToken;
}

// ======================
// 📦 GET ORDER BY TABLE
// ======================
app.get("/get-order/:tableId", async (req, res) => {
  const tableId = Number(req.params.tableId);

  try {
    // 🔥 Get order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE table_id = $1 LIMIT 1`,
      [tableId]
    );

    if (orderResult.rows.length === 0) {
      return res.json({ message: "No order" });
    }

    const order = orderResult.rows[0];

    // 🔥 Get items
    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );

    const items = itemsResult.rows;

    // 🔥 calculations
    const subtotal = items.reduce(
      (sum, i) => sum + i.qty * i.price,
      0
    );

    const discount = Number(order.discount || 0);
    const taxable = subtotal - discount;
    const tax = (taxable * (order.tax_percent || 0)) / 100;
    const total = taxable + tax;

    res.json({
      ...order,
      items,
      subtotal,
      tax,
      total
    });

  } catch (err) {
    console.error("❌ DB ERROR:", err);
    res.status(500).send("DB error");
  }
});

// ======================
// 💳 CREATE PAYMENT (WEB)
// ======================
app.post("/create-payment-intent", async (req, res) => {
  try {
    await getAccessToken();

    const { amount, currency } = req.body;

    const response = await axios.post(
      `${process.env.AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/create`,
      {
        amount,
        currency,
        request_id: `req_${Date.now()}`,
        merchant_order_id: `order_${Date.now()}`,
        confirmation_method: "automatic",
        capture_method: "automatic",
        customer: {
          merchant_customer_id: "cust_123"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("❌ PAYMENT ERROR:", err.response?.data);
    res.status(500).json(err.response?.data);
  }
});

// ======================
// 💳 CREATE PAYMENT (NATIVE)
// ======================
app.post("/create-payment-intent-native", async (req, res) => {
  try {
    await getAccessToken();

    const { amount, currency } = req.body;

    const response = await axios.post(
      `${process.env.AIRWALLEX_BASE_URL}/api/v1/pa/payment_intents/create`,
      {
        amount,
        currency,
        request_id: `req_${Date.now()}`,
        merchant_order_id: `order_${Date.now()}`,
        confirmation_method: "automatic",
        capture_method: "automatic",
        customer: {
          merchant_customer_id: "cust_123"
        },
        payment_method_options: {
          card: { auto_capture: true }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.error("❌ ERROR:", err.response?.data);
    res.status(500).json(err.response?.data);
  }
});

// ======================
// ✅ MARK PAID
// ======================
app.post("/mark-paid", async (req, res) => {
  const { orderId } = req.body;

  try {
    await pool.query(
      `UPDATE orders SET status = 'PAID' WHERE id = $1`,
      [orderId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).send("DB error");
  }
});

app.listen(5000, () => console.log("🚀 Backend running on 5000"));