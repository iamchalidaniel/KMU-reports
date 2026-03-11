import { NextRequest } from 'next/server';
import { openRouterChat, OpenRouterMessage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { descriptions } = body;

    if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No descriptions provided for summarization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anonymized = descriptions
      .map((desc: string) =>
        String(desc)
          .replace(/\d{4}-\d{6}/g, '[ID]')
          .replace(/[A-Z]{2,}\s[A-Z]{2,}/g, '[NAME]')
      )
      .join('\n\n---\n\n');

    const prompt = `You are a data analyst for Kapasa Makasa University. Below is a list of anonymized incident descriptions reported this week.
Summarize the key trends, common issues, and any recurring patterns you see. Focus on actionable insights for campus security and maintenance.
Be concise and professional. Do NOT invent data. If no clear trends exist, say so.

REPORTS:
${anonymized}`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: 'You are a concise analyst. Output only the summary, no preamble.' },
      { role: 'user', content: prompt },
    ];

    const summary = await openRouterChat(messages, { temperature: 0.3, max_tokens: 1024 });

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in AI summarize API:', err);

    const isConfigError = err.message?.includes('OPENROUTER_API_KEY');
    const summaryMessage = isConfigError
      ? 'AI summarization is currently unavailable because the Open Router API key is not configured. Please add OPENROUTER_API_KEY to your environment variables.'
      : 'Sorry, I encountered an error while analyzing the reports. Please check your AI service configuration.';

    return new Response(
      JSON.stringify({ summary: summaryMessage, error: err.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
