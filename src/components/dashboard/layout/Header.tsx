import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Bell, Search, Settings, User, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../../../../supabase/auth";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

interface HeaderProps {
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string; read: boolean }>;
  onMenuClick?: () => void;
  isMobileView?: boolean;
}

const Header = ({
  onSearch = () => {},
  notifications = [
    { id: "1", title: "New project assigned", read: false },
    { id: "2", title: "Meeting reminder", read: false },
    { id: "3", title: "Feedback received on Project X", read: true },
  ],
  onMenuClick,
  isMobileView = false,
}: HeaderProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Use the breadcrumbs hook instead of manual calculation
  const breadcrumbs = useBreadcrumbs();

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    const pathSegments = path.split("/").filter(Boolean);

    // Set page title based on the last segment of the path
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Convert kebab-case or snake_case to Title Case
      const formattedTitle = lastSegment
        .replace(/-|_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setPageTitle(formattedTitle);
    } else {
      setPageTitle("Dashboard");
    }
  }, [location.pathname]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  // Toggle search on mobile
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  if (!user) return null;

  return (
    <div className="w-full h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 fixed top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        {/* Page Title and Breadcrumbs */}
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
          <div className="flex items-center text-xs text-gray-500 overflow-x-auto whitespace-nowrap max-w-[calc(100vw-200px)] md:max-w-none">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.path}>
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0" />
                )}
                {item.isActive ? (
                  <span className="text-gray-700">{item.label}</span>
                ) : (
                  <Link
                    to={item.path}
                    className="hover:text-gray-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 flex justify-center">
        <QuickActions
          recentProjects={[
            { id: "1", title: "Website Redesign" },
            { id: "2", title: "Mobile App UX" },
            { id: "3", title: "Dashboard Analytics" },
          ]}
          recentFeedback={[
            { id: "1", title: "Homepage Feedback" },
            { id: "2", title: "Checkout Flow Issues" },
          ]}
        />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-2">
        {/* Search toggle for mobile */}
        {isMobileView && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSearch}
            className="text-gray-700"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <NotificationsPopover />
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Settings button - hidden on smallest screens */}
        <div className="hidden sm:block">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/dashboard/settings">
                  <Button variant="ghost" size="icon" className="text-gray-700">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-gray-700">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.email || ""}
                />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm">
                {user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2">
              <Link
                to="/dashboard/profile"
                className="flex items-center w-full"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2">
              <Link
                to="/dashboard/settings"
                className="flex items-center w-full"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut()} className="py-2">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Header;
