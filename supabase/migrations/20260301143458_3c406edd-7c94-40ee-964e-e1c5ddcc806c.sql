
-- Track which user liked which review (review = songId + reviewerId combo)
CREATE TABLE public.review_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  song_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id, reviewer_id)
);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON public.review_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.review_likes FOR DELETE
  USING (auth.uid() = user_id);
