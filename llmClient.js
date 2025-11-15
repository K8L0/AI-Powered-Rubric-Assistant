async function callLLM(prompt) {
  try {
    const response = await fetch("/.netlify/functions/callLLM", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP Error: ${response.status}`);
    return data.text;
  } catch (error) {
    console.error("Error calling LLM:", error);
    throw error;
  }
}
