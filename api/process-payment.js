export default async function handler(req, res) {
if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
const { sourceId, amount, orderId } = req.body || {};
if (!sourceId || !amount || amount <= 0) { res.status(400).json({ error: "Missing sourceId or invalid amount" }); return; }
const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const env = process.env.SQUARE_ENV === "production" ? "production" : "sandbox";
const apiHost = env === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
if (!accessToken || !locationId) { res.status(500).json({ error: "Payment processing is not configured yet" }); return; }
try {
const squareRes = await fetch(apiHost + "/v2/payments", { method: "POST", headers: { "Square-Version": "2024-01-18", "Authorization": "Bearer " + accessToken, "Content-Type": "application/json" }, body: JSON.stringify({ source_id: sourceId, idempotency_key: (orderId || "order") + "-" + Date.now() + "-" + Math.random().toString(36).slice(2), amount_money: { amount: Math.round(amount * 100), currency: "USD" }, location_id: locationId, note: orderId ? ("La Cabana Grill order " + orderId) : "La Cabana Grill order" }) });
const data = await squareRes.json();
if (!squareRes.ok) { res.status(squareRes.status).json({ error: data.errors ? data.errors[0].detail : "Payment failed" }); return; }
res.status(200).json({ success: true, paymentId: data.payment.id, status: data.payment.status });
} catch (err) {
res.status(500).json({ error: "Payment processing error: " + err.message });
}
}
