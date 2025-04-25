import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/supabase/auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  LayoutDashboard,
  Settings,
  HelpCircle,
  FolderKanban,
  Search,
  MessageSquare,
  BarChart2,
  UserCircle,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  Bell,
  Award,
  Users,
  Zap,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
  badge?: number | string;
  description?: string;
}

interface NavSection {
  title: string;
  icon?: React.ReactNode;
  items: NavItem[];
  defaultExpanded?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

// Group navigation items into logical sections with improved organization
const defaultNavSections: NavSection[] = [
  {
    title: "Overview",
    icon: <Home size={16} />,
    defaultExpanded: true,
    items: [
      {
        icon: <Home size={18} />,
        label: "Home",
        href: "/",
        description: "Return to homepage",
      },
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        href: "/dashboard",
        description: "View your personalized dashboard",
      },
      {
        icon: <Bell size={18} />,
        label: "Notifications",
        href: "/dashboard/notifications",
        badge: 3,
        description: "View your notifications",
      },
    ],
  },
  {
    title: "Projects",
    icon: <FolderKanban size={16} />,
    defaultExpanded: true,
    items: [
      {
        icon: <FolderKanban size={18} />,
        label: "My Projects",
        href: "/dashboard/projects",
        description: "Manage your projects",
      },
      {
        icon: <Search size={18} />,
        label: "Discovery",
        href: "/dashboard/discovery",
        description: "Discover new projects",
      },
      {
        icon: <Users size={18} />,
        label: "Collaborations",
        href: "/dashboard/collaborations",
        description: "View your project collaborations",
      },
    ],
  },
  {
    title: "Feedback",
    icon: <MessageSquare size={16} />,
    defaultExpanded: true,
    items: [
      {
        icon: <MessageSquare size={18} />,
        label: "Feedback",
        href: "/dashboard/feedback",
        description: "View and manage feedback",
      },
      {
        icon: <BarChart2 size={18} />,
        label: "Feedback Analytics",
        href: "/dashboard/feedback-analytics",
        description: "Analyze feedback data",
      },
    ],
  },
  {
    title: "Rewards",
    icon: <Award size={16} />,
    defaultExpanded: false,
    items: [
      {
        icon: <Award size={18} />,
        label: "Achievements",
        href: "/dashboard/achievements",
        description: "View your achievements",
      },
      {
        icon: <Zap size={18} />,
        label: "Points & Rewards",
        href: "/dashboard/rewards",
        badge: "New",
        description: "Check your points and rewards",
      },
    ],
  },
  {
    title: "Account",
    icon: <UserCircle size={16} />,
    defaultExpanded: false,
    items: [
      {
        icon: <UserCircle size={18} />,
        label: "Profile",
        href: "/dashboard/profile",
        description: "Manage your profile",
      },
      {
        icon: <Settings size={18} />,
        label: "Settings",
        href: "/dashboard/settings",
        description: "Configure your account settings",
      },
      {
        icon: <HelpCircle size={18} />,
        label: "Help",
        href: "/dashboard/help",
        description: "Get help and support",
      },
    ],
  },
  {
    title: "Administration",
    icon: <Users size={16} />,
    defaultExpanded: false,
    items: [
      {
        icon: <Users size={18} />,
        label: "Admin Dashboard",
        href: "/dashboard/admin",
        description: "Manage users, roles, and permissions",
      },
    ],
  },
];

const defaultFilters = [
  { color: "bg-green-500", label: "Active" },
  { color: "bg-red-500", label: "High Priority" },
  { color: "bg-yellow-500", label: "In Progress" },
];

