export const maxDuration = 10;
export const dynamic = "force-dynamic";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const clientId =
      body?.clientId ||
      process.env.TDX_CLIENT_ID ||
      "jerry0903-d82c8d89-56b2-4628";
    const clientSecret =
      body?.clientSecret ||
      process.env.TDX_CLIENT_SECRET ||
      "5fdae95b-b2d6-4b80-a153-2238d6e74db5";

    const authUrl =
      "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    const requestBody = `grant_type=client_credentials&client_id=${encodeURIComponent(
      clientId
    )}&client_secret=${encodeURIComponent(clientSecret)}`;

    const response = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res
        .status(response.status)
        .json({ error: `TDX 認證伺服器回應錯誤: ${errText}` });
    }

    const data: any = await response.json();
    return res.status(200).json({ access_token: data.access_token });
  } catch (err: any) {
    console.error("Error in /api/tdx/token handler:", err);
    return res.status(500).json({ error: err.message || "TDX 連線認證失敗" });
  }
}
