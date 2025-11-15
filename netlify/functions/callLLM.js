const HF_API_URL = "https://router.huggingface.co/hf-inference/mistralai/Mistral-7B-Instruct-v0.2";
const HF_TOKEN = process.env.HF_ACCESS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!HF_TOKEN) {
    console.error("HF_ACCESS_TOKEN not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid prompt" }),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("HF error:", data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error || "HF API error" }),
      };
    }

    const generatedText = data[0]?.generated_text || "";
    return {
      statusCode: 200,
      body: JSON.stringify({ text: generatedText }),
    };
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