const Sidebar = ({ activeItem, onItemClick = () => {} }: SidebarProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  // State for collapsed sidebar
  const [collapsed, setCollapsed] = useState(false);

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Initialize sections based on defaultExpanded property
    return defaultNavSections.reduce(
      (acc, section) => {
        acc[section.title] = section.defaultExpanded ?? true;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });

  // Toggle section expansion
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Determine if a nav item is active based on the current path
  const isNavItemActive = (href: string = ""): boolean => {
    if (href === "/" && location.pathname === "/") return true;
    if (href === "/dashboard" && location.pathname === "/dashboard")
      return true;
    if (
      href !== "/" &&
      href !== "/dashboard" &&
      location.pathname.startsWith(href)
    )
      return true;
    return false;
  };

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth > 1280) {
        // Expand on larger screens
        setCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Expand section when a child item is active
  useEffect(() => {
    defaultNavSections.forEach((section) => {
      const hasActiveChild = section.items.some((item) =>
        isNavItemActive(item.href),
      );
      if (hasActiveChild && !expandedSections[section.title]) {
        setExpandedSections((prev) => ({
          ...prev,
          [section.title]: true,
        }));
      }
    });
  }, [location.pathname]);

  return (
    <div
      className={`h-full border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ${collapsed ? "w-[70px]" : "w-[260px]"} shadow-sm z-20`}
    >
      <div
        className={`p-4 flex ${collapsed ? "justify-center" : "justify-between"} items-center border-b border-gray-100`}
      >
        {!collapsed && (
          <div>
            <h2 className="text-lg font-semibold mb-1">FeedbackLoop</h2>
            <p className="text-sm text-gray-500">Feedback Ecosystem</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-full hover:bg-slate-100"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <TooltipProvider delayDuration={200}>
          {defaultNavSections.map((section) => (
            <div key={section.title} className="mb-6">
              {/* Section Header */}
              <div
                className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-2 cursor-pointer group`}
                onClick={() => !collapsed && toggleSection(section.title)}
              >
                {!collapsed && (
                  <div className="flex items-center gap-2">
                    {section.icon && (
                      <span className="text-gray-500">{section.icon}</span>
                    )}
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                )}
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-60 group-hover:opacity-100"
                    aria-label={
                      expandedSections[section.title]
                        ? "Collapse section"
                        : "Expand section"
                    }
                  >
                    {expandedSections[section.title] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </Button>
                )}
                {collapsed && <Separator className="w-8" />}
              </div>

              {/* Section Items */}
              {(collapsed || expandedSections[section.title]) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isNavItemActive(item.href);
                    return (
                      <Tooltip key={item.label}>
                        <TooltipTrigger asChild>
                          <Link to={item.href || "#"} className="w-full block">
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className={`w-full ${collapsed ? "justify-center px-2" : "justify-start gap-2"} text-sm h-10 relative ${isActive ? "font-medium" : ""}`}
                              onClick={() => onItemClick(item.label)}
                            >
                              <span
                                className={`${isActive ? "text-primary" : "text-gray-500"}`}
                              >
                                {item.icon}
                              </span>
                              {!collapsed && (
                                <span className="flex-1 text-left">
                                  {item.label}
                                </span>
                              )}
                              {!collapsed && item.badge && (
                                <Badge
                                  variant={
                                    typeof item.badge === "string"
                                      ? "outline"
                                      : "default"
                                  }
                                  className={
                                    typeof item.badge === "string"
                                      ? "bg-blue-50 text-blue-600 hover:bg-blue-50"
                                      : ""
                                  }
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              {collapsed && item.badge && (
                                <Badge
                                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
                                  variant={
                                    typeof item.badge === "string"
                                      ? "outline"
                                      : "default"
                                  }
                                >
                                  {typeof item.badge === "number"
                                    ? item.badge
                                    : ""}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent
                            side="right"
                            className="max-w-[200px]"
                          >
                            <div>
                              <p className="font-medium">{item.label}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500">
                                  {item.description}
                                </p>
                              )}
                              {item.badge && (
                                <div className="mt-1">
                                  <Badge
                                    variant={
                                      typeof item.badge === "string"
                                        ? "outline"
                                        : "default"
                                    }
                                    className={
                                      typeof item.badge === "string"
                                        ? "bg-blue-50 text-blue-600 hover:bg-blue-50"
                                        : ""
                                    }
                                  >
                                    {item.badge}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <Separator className="my-4 dark:bg-gray-700" />

          {/* Filters Section */}
          {!collapsed && (
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  <Search size={16} />
                </span>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quick Filters
                </h3>
              </div>
              {defaultFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm h-9 px-3"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${filter.color}`}
                  ></span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {/* Sign Out Button */}
          <div className="mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full ${collapsed ? "justify-center px-2" : "justify-start gap-2"} text-sm h-10 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-700 dark:hover:text-red-300 mt-4`}
                  onClick={() => signOut()}
                >
                  <LogOut size={18} />
                  {!collapsed && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>Sign Out</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>
      </ScrollArea>

      {/* Footer with version info */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <p>Feedback Ecosystem v1.0</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
