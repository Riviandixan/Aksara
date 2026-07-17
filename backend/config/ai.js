const Groq = require('groq-sdk');

let client;

function getClient() {
  if (!client) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

// Wrapper agar interface tetap sama: generateContent(prompt) → { text() }
async function generateContent(prompt) {
  const completion = await getClient().chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that only responds in valid JSON. Always use proper Unicode encoding for non-Latin scripts (Chinese, Japanese, Arabic, Russian, etc). Never use escape sequences like \\uXXXX — write the actual characters directly.',
      },
      { role: 'user', content: prompt },
    ],
  });

  let text = completion.choices[0].message.content.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return { response: { text: () => text } };
}

// Versi tanpa response_format untuk bahasa non-Latin (Korean, Japanese, Chinese, Russian, dll)
// response_format: json_object di Groq kadang strip karakter Unicode non-ASCII
async function generateContentRaw(prompt) {
  const completion = await getClient().chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Always respond with valid JSON only. Use actual Unicode characters for all scripts (Korean Hangul, Japanese Kanji/Kana, Chinese Hanzi, Russian Cyrillic, etc). Never use romanization or \\uXXXX escape sequences.',
      },
      { role: 'user', content: prompt },
    ],
  });

  let text = completion.choices[0].message.content.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return { response: { text: () => text } };
}

module.exports = { generateContent, generateContentRaw };
