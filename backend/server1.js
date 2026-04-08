import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { pool } from "./db.js";

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB Error:", err);
  } else {
    console.log("DB Connected:", res.rows[0]);
  }
});


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// DB setup
const adapter = new JSONFile("db.json");
const defaultData = {
  tables: [
    { id: 1 },
    { id: 2 },
    { id: 3 }
  ],
  orders: [
    {
      id: "order1",
      table_id: 1,
      status: "UNPAID",
      items: [
        { name: "Fried Rice", qty: 2, price: 5 },
        { name: "Coke", qty: 1, price: 2 }
      ]
    }
  ]
};

const db = new Low(adapter, defaultData);

await db.read();

// fallback if file empty
db.data ||= defaultData;

await db.write(); // 🔥 important (creates file if missing)

let accessToken = null;

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
  await db.read();

  const tableId = Number(req.params.tableId);

  const order = db.data.orders.find(
    (o) => o.table_id === tableId
  );

  if (!order) return res.json({ message: "No active order" });

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  const discount = order.discount || 0;
  const taxable = subtotal - discount;
  const tax = (taxable * (order.tax_percent || 0)) / 100;
  const total = taxable + tax;

  res.json({
    ...order,
    subtotal,
    tax,
    total
  });
});
// ======================
// 💳 CREATE PAYMENT
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
    console.error(err.response?.data);
    res.status(500).json(err.response?.data);
  }
});
// ======================
// 💳 CREATE PAYMENT NATIVE
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
          card: {
            auto_capture: true
          }
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

  console.log("Incoming orderId:", orderId);

  try {
    const result = await pool.query(
      `UPDATE orders SET status = 'PAID' WHERE id = $1 RETURNING *`,
      [orderId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        error: "Invalid orderId or order not found"
      });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).send("DB error");
  }
});

app.listen(5000, () => console.log("Backend running on 5000"));