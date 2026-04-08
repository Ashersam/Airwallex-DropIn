import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/airwallex", async (req, res) => {
  try {
    const event = req.body;

    if (event.name === "payment_intent.succeeded") {
      const intentId = event.data.object.id;

      await pool.query(
        `UPDATE orders SET status='PAID', paid_at=NOW()
         WHERE payment_intent_id=$1`,
        [intentId]
      );
    }

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;