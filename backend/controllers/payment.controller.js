import { createIntent } from "../services/airwallex.service.js";
import { pool } from "../db.js";

export async function createPayment(req, res) {
  try {
    const { orderId, amount, currency } = req.body;

    const intent = await createIntent(amount, currency);

    // 🔥 save intent
    await pool.query(
      `UPDATE orders SET payment_intent_id=$1 WHERE id=$2`,
      [intent.id, orderId]
    );

    res.json(intent);

  } catch (err) {
    console.error(err);
    res.status(500).send("Payment error");
  }
}