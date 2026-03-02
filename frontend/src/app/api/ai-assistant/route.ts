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
    default:
      return `${basePrompt} Help the user complete the reporting form accurately.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dynamically import the Google Generative AI library
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    // Validate API key
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const { messages, formType } = await request.json();

    // Map the messages to the format expected by the Gemini SDK
    // Gemini 1.0+ expects { role: 'user' | 'model', parts: [{ text: string }] }
    // We also ensure roles are mapped correctly if they come in as 'assistant'
    const transformedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || msg.text || '' }]
    }));

    // Get the system prompt and prepend/apply it
    const systemPrompt = getSystemPrompt(formType || 'other');

    if (transformedMessages.length > 0 && transformedMessages[0].role === 'user') {
      transformedMessages[0].parts[0].text = `${systemPrompt}\n\nUser Question: ${transformedMessages[0].parts[0].text}`;
    } else {
      transformedMessages.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
    }

    const history = transformedMessages.slice(0, -1);
    const lastMessage = transformedMessages[transformedMessages.length - 1];

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error in AI assistant API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get response from AI assistant', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}