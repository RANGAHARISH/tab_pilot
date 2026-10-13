import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { title, url, content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing content string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OPENAI_API_KEY is not configured on this Supabase Edge Function',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert reading assistant. Given a webpage's title, url, and text content, produce an executive summary and 3-5 key points.
Return ONLY valid JSON matching this schema:
{
  "tabId": 0,
  "url": string,
  "title": string,
  "summary": string,
  "keyPoints": string[],
  "generatedAt": string (ISO date)
}`;

    const safeSnippet = content.slice(0, 8000);

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ title, url, snippet: safeSnippet }) },
        ],
        temperature: 0.3,
      }),
    });

    const completion = await openAiResponse.json();
    const rawContent = completion.choices?.[0]?.message?.content || '{}';
    const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const summaryResult = JSON.parse(cleanJson);

    return new Response(JSON.stringify(summaryResult), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
