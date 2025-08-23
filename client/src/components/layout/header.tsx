import { Link, useLocation } from "wouter";
import { getCurrentUser, removeToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Heart, Bell, ChevronDown, LogOut, User, Calendar, Settings, Shield, Users } from "lucide-react";
import { canAccessAdminConsole, UserRole } from "@/lib/permissions";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Patients", href: "/patients" },
  { name: "Schedule", href: "/schedule" },
  { name: "Reports", href: "/reports" },
];

export default function Header() {
  const [location] = useLocation();
  const user = getCurrentUser();
  
  const handleLogout = () => {
    removeToken();
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                <Heart className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-bold text-text-primary">CareConnect</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8 ml-10">
              {navigation.map((item) => {
                const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-1 pb-4 pt-1 text-sm font-medium border-b-2 ${
                      isActive
                        ? "text-primary border-primary"
                        : "text-text-secondary hover:text-text-primary border-transparent"
                    }`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <Bell size={18} className="text-text-secondary hover:text-text-primary" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-text-primary font-medium hidden sm:block">
                    {user?.name || "User"}
                  </span>
                  <ChevronDown size={16} className="text-text-secondary" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem data-testid="menu-profile">
                  <User size={16} className="mr-2" />
                  Profile & Settings
                </DropdownMenuItem>
                <Link href="/schedule">
                  <DropdownMenuItem data-testid="menu-calendar">
                    <Calendar size={16} className="mr-2" />
                    My Calendar
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem data-testid="menu-notifications">
                  <Settings size={16} className="mr-2" />
                  Notification Settings
                </DropdownMenuItem>
                {canAccessAdminConsole(user?.role as UserRole) && (
                  <DropdownMenuItem data-testid="menu-admin">
                    <Shield size={16} className="mr-2" />
                    Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
