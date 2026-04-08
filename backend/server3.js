import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/payment", paymentRoutes);
app.use("/webhook", webhookRoutes);

app.listen(5000, () => {
  console.log("🚀 Payment service running");
});