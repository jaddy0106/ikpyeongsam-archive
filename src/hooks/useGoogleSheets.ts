import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/lib/types";

interface SheetRecord {
  song_id: string;
  year: string;
  month: string;
  artist: string;
  title: string;
  album: string;
  releaseDate: string;
  coverUrl: string;
  ISRC: string;
  cover: string;
  ytUrl: string;
  ABC: string;
  "1rate": string;
  "2rate": string;
  "3rate": string;
  ip3Avg: string;
  "1comments": string;
  "2comments": string;
  "3comments": string;
  IPyoutube: string;
}

export interface AliasRule {
  keyword: string;
  aliases: string[];
}

function mapRecordToSong(record: SheetRecord): Song {
  const rate1 = parseFloat(record["1rate"]) || 0;
  const rate2 = parseFloat(record["2rate"]) || 0;
  const rate3 = parseFloat(record["3rate"]) || 0;
  const avg = parseFloat(record.ip3Avg) || 0;

  return {
    id: record.song_id || `${record.title}-${record.artist}`,
    title: record.title,
    artist: record.artist,
    album: record.album || undefined,
    rating: avg,
    memberRatings: [
      { memberId: "1", rating: rate1, comment: record["1comments"] || undefined },
      { memberId: "2", rating: rate2, comment: record["2comments"] || undefined },
      { memberId: "3", rating: rate3, comment: record["3comments"] || undefined },
    ],
    reviewer: "익평삼",
    genre: record.ABC || undefined,
    youtubeUrl: record.ytUrl || record.IPyoutube || undefined,
    coverUrl: record.coverUrl || undefined,
    createdAt: record.releaseDate || `${record.year}. ${record.month}`,
    isOfficial: true,
  };
}

function parseRules(records: { keyword?: string; aliases?: string }[]): AliasRule[] {
  return records
    .filter((r) => r.keyword && r.aliases)
    .map((r) => ({
      keyword: r.keyword!.toLowerCase().trim(),
      aliases: r.aliases!.split(",").map((a) => a.toLowerCase().trim()).filter(Boolean),
    }));
}

interface SheetsResult {
  songs: Song[];
  rules: AliasRule[];
}

function useSheetsData() {
  return useQuery({
    queryKey: ["google-sheets-all"],
    queryFn: async (): Promise<SheetsResult> => {
      const { data, error } = await supabase.functions.invoke("google-sheets");

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch sheets data");

      const songs = (data.records as SheetRecord[]).map(mapRecordToSong);
      const rules = parseRules(data.rules || []);
      return { songs, rules };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGoogleSheets() {
  const query = useSheetsData();
  return {
    ...query,
    data: query.data?.songs,
  };
}

export function useAliasRules() {
  const query = useSheetsData();
  return {
    ...query,
    data: query.data?.rules,
  };
}
