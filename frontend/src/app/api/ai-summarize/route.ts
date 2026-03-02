import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');

        if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { descriptions } = await request.json();

        if (!descriptions || !Array.isArray(descriptions) || descriptions.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No descriptions provided for summarization' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Anonymize data: remove potential SIN patterns or common names
        // This is a basic safeguard
        const anonymized = descriptions.map(desc =>
            desc.replace(/\d{4}-\d{6}/g, "[ID]") // Mask SIN-like patterns
                .replace(/[A-Z]{2,}\s[A-Z]{2,}/g, "[NAME]") // Mask full names in uppercase
        ).join("\n\n---\n\n");

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are a data analyst for Kapasa Makasa University. Below is a list of anonymized incident descriptions reported this week. 
Summarize the key trends, common issues, and any recurring patterns you see. Focus on actionable insights for campus security and maintenance. 
Be concise and professional. Do NOT invent data. If no clear trends exist, say so.

REPORTS:
${anonymized}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ summary: text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Error in AI summarize API:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate summary', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
