import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

// Group navigation items into logical sections
const defaultNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { icon: <Home size={18} />, label: "Home", href: "/" },
      {
        icon: <LayoutDashboard size={18} />,
        label: "Dashboard",
        href: "/dashboard",
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        icon: <FolderKanban size={18} />,
        label: "Projects",
        href: "/dashboard/projects",
      },
      {
        icon: <Search size={18} />,
        label: "Discovery",
        href: "/dashboard/discovery",
      },
    ],
  },
  {
    title: "Feedback",
    items: [
      {
        icon: <MessageSquare size={18} />,
        label: "Feedback",
        href: "/dashboard/feedback",
      },
      {
        icon: <BarChart2 size={18} />,
        label: "Feedback Analytics",
        href: "/dashboard/feedback-analytics",
      },
    ],
  },
  {
    title: "User",
    items: [
      {
        icon: <UserCircle size={18} />,
        label: "Profile",
        href: "/dashboard/profile",
      },
    ],
  },
];

const defaultFilters = [
  { color: "bg-green-500", label: "Active" },
  { color: "bg-red-500", label: "High Priority" },
  { color: "bg-yellow-500", label: "In Progress" },
];

const defaultBottomItems: NavItem[] = [
  {
    icon: <Settings size={18} />,
    label: "Settings",
    href: "/dashboard/settings",
  },
  { icon: <HelpCircle size={18} />, label: "Help", href: "/dashboard/help" },
];

const Sidebar = ({ activeItem, onItemClick = () => {} }: SidebarProps) => {
  // State for collapsed sidebar
  const [collapsed, setCollapsed] = useState(false);

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Initialize all sections as expanded
    return defaultNavSections.reduce(
      (acc, section) => {
        acc[section.title] = true;
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

  // Get the current path to determine active item
  const path = window.location.pathname;
  const currentPath = path.split("/").pop() || "dashboard";

  // Map path to activeItem
  const getActiveItem = () => {
    if (path === "/dashboard") return "Dashboard";
    if (currentPath === "discovery") return "Discovery";
    if (currentPath === "feedback") return "Feedback";
    if (currentPath === "feedback-analytics") return "Feedback Analytics";
    if (currentPath === "analytics") return "Analytics";
    if (currentPath === "projects") return "Projects";
    if (currentPath === "profile") return "Profile";
    if (currentPath === "settings") return "Settings";
    if (currentPath === "help") return "Help";
    return activeItem || "Dashboard";
  };

  const currentActiveItem = getActiveItem();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`h-full border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ${collapsed ? "w-[70px]" : "w-[240px]"} shadow-sm z-20`}
    >
      <div
        className={`p-4 flex ${collapsed ? "justify-center" : "justify-between"} items-center`}
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
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <TooltipProvider>
          {defaultNavSections.map((section) => (
            <div key={section.title} className="mb-4">
              {/* Section Header */}
              <div
                className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-1 cursor-pointer`}
                onClick={() => !collapsed && toggleSection(section.title)}
              >
                {!collapsed && (
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                {!collapsed && (
                  <Button variant="ghost" size="icon" className="h-5 w-5">
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
                  {section.items.map((item) => (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Link to={item.href || "#"} className="w-full">
                          <Button
                            variant={
                              item.label === currentActiveItem
                                ? "secondary"
                                : "ghost"
                            }
                            className={`w-full ${collapsed ? "justify-center px-2" : "justify-start gap-2"} text-sm h-10`}
                            onClick={() => onItemClick(item.label)}
                          >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Separator className="my-4" />

          {/* Filters Section */}
          {!collapsed && (
            <div className="space-y-1 mb-4">
              <h3 className="text-xs font-medium px-3 py-2 text-gray-500 uppercase tracking-wider">
                Filters
              </h3>
              {defaultFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="ghost"
                  className="w-full justify-start gap-2 text-sm h-9"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${filter.color}`}
                  ></span>
                  {filter.label}
                </Button>
              ))}
            </div>
          )}

          {/* Bottom Items */}
          <div className={`space-y-1 ${collapsed ? "mt-4" : ""}`}>
            {defaultBottomItems.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link to={item.href || "#"} className="w-full">
                    <Button
                      variant={
                        item.label === currentActiveItem ? "secondary" : "ghost"
                      }
                      className={`w-full ${collapsed ? "justify-center px-2" : "justify-start gap-2"} text-sm h-10`}
                      onClick={() => onItemClick(item.label)}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
