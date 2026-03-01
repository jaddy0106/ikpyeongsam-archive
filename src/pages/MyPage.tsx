import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const MyPage = () => {
  const { user, profile, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">로그인이 필요합니다</h1>
        <p className="text-sm text-muted-foreground mb-5">Google 계정으로 로그인하여 나만의 리뷰를 관리하세요</p>
        <Button className="font-medium" onClick={signInWithGoogle}>Google 로그인</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{profile?.display_name || "사용자"}</h1>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <h2 className="text-base font-bold text-foreground mb-3">내 리뷰</h2>
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">아직 작성한 리뷰가 없습니다</p>
      </div>
    </div>
  );
};

export default MyPage;
