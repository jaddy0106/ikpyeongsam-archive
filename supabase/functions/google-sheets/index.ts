const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SPREADSHEET_ID = '1o36ECPpjG7eHETZ6afHClCRBt3K14xgmDviRLo2lAfs';
const SHEET_NAME = 'SONGS';

function base64url(data: string | ArrayBuffer): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signInput = `${header}.${claim}`;

  // Import the private key
  const pemContent = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signInput)
  );

  const sig = base64url(signature);
  const jwt = `${signInput}.${sig}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function fetchSheet(accessToken: string, range: string) {
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(sheetsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const rows = data.values || [];
  const headers = rows[0] || [];
  const records = rows.slice(1).map((row: string[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
  return { headers, records };
}

async function writeSheet(accessToken: string, range: string, values: string[][]) {
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(sheetsUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

async function batchUpdateSheet(accessToken: string, data: { range: string; values: string[][] }[]) {
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`;
  const res = await fetch(sheetsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data,
    }),
  });
  const result = await res.json();
  if (result.error) throw new Error(JSON.stringify(result.error));
  return result;
}

async function appendSheet(accessToken: string, range: string, values: string[][]) {
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(sheetsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientEmail = Deno.env.get('GOOGLE_SA_CLIENT_EMAIL')?.trim();
    const privateKey = Deno.env.get('GOOGLE_SA_PRIVATE_KEY')?.trim();
    
    if (!clientEmail || !privateKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google SA credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken(clientEmail, privateKey);

    // POST: check for write action
    if (req.method === 'POST') {
      let body: Record<string, unknown> = {};
      try {
        const text = await req.text();
        if (text) body = JSON.parse(text);
      } catch { /* empty body = read request */ }

      if (body.action === 'write-rules') {
        const result = await writeSheet(accessToken, body.range as string, body.values as string[][]);
        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'append-song') {
        const result = await appendSheet(accessToken, `${SHEET_NAME}!A:W`, body.values as string[][]);
        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'backfill-genre') {
        // 1. 전체 데이터 읽기
        const { headers, records } = await fetchSheet(accessToken, `${SHEET_NAME}!A1:W10000`);
        const ganreIdx = headers.indexOf('Ganre');
        const titleIdx = headers.indexOf('title');
        const artistIdx = headers.indexOf('artist');

        if (ganreIdx === -1) {
          return new Response(
            JSON.stringify({ success: false, error: 'Ganre column not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Ganre가 비어있는 행 찾기
        const emptyRows: { rowIndex: number; title: string; artist: string }[] = [];
        records.forEach((rec, i) => {
          const title = rec[headers[titleIdx]] || '';
          const artist = rec[headers[artistIdx]] || '';
          const ganre = rec[headers[ganreIdx]] || '';
          if (!ganre && title) {
            emptyRows.push({ rowIndex: i + 2, title, artist }); // +2: header + 0-index
          }
        });

        // 3. iTunes에서 장르 조회 (5개씩 병렬, 최대 50곡)
        const allUpdates: { range: string; values: string[][] }[] = [];
        const limit = Math.min(emptyRows.length, 50);
        const batchSize = 5;
        for (let i = 0; i < limit; i += batchSize) {
          const batch = emptyRows.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (row) => {
              try {
                const searchUrl = `https://itunes.apple.com/search?${new URLSearchParams({
                  term: `${row.artist} ${row.title}`,
                  media: 'music',
                  entity: 'song',
                  limit: '1',
                  country: 'KR',
                })}`;
                const res = await fetch(searchUrl);
                const data = await res.json();
                const genre = data.results?.[0]?.primaryGenreName || '';
                return { ...row, genre };
              } catch {
                return { ...row, genre: '' };
              }
            })
          );

          for (const r of results) {
            if (r.genre) {
              const col = String.fromCharCode(65 + ganreIdx);
              allUpdates.push({ range: `${SHEET_NAME}!${col}${r.rowIndex}`, values: [[r.genre]] });
            }
          }
        }

        // 4. 한 번의 batchUpdate로 모두 쓰기
        if (allUpdates.length > 0) {
          await batchUpdateSheet(accessToken, allUpdates);
        }

        return new Response(
          JSON.stringify({ success: true, total: emptyRows.length, updated: allUpdates.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET: fetch data
    const [songsData, rulesData] = await Promise.all([
      fetchSheet(accessToken, `${SHEET_NAME}!A1:V10000`),
      fetchSheet(accessToken, `Rules!A1:B1000`).catch(() => ({ headers: [], records: [] })),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        headers: songsData.headers,
        records: songsData.records,
        totalRows: songsData.records.length,
        rules: rulesData.records,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Google Sheets error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
