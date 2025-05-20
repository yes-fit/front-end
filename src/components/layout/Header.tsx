import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();

  // Log user state for debugging
  console.log("User:", user);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/images/Union Bank Nigeria Logo.svg"
              alt="Union Bank Logo"
              className="h-20" 
            />
            <span className="font-bold">Union Gym</span>
          </Link>

          {user && (
            <nav className="hidden md:flex gap-6 text-sm">
              {user.role === "admin" ? (
                <>
                  <Link to="/admin/dashboard" className="font-medium transition-colors hover:text-primary">
                    Dashboard
                  </Link>
                  <Link to="/admin/analytics" className="font-medium transition-colors hover:text-primary">
                    Analytics
                  </Link>
                  <Link to="/admin/logs" className="font-medium transition-colors hover:text-primary">
                    Audit Logs
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="font-medium transition-colors hover:text-primary">
                    Dashboard
                  </Link>
                  <Link to="/book" className="font-medium transition-colors hover:text-primary">
                    Book Session
                  </Link>
                  <Link to="/my-bookings" className="font-medium transition-colors hover:text-primary">
                    My Bookings
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.name || "User Avatar"} />
                    <AvatarFallback>{user.name ? user.name.charAt(0) : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{user.name || "Guest"}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "No Email"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={user.role === "admin" ? "/admin/profile" : "/profile"}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}