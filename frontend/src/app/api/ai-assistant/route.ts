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

    // Get the system prompt for the specific form type
    const systemPrompt = getSystemPrompt(formType || 'other');

    // Create the conversation history with the system prompt at the beginning
    // Gemini 1.0 Pro doesn't support the 'system' role in the same way, 
    // so we prepend it to the first user message.
    const formattedMessages = [...messages];
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'user') {
      formattedMessages[0].content = `${systemPrompt}\n\nUser Question: ${formattedMessages[0].content}`;
    } else {
      formattedMessages.unshift({ role: 'user', content: systemPrompt });
    }

    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
    });

    const result = await chat.sendMessage(formattedMessages[formattedMessages.length - 1].content);
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