import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/lib/types";

export interface AliasRule {
  keyword: string;
  aliases: string[];
}

interface SongsRow {
  id: string;
  year: number | null;
  month: number | null;
  artist: string;
  title: string;
  album: string | null;
  release_date: string | null;
  cover_url: string | null;
  isrc: string | null;
  youtube_url: string | null;
  ip_youtube_url: string | null;
  abc: string | null;
  rate_1: number | null;
  rate_2: number | null;
  rate_3: number | null;
  avg_rating: number | null;
  comment_1: string | null;
  comment_2: string | null;
  comment_3: string | null;
  genre: string | null;
}

function mapRowToSong(row: SongsRow): Song {
  const rate1 = row.rate_1 || 0;
  const rate2 = row.rate_2 || 0;
  const rate3 = row.rate_3 || 0;
  const avg = row.avg_rating || 0;

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album || undefined,
    rating: avg,
    memberRatings: [
      { memberId: "1", rating: rate1, comment: row.comment_1 || undefined },
      { memberId: "2", rating: rate2, comment: row.comment_2 || undefined },
      { memberId: "3", rating: rate3, comment: row.comment_3 || undefined },
    ],
    reviewer: "익평삼",
    genre: row.genre || undefined,
    youtubeUrl: row.youtube_url || row.ip_youtube_url || undefined,
    coverUrl: row.cover_url || undefined,
    createdAt: row.release_date || `${row.year}. ${row.month}`,
    isOfficial: true,
  };
}

export function useGoogleSheets() {
  return useQuery({
    queryKey: ["songs"],
    queryFn: async (): Promise<Song[]> => {
      // Fetch all songs - may need pagination for >1000 rows
      const allSongs: SongsRow[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .range(from, from + pageSize - 1)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!data || data.length === 0) break;
        allSongs.push(...(data as unknown as SongsRow[]));
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return allSongs.map(mapRowToSong);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAliasRules() {
  return useQuery({
    queryKey: ["alias-rules"],
    queryFn: async (): Promise<AliasRule[]> => {
      const { data, error } = await supabase
        .from("artist_aliases")
        .select("keyword, aliases");
      if (error) throw error;
      return (data || []).map((r) => ({
        keyword: r.keyword.toLowerCase().trim(),
        aliases: r.aliases.split(",").map((a: string) => a.toLowerCase().trim()).filter(Boolean),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
