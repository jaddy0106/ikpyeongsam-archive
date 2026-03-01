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

async function createSheet(accessToken: string, title: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title } } }],
    }),
  });
  const data = await res.json();
  // 이미 존재하는 시트면 무시
  if (data.error?.status === 'INVALID_ARGUMENT' && data.error?.message?.includes('already exists')) {
    return { alreadyExists: true };
  }
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

      if (body.action === 'setup-reviews-sheet') {
        const sheetName = 'UserReview';
        await createSheet(accessToken, sheetName);
        const headers = ['작성일시', '작성자', '작성자ID', '곡정보', '곡ID', '평점', '한줄평'];
        const dummy: string[][] = [headers];
        const names = ['음악팬1', '멜로디러버', '비트마스터', '힙합키드', '발라드퀸', '록스타', '인디보이', '팝매니아', '재즈걸', 'EDM중독'];
        const songs = [
          ['아이브 - Love Dive', 'love-dive-ive'],
          ['뉴진스 - Hype Boy', 'hype-boy-newjeans'],
          ['르세라핌 - ANTIFRAGILE', 'antifragile-lesserafim'],
          ['(여자)아이들 - Queencard', 'queencard-gidle'],
          ['에스파 - Supernova', 'supernova-aespa'],
          ['BTS - Dynamite', 'dynamite-bts'],
          ['BLACKPINK - Pink Venom', 'pink-venom-blackpink'],
          ['임영웅 - 사랑은 늘 도망가', 'love-always-runs-lim'],
          ['아이유 - Blueming', 'blueming-iu'],
          ['세븐틴 - Super', 'super-seventeen'],
        ];
        const ratings = ['4.5', '3.0', '5.0', '4.0', '3.5', '4.5', '2.5', '5.0', '4.0', '3.5'];
        const comments = [
          '중독성 최고!', '비트가 좋아요', '올해 최고의 곡', '안무가 인상적', '계속 듣게 됨',
          '전설적인 곡', '카리스마 넘침', '감동적인 가사', '분위기가 너무 좋아', '에너지 넘치는 곡',
        ];
        for (let i = 0; i < 10; i++) {
          const date = `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          dummy.push([date, names[i], `user_${String(i + 1).padStart(3, '0')}`, songs[i][0], songs[i][1], ratings[i], comments[i]]);
        }
        await writeSheet(accessToken, `${sheetName}!A1:G11`, dummy);
        return new Response(
          JSON.stringify({ success: true, message: `'${sheetName}' 시트 생성 완료` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 리뷰 저장 (UserReview 시트에 append)
      if (body.action === 'append-review') {
        const result = await appendSheet(accessToken, `UserReview!A:G`, body.values as string[][]);
        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 특정 사용자의 리뷰 조회
      if (body.action === 'fetch-user-reviews') {
        const userId = body.userId as string;
        const { records } = await fetchSheet(accessToken, `UserReview!A1:G10000`);
        const userReviews = records.filter((r: Record<string, string>) => r['작성자ID'] === userId);
        return new Response(
          JSON.stringify({ success: true, reviews: userReviews }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 사용자 정보를 Users 시트에 동기화
      if (body.action === 'sync-user') {
        const { userId, displayName, email, avatarUrl } = body as Record<string, string>;
        const usersSheet = 'Users';
        // Users 시트가 없으면 생성
        await createSheet(accessToken, usersSheet);
        
        // 기존 데이터 확인
        let existingRecords: Record<string, string>[] = [];
        try {
          const result = await fetchSheet(accessToken, `${usersSheet}!A1:E10000`);
          existingRecords = result.records;
        } catch {
          // 시트가 비어있으면 헤더 생성
          await writeSheet(accessToken, `${usersSheet}!A1:E1`, [['userId', 'displayName', 'email', 'avatarUrl', 'lastLogin']]);
        }

        const now = new Date().toISOString();
        const existingIdx = existingRecords.findIndex((r) => r['userId'] === userId);
        
        if (existingIdx >= 0) {
          // 기존 사용자 업데이트
          const rowNum = existingIdx + 2;
          await writeSheet(accessToken, `${usersSheet}!A${rowNum}:E${rowNum}`, [
            [userId, displayName || '', email || '', avatarUrl || '', now],
          ]);
        } else {
          // 새 사용자 추가
          await appendSheet(accessToken, `${usersSheet}!A:E`, [
            [userId, displayName || '', email || '', avatarUrl || '', now],
          ]);
        }
        
        return new Response(
          JSON.stringify({ success: true }),
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
