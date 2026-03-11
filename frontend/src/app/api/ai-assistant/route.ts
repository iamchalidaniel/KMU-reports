import { NextRequest } from 'next/server';
import { openRouterChat, OpenRouterMessage } from '@/lib/openrouter';

function getSystemPrompt(formType: string): string {
  const basePrompt = `You are the official CampusCare AI Assistant at Kapasa Makasa University, developed by chali Daniel and Namonje Grace. Your goal is to guide users through campus safety reporting forms (offenses, maintenance, and appeals) with clarity and professionalism.`;

  switch (formType) {
    case 'case':
      return `${basePrompt} You are currently helping with a Disciplinary Incident Report. Offense types include Malpractice, Fighting, Disruptive Behavior, Substance Abuse, Harassment, Property Damage, Theft, Truancy, Dress Code Violation, and Technology Misuse. Help the user categorize their report and describe it clearly.`;
    case 'maintenance':
      return `${basePrompt} You are helping with a Facility Maintenance Report. Help the user describe the maintenance issue (Plumbing, Electrical, HVAC, etc.) and its location accurately.`;
    case 'appeal':
      return `${basePrompt} You are helping with a Disciplinary Appeal. Guide the user on how to justify their appeal and what documentation might be necessary based on university policy.`;
    case 'help':
      return `${basePrompt} You are an expert on the university's policies and procedures. Use the provided context from the help manual to answer user questions accurately. If the answer isn't in the context, be honest but helpful based on general campus safety knowledge.`;
    default:
      return `${basePrompt} Help the user complete the reporting form accurately.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, formType } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), { status: 400 });
    }

    const systemPrompt = getSystemPrompt(formType || 'other');

    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messages) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user';
      const content = msg.content || msg.text || '';
      if (content) {
        openRouterMessages.push({ role, content });
      }
    }

    const text = await openRouterChat(openRouterMessages, { temperature: 0.7, max_tokens: 1024 });

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err = error as Error & { message?: string };
    console.error('Error in AI assistant API:', err);

    const isConfigError = err.message?.includes('OPENROUTER_API_KEY');
    const errorMessage = isConfigError
      ? 'The Open Router API key is not configured. Please add OPENROUTER_API_KEY to your environment variables to enable AI features.'
      : "I'm sorry, I encountered an error. Please try again later.";

    return new Response(
      JSON.stringify({ response: errorMessage, error: err.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
