import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";
import dotenv from "dotenv";

dotenv.config();

const agentThreads = {};

export class AgentService {
// ...existing code...
constructor() {
  this.client = new AIProjectClient(
    "https://model-resource.openai.azure.com/", 
    new DefaultAzureCredential()
  );
  this.agentId = process.env.AGENT_ID;
}
// ...existing code...

  async getOrCreateThread(sessionId) {
    if (!agentThreads[sessionId]) {
      const thread = await this.client.agents.createThread();
      agentThreads[sessionId] = thread.id;
      return thread.id;
    }
    return agentThreads[sessionId];
  }

  async processMessage(sessionId, message) {
    try {
      const threadId = await this.getOrCreateThread(sessionId);

      const createdMessage = await this.client.agents.createMessage(threadId, {
        role: "user",
        content: message,
      });

      let run = await this.client.agents.createRun(threadId, this.agentId);
      
      while (run.status === "queued" || run.status === "in_progress") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await this.client.agents.getRun(threadId, run.id);
      }
      
      if (run.status !== "completed") {
        console.error(`Run failed with status: ${run.status}`);
        return {
          reply: `Sorry, I encountered an error (${run.status}). Please try again.`,
        };
      }
      
      const messages = await this.client.agents.listMessages(threadId);
      
      const assistantMessages = messages.data
        .filter(msg => msg.role === "assistant")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (assistantMessages.length === 0) {
        return { 
          reply: "I don't have a response at this time. Please try again.",
        };
      }

      let responseText = "";
      for (const contentItem of assistantMessages[0].content) {
        if (contentItem.type === "text") {
          responseText += contentItem.text.value;
        }
      }
      
      return {
        reply: responseText,
      };
    } catch (error) {
      console.error("Agent error:", error);
      return {
        reply: "Sorry, I encountered an error processing your request. Please try again.",
      };
    }
  }
}