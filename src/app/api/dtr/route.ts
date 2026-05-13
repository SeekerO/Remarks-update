// app/api/dtr/route.ts  ← VISION ONLY, no Sheets here
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const userContent = body.messages?.[0]?.content ?? [];
        const imagePart = userContent.find((c: any) => c.type === 'image');
        const textPart = userContent.find((c: any) => c.type === 'text');

        if (!imagePart) {
            return NextResponse.json({ content: [{ text: '{"error":"No image found in request"}' }] });
        }

        const base64 = imagePart?.source?.data;
        const mediaType = imagePart?.source?.media_type ?? 'image/jpeg';
        const prompt = textPart?.text ?? '';

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
                        { type: 'text', text: prompt }
                    ]
                }]
            }),
        });

        const groqData = await groqRes.json();
        console.log('Groq status:', groqRes.status);
        console.log('Groq response:', JSON.stringify(groqData).slice(0, 200));

        if (groqData.error) {
            return NextResponse.json({ content: [{ text: JSON.stringify(groqData.error) }] });
        }

        const text: string = groqData.choices?.[0]?.message?.content ?? '';
        return NextResponse.json({ content: [{ text }] });

    } catch (err: any) {
        console.error('Vision route error:', err.message);
        return NextResponse.json({ content: [{ text: JSON.stringify({ error: err.message }) }] }, { status: 500 });
    }
}