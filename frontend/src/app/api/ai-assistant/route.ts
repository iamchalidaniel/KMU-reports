import { NextRequest } from 'next/server';

// Define the system prompt based on form type
function getSystemPrompt(formType: string): string {
  const basePrompt = `You are an AI assistant for the KMU-reports system at Kapasa Makasa University. Your role is to help users fill out forms correctly and provide guidance on reporting procedures.`;

  switch (formType) {
    case 'case':
      return `${basePrompt} For student discipline cases, help with understanding offense types, severity levels, and proper documentation. Be helpful but do not access or request any real student information. Focus on form structure and process guidance. Reference the following offense types: Malpractice, Fighting, Disruptive Behavior, Substance Abuse, Harassment, Property Damage, Theft, Truancy, Dress Code Violation, Technology Misuse, and Other. Severity levels are: Low, Medium, High, Critical.`;
    case 'maintenance':
      return `${basePrompt} For facility maintenance reports, help with categorizing issues, describing problems clearly, and proper documentation. Focus on form structure and process guidance.`;
    case 'appeal':
      return `${basePrompt} For appeals, help with understanding the appeals process, required documentation, and proper formatting. Focus on form structure and process guidance.`;
    default:
      return `${basePrompt} Help with form completion and reporting procedures. Focus on form structure and process guidance.`;
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
    const conversationHistory = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Generate content using the conversation history
    const result = await model.generateContent(conversationHistory);
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