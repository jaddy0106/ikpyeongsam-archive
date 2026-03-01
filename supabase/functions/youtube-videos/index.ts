const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CHANNEL_HANDLE = '@anonymouscritics';
const TARGET_PLAYLIST_TITLE = '연동용';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Resolve channel ID from handle
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${apiKey}`
    );
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Channel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelId = channelData.items[0].id;

    // Step 2: Find the '연동용' playlist
    let targetPlaylistId: string | null = null;
    let nextPageToken: string | undefined;

    do {
      const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
      playlistUrl.searchParams.set('part', 'snippet');
      playlistUrl.searchParams.set('channelId', channelId);
      playlistUrl.searchParams.set('maxResults', '50');
      playlistUrl.searchParams.set('key', apiKey);
      if (nextPageToken) playlistUrl.searchParams.set('pageToken', nextPageToken);

      const playlistRes = await fetch(playlistUrl.toString());
      const playlistData = await playlistRes.json();

      const found = playlistData.items?.find((p: any) => p.snippet.title === TARGET_PLAYLIST_TITLE);
      if (found) {
        targetPlaylistId = found.id;
        break;
      }
      nextPageToken = playlistData.nextPageToken;
    } while (nextPageToken);

    if (!targetPlaylistId) {
      return new Response(
        JSON.stringify({ success: false, error: `Playlist '${TARGET_PLAYLIST_TITLE}' not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Get recent videos from the target playlist
    const url = new URL(req.url);
    const maxResults = url.searchParams.get('max') || '4';

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${targetPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
    );
    const videosData = await videosRes.json();

    if (!videosData.items) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch videos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videos = videosData.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      date: item.snippet.publishedAt,
      description: item.snippet.description?.substring(0, 100),
    }));

    return new Response(
      JSON.stringify({ success: true, videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
