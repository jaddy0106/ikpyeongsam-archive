import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1o36ECPpjG7eHETZ6afHClCRBt3K14xgmDviRLo2lAfs';

function base64url(data: string | ArrayBuffer): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const signInput = `${header}.${claim}`;
  const pemContent = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signInput));
  const sig = base64url(signature);
  const jwt = `${signInput}.${sig}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function fetchSheet(accessToken: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const rows = data.values || [];
  const headers = rows[0] || [];
  const records = rows.slice(1).map((row: string[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((h: string, i: number) => { obj[h] = row[i] || ''; });
    return obj;
  });
  return { headers, records };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientEmail = Deno.env.get('GOOGLE_SA_CLIENT_EMAIL')?.trim();
    const privateKey = Deno.env.get('GOOGLE_SA_PRIVATE_KEY')?.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!clientEmail || !privateKey) {
      return new Response(JSON.stringify({ success: false, error: 'Google SA credentials missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const accessToken = await getAccessToken(clientEmail, privateKey);

    // 1. Migrate SONGS
    const { records: songRecords } = await fetchSheet(accessToken, 'SONGS!A1:V10000');
    const songsToInsert = songRecords.map((r) => ({
      id: r.song_id || crypto.randomUUID(),
      year: r.year ? parseInt(r.year) : null,
      month: r.month ? parseInt(r.month) : null,
      artist: r.artist || '',
      title: r.title || '',
      album: r.album || null,
      release_date: r.releaseDate || null,
      cover_url: r.coverUrl || null,
      isrc: r.ISRC || null,
      youtube_url: r.ytUrl || null,
      ip_youtube_url: r.IPyoutube || null,
      abc: r.ABC || null,
      rate_1: r['1rate'] ? parseFloat(r['1rate']) : null,
      rate_2: r['2rate'] ? parseFloat(r['2rate']) : null,
      rate_3: r['3rate'] ? parseFloat(r['3rate']) : null,
      avg_rating: r.ip3Avg ? parseFloat(r.ip3Avg) : null,
      comment_1: r['1comments'] || null,
      comment_2: r['2comments'] || null,
      comment_3: r['3comments'] || null,
      genre: r.Ganre || null,
    })).filter((s) => s.title);

    // Upsert in batches of 100
    let songsInserted = 0;
    for (let i = 0; i < songsToInsert.length; i += 100) {
      const batch = songsToInsert.slice(i, i + 100);
      const { error } = await supabase.from('songs').upsert(batch, { onConflict: 'id' });
      if (error) throw new Error(`Songs upsert error: ${error.message}`);
      songsInserted += batch.length;
    }

    // 2. Migrate Rules
    const { records: rulesRecords } = await fetchSheet(accessToken, 'Rules!A1:B1000').catch(() => ({ headers: [], records: [] }));
    const rulesToInsert = rulesRecords
      .filter((r) => r.keyword && r.aliases)
      .map((r) => ({
        keyword: r.keyword,
        aliases: r.aliases,
      }));

    if (rulesToInsert.length > 0) {
      // Clear existing and insert fresh
      await supabase.from('artist_aliases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('artist_aliases').insert(rulesToInsert);
      if (error) throw new Error(`Rules insert error: ${error.message}`);
    }

    // 3. Migrate UserReview
    const { records: reviewRecords } = await fetchSheet(accessToken, 'UserReview!A1:I10000').catch(() => ({ headers: [], records: [] }));
    const reviewsToInsert = reviewRecords
      .filter((r) => r['작성자ID'] && r['곡ID'])
      .map((r) => ({
        user_id: r['작성자ID'],
        song_id: r['곡ID'],
        song_info: r['곡정보'] || null,
        reviewer_name: r['작성자'] || null,
        rating: r['평점'] ? parseFloat(r['평점']) : 0,
        comment: r['한줄평'] || null,
        likes_count: r['좋아요'] ? parseInt(r['좋아요']) : 0,
        cover_url: r['coverUrl'] || null,
        created_at: parseKoreanDate(r['작성일시']),
      }));

    let reviewsInserted = 0;
    for (let i = 0; i < reviewsToInsert.length; i += 100) {
      const batch = reviewsToInsert.slice(i, i + 100);
      const { error } = await supabase.from('user_reviews').upsert(batch, { onConflict: 'user_id,song_id' });
      if (error) throw new Error(`Reviews upsert error: ${error.message}`);
      reviewsInserted += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      songs: songsInserted,
      rules: rulesToInsert.length,
      reviews: reviewsInserted,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function parseKoreanDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    // Try parsing "2026. 3. 1. 오후 6:07:54" format
    const match = dateStr.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, year, month, day, ampm, hour, min, sec] = match;
      let h = parseInt(hour);
      if (ampm === '오후' && h < 12) h += 12;
      if (ampm === '오전' && h === 12) h = 0;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(min), parseInt(sec || '0')).toISOString();
    }
    // Try ISO or other standard formats
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}
