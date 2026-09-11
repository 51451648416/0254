export const maxDuration = 15;
export const dynamic = "force-dynamic";

const DEFAULT_KEY = {
  clientId: "jerry0903-d82c8d89-56b2-4628",
  clientSecret: "5fdae95b-b2d6-4b80-a153-2238d6e74db5",
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.TDX_CLIENT_ID || DEFAULT_KEY.clientId;
  const clientSecret = process.env.TDX_CLIENT_SECRET || DEFAULT_KEY.clientSecret;

  const authUrl =
    "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
  const body = `grant_type=client_credentials&client_id=${encodeURIComponent(
    clientId
  )}&client_secret=${encodeURIComponent(clientSecret)}`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`TDX Token request failed: ${res.statusText}`);
  }

  const data: any = await res.json();
  const token = data.access_token;
  cachedToken = {
    token,
    expiresAt: now + (data.expires_in ? data.expires_in * 1000 : 86400000),
  };
  return token;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const emptyResponse = {
    UpdateTime: new Date().toISOString(),
    UpdateInterval: 300,
    LiveEvents: [],
  };

  try {
    const tdxEventsUrl =
      "https://tdx.transportdata.tw/api/basic/v2/Road/Traffic/Live/LiveEvent/Freeway?$filter=contains(Location/FreeExpressHighway/Road,%20%27國道5號%27)&$format=JSON";

    const token = await getToken();
    const response = await fetch(tdxEventsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(200).json(emptyResponse);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.warn("TDX Freeway Live Events fetch error:", err);
    return res.status(200).json(emptyResponse);
  }
}
