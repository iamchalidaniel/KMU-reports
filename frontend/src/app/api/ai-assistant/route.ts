import { NextRequest } from 'next/server';

// Define the system prompt based on form type
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
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
      return new Response(
        JSON.stringify({
          response: "Assistant: The Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables to enable AI features.",
          error: 'Gemini API key not configured'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const { messages, formType } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), { status: 400 });
    }

    const systemPrompt = getSystemPrompt(formType || 'other');

    // Transform and alternate roles correctly
    let transformedHistory: any[] = [];

    // Start with system prompt as the first user message parts prefix or separate message
    transformedHistory.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    transformedHistory.push({
      role: 'model',
      parts: [{ text: "Understood. I am ready to assist you according to those instructions. How can I help you today?" }]
    });

    messages.forEach((msg: any) => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const text = msg.content || msg.text || '';

      if (transformedHistory.length > 0 && transformedHistory[transformedHistory.length - 1].role === role) {
        transformedHistory[transformedHistory.length - 1].parts[0].text += `\n${text}`;
      } else {
        transformedHistory.push({
          role,
          parts: [{ text }]
        });
      }
    });

    // Gemini sendMessage expects the LAST message to be the prompt, and history should not contain it
    const lastMsg = transformedHistory[transformedHistory.length - 1];
    let history = transformedHistory.slice(0, -1);
    let prompt = lastMsg.parts[0].text;

    // Ensure alternating roles in history
    if (history.length > 0 && history[history.length - 1].role === 'user') {
      // If history ends with user, and prompt is also user, we need to insert a model filler or merge
      // But based on our logic, it should already be alternating.
    }

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error in AI assistant API:', error);

    // Handle safety filter blocks vs actual crashes
    const errorMessage = error.message?.includes('SAFETY')
      ? "I'm sorry, I can't answer that due to safety policies."
      : "I'm sorry, I encountered an error. Please check your API configuration.";

    return new Response(
      JSON.stringify({ response: errorMessage, error: error.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}