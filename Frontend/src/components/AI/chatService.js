const API_KEY = "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" // کلید api چت جی پی تی

export const sendPromptToGPT = async (prompt) => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            temperature: 0.7,
        }),
    })

    if (!response.ok) {
        throw new Error("Failed to fetch response from OpenAI")
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
}