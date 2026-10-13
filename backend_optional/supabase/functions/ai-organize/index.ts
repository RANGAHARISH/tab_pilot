import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // CORS headers
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
    const { tabs } = await req.json();

    if (!tabs || !Array.isArray(tabs)) {
      return new Response(JSON.stringify({ error: 'Missing tabs array' }), {
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

    const systemPrompt = `You are a browser tab organizer. Given a list of open tabs (id, title, url, domain), group related tabs into cohesive clusters.
Return ONLY valid JSON matching this schema:
[
  {
    "category": string,
    "suggestedGroupName": string,
    "reason": string,
    "confidence": number between 0.0 and 1.0,
    "tabIds": number[]
  }
]`;

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
          { role: 'user', content: JSON.stringify(tabs) },
        ],
        temperature: 0.2,
      }),
    });

    const completion = await openAiResponse.json();
    const rawContent = completion.choices?.[0]?.message?.content || '[]';
    const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const suggestions = JSON.parse(cleanJson);

    return new Response(JSON.stringify(suggestions), {
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
