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
    let transformedMessages: any[] = [];
    messages.forEach((msg: any) => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const text = msg.content || msg.text || '';

      if (transformedMessages.length === 0 || transformedMessages[transformedMessages.length - 1].role !== role) {
        transformedMessages.push({
          role,
          parts: [{ text }]
        });
      } else {
        transformedMessages[transformedMessages.length - 1].parts[0].text += `\n${text}`;
      }
    });

    const systemPrompt = getSystemPrompt(formType || 'other');

    // Prefix the system prompt to the first user message or add it
    if (transformedMessages.length > 0 && transformedMessages[0].role === 'user') {
      transformedMessages[0].parts[0].text = `${systemPrompt}\n\n${transformedMessages[0].parts[0].text}`;
    } else {
      transformedMessages.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
    }

    // Ensure we send a USER message last
    const lastMsg = transformedMessages[transformedMessages.length - 1];
    let history = [];
    let prompt = "";

    if (lastMsg.role === 'user') {
      history = transformedMessages.slice(0, -1);
      prompt = lastMsg.parts[0].text;
    } else {
      history = transformedMessages;
      prompt = "Please continue.";
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
    return new Response(
      JSON.stringify({ error: 'Failed to get response from AI assistant', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}