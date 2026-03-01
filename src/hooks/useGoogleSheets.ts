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

export function useGoogleSheets() {
  return useQuery({
    queryKey: ["google-sheets-songs"],
    queryFn: async (): Promise<Song[]> => {
      const { data, error } = await supabase.functions.invoke("google-sheets");

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch sheets data");

      return (data.records as SheetRecord[]).map(mapRecordToSong);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
