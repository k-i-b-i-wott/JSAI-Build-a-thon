import 'dotenv/config';
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Baq0NL1NM5AfFwcWeAkibR6BORad6RsUzP6eSiIY6LUmns8e5MKBJQQJ99BFACrIdLPXJ3w3AAAAACOG4Fwa


const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "mistral-ai/Ministral-3B";

export async function main() {
  // Read and encode the image as base64
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const imagePath = path.resolve(__dirname, 'contoso_layout_sketch.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  const client = new Mistral({apiKey: token, serverURL: endpoint});
  
  const response = await client.chat.complete({
    model: modelName,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { 
        role: "user", 
        content: "Write HTML and CSS code for a website based on the following hand drawn sketch, Include all the sections in the sketch",
        images: [
          {
            type: "image/jpeg",
            data: imageBase64
          }
        ]
      }
    ],
    temperature: 1.0,
    max_tokens: 1000,
    top_p: 1.0
  });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});