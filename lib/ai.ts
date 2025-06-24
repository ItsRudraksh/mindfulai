import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: `${process.env.OPENROUTER_API_KEY || "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"}`,
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "anthropic/claude-opus-4",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Depressed about life feeling empty",
          },
        ],
      },
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();
