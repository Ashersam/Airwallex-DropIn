import axios from "axios";

let token = null;

export async function getAccessToken() {
  const res = await axios.post(
    `${process.env.AIRWALLEX_BASE_URL}/api/v1/authentication/login`,
    {},
    {
      headers: {
        "x-client-id": process.env.AIRWALLEX_CLIENT_ID,
        "x-api-key": process.env.AIRWALLEX_API_KEY,
        "x-login-as": process.env.CONNECTED_ACCOUNT_ID,
      },
    }
  );

  token = res.data.token;
  return token;
}

export async function createIntent(amount, currency) {
  if (!token) await getAccessToken();

  const res = await axios.post(
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
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
}