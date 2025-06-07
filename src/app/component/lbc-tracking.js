// pages/api/lbc-tracking.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const lbcResponse = await fetch(
      "https://lbcapigateway.lbcapps.com/lbctrackingapi/v1/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          lbcOAkey: "5df7cd045407b66215cafc40", // Replace with your valid key if needed
        },
        body: JSON.stringify(req.body), // forward body from frontend
      }
    );

    const text = await lbcResponse.text(); // API might return plain text
    res.status(lbcResponse.status).send(text);
  } catch (error) {
    console.error("Error contacting LBC API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
