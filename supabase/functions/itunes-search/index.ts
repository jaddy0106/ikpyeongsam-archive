const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let term = '';
    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text);
        term = body.term || '';
      }
    } catch {
      // fallback to query params
    }

    if (!term) {
      const url = new URL(req.url);
      term = url.searchParams.get('term') || '';
    }

    if (!term || term.trim().length < 1) {
      return new Response(
        JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrl = `https://itunes.apple.com/search?${new URLSearchParams({
      term: term.trim(),
      media: 'music',
      entity: 'song',
      limit: '15',
      country: 'KR',
    })}`;

    const res = await fetch(searchUrl);
    const data = await res.json();

    const results = (data.results || []).map((item: Record<string, unknown>) => ({
      trackId: item.trackId,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName || '',
      coverUrl: typeof item.artworkUrl100 === 'string'
        ? item.artworkUrl100.replace('100x100', '600x600')
        : '',
      releaseDate: item.releaseDate || '',
      previewUrl: item.previewUrl || '',
      genre: item.primaryGenreName || '',
    }));

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('iTunes search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
