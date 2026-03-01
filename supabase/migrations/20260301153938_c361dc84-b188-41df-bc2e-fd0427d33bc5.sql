
-- 1. songs 테이블 (공식 익평삼 리뷰 곡)
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year smallint,
  month smallint,
  artist text NOT NULL,
  title text NOT NULL,
  album text,
  release_date text,
  cover_url text,
  isrc text,
  youtube_url text,
  ip_youtube_url text,
  abc text,
  rate_1 numeric,
  rate_2 numeric,
  rate_3 numeric,
  avg_rating numeric,
  comment_1 text,
  comment_2 text,
  comment_3 text,
  genre text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (공개 데이터)
CREATE POLICY "Anyone can view songs"
  ON public.songs FOR SELECT
  USING (true);

-- 2. artist_aliases 테이블
CREATE TABLE public.artist_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  aliases text NOT NULL
);

ALTER TABLE public.artist_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view aliases"
  ON public.artist_aliases FOR SELECT
  USING (true);

-- 3. user_reviews 테이블
CREATE TABLE public.user_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id text NOT NULL,
  song_info text,
  reviewer_name text,
  rating numeric NOT NULL DEFAULT 0,
  comment text,
  likes_count integer NOT NULL DEFAULT 0,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, song_id)
);

ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 리뷰 읽기 가능
CREATE POLICY "Anyone can view reviews"
  ON public.user_reviews FOR SELECT
  USING (true);

-- 본인만 리뷰 작성
CREATE POLICY "Users can insert own reviews"
  ON public.user_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 리뷰 수정
CREATE POLICY "Users can update own reviews"
  ON public.user_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인만 리뷰 삭제
CREATE POLICY "Users can delete own reviews"
  ON public.user_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_user_reviews_updated_at
  BEFORE UPDATE ON public.user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 인덱스
CREATE INDEX idx_user_reviews_song_id ON public.user_reviews (song_id);
CREATE INDEX idx_user_reviews_user_id ON public.user_reviews (user_id);
CREATE INDEX idx_songs_year_month ON public.songs (year, month);
