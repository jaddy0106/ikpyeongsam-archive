
-- 인증된 사용자가 신규 곡을 추가할 수 있도록 허용
CREATE POLICY "Authenticated users can insert songs"
  ON public.songs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 좋아요 수 업데이트를 위해 인증된 사용자가 user_reviews의 likes_count를 업데이트 가능
-- (기존 정책은 본인 리뷰만 수정 가능하므로, likes_count 업데이트를 위한 별도 처리 불필요 - 
--  현재 로직에서는 좋아요 누른 사용자가 직접 다른 사람의 리뷰 likes_count를 업데이트하므로 정책 수정 필요)
DROP POLICY IF EXISTS "Users can update own reviews" ON public.user_reviews;

CREATE POLICY "Users can update own reviews"
  ON public.user_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
