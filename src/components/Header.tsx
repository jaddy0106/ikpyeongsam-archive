import { Link, useLocation } from "react-router-dom";
import { Music, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "홈", path: "/" },
  { label: "아카이브", path: "/archive" },
  { label: "리뷰 등록", path: "/add-review" },
];

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Music className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">익평삼</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/mypage" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                {profile?.display_name || "마이페이지"}
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" className="font-medium" onClick={signInWithGoogle}>
              Google 로그인
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 px-3">
              {user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/mypage"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2 text-sm font-medium text-foreground"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {profile?.display_name || "마이페이지"}
                  </Link>
                  <Button size="sm" variant="outline" className="w-full" onClick={signOut}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="w-full font-medium" onClick={signInWithGoogle}>
                  Google 로그인
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
