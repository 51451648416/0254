export const maxDuration = 15;
export const dynamic = "force-dynamic";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const targetUrl = req.query?.url as string;
    const authHeader = req.headers?.authorization;

    if (!targetUrl) {
      return res.status(400).json({ error: "Missing 'url' query parameter" });
    }
    if (!authHeader) {
      return res.status(400).json({ error: "Missing 'Authorization' header" });
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `TDX fetch failed: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Error in /api/tdx/proxy handler:", err);
    return res.status(500).json({ error: err.message || "Proxy request failed" });
  }
}
