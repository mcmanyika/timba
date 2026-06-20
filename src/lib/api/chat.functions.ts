import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { z } from "zod";

import { saveInquiry, saveSubscriberFromChat, type InquiryType } from "@/lib/chat/inquiries.server";
import { getRelevantPublications } from "@/lib/chat/publications-context.server";
import { buildSystemPrompt } from "@/lib/chat/system-prompt.server";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatInputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  sourcePage: z.string().max(500).optional(),
  conversationId: z.string().max(100).optional(),
});

const INQUIRY_TYPES = [
  "general",
  "media",
  "speaking",
  "policy",
  "subscription",
  "other",
] as const satisfies readonly InquiryType[];

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "save_inquiry",
      description:
        "Save a contact inquiry when the visitor wants follow-up (media, speaking, policy, general message). Requires name and email.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Visitor full name" },
          email: { type: "string", description: "Visitor email address" },
          message: { type: "string", description: "Their request or question" },
          inquiry_type: {
            type: "string",
            enum: INQUIRY_TYPES,
            description: "Category of inquiry",
          },
          organization: { type: "string", description: "Company or outlet (optional)" },
          phone: { type: "string", description: "Phone number (optional)" },
          summary: { type: "string", description: "One-sentence summary for admin" },
        },
        required: ["name", "email", "message", "inquiry_type"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_subscriber",
      description: "Add visitor to the email list for future essays and papers. Requires first name and email.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          email: { type: "string" },
        },
        required: ["first_name", "email"],
        additionalProperties: false,
      },
    },
  },
];

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key not configured. Set OPENAI_API_KEY (recommended) or VITE_OPENAI_API_KEY in .env / Vercel.",
    );
  }
  return new OpenAI({ apiKey });
}

async function runTool(
  name: string,
  args: Record<string, unknown>,
  meta: { sourcePage?: string; conversationId?: string },
): Promise<string> {
  if (name === "save_inquiry") {
    const inquiry_type = String(args.inquiry_type) as InquiryType;
    if (!INQUIRY_TYPES.includes(inquiry_type)) {
      return JSON.stringify({ ok: false, error: "Invalid inquiry_type" });
    }
    const result = await saveInquiry({
      name: String(args.name),
      email: String(args.email),
      message: String(args.message),
      inquiry_type,
      organization: args.organization ? String(args.organization) : null,
      phone: args.phone ? String(args.phone) : null,
      summary: args.summary ? String(args.summary) : null,
      source_page: meta.sourcePage ?? null,
      conversation_id: meta.conversationId ?? null,
    });
    return JSON.stringify({ ok: true, id: result.id });
  }

  if (name === "save_subscriber") {
    const result = await saveSubscriberFromChat({
      first_name: String(args.first_name),
      email: String(args.email),
      source: meta.sourcePage ? `chat:${meta.sourcePage}` : "chat",
    });
    return JSON.stringify({ ok: true, created: result.created });
  }

  return JSON.stringify({ ok: false, error: "Unknown tool" });
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(chatInputSchema)
  .handler(async ({ data }) => {
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    const queryText = lastUser?.content ?? "";
    const publications = await getRelevantPublications(queryText);
    const systemPrompt = buildSystemPrompt(publications);

    const openai = getOpenAI();
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const conversation: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let relatedLinks = publications.slice(0, 3).map((p) => ({ title: p.title, slug: p.slug }));

    for (let step = 0; step < 4; step++) {
      const completion = await openai.chat.completions.create({
        model,
        messages: conversation,
        tools,
        tool_choice: "auto",
        max_tokens: 800,
        temperature: 0.4,
      });

      const choice = completion.choices[0]?.message;
      if (!choice) throw new Error("No response from assistant.");

      if (choice.tool_calls?.length) {
        conversation.push(choice);
        for (const call of choice.tool_calls) {
          if (call.type !== "function") continue;
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(call.function.arguments) as Record<string, unknown>;
          } catch {
            parsed = {};
          }
          const output = await runTool(call.function.name, parsed, {
            sourcePage: data.sourcePage,
            conversationId: data.conversationId,
          });
          conversation.push({
            role: "tool",
            tool_call_id: call.id,
            content: output,
          });
        }
        continue;
      }

      const reply = choice.content?.trim() ?? "I'm sorry, I couldn't generate a response.";
      return {
        message: reply,
        relatedLinks,
        conversationId: data.conversationId ?? randomUUID(),
      };
    }

    return {
      message: "I've noted your request. Someone from the editorial desk will follow up if needed.",
      relatedLinks,
      conversationId: data.conversationId ?? randomUUID(),
    };
  });
