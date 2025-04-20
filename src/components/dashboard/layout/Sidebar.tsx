import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  FolderKanban,
  Search,
  MessageSquare,
  BarChart2,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
}

const defaultNavItems: NavItem[] = [
  { icon: <Home size={18} />, label: "Home", href: "/" },
  {
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: <Search size={18} />,
    label: "Discovery",
    href: "/dashboard/discovery",
  },
  {
    icon: <MessageSquare size={18} />,
    label: "Feedback",
    href: "/dashboard/feedback",
  },
  {
    icon: <BarChart2 size={18} />,
    label: "Analytics",
    href: "/dashboard/analytics",
  },
  {
    icon: <FolderKanban size={18} />,
    label: "Projects",
    href: "/dashboard/projects",
  },
  {
    icon: <UserCircle size={18} />,
    label: "Profile",
    href: "/dashboard/profile",
  },
];

const defaultBottomItems: NavItem[] = [
  { icon: <Settings size={18} />, label: "Settings" },
  { icon: <HelpCircle size={18} />, label: "Help" },
];

const Sidebar = ({
  items = defaultNavItems,
  activeItem,
  onItemClick = () => {},
}: SidebarProps) => {
  // Get the current path to determine active item
  const path = window.location.pathname;
  const currentPath = path.split("/").pop() || "dashboard";

  // Map path to activeItem
  const getActiveItem = () => {
    if (path === "/dashboard") return "Dashboard";
    if (currentPath === "discovery") return "Discovery";
    if (currentPath === "feedback") return "Feedback";
    if (currentPath === "analytics") return "Analytics";
    if (currentPath === "projects") return "Projects";
    if (currentPath === "profile") return "Profile";
    return activeItem || "Dashboard";
  };

  const currentActiveItem = getActiveItem();
  return (
    <div className="w-[240px] h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">Projects</h2>
        <p className="text-sm text-gray-500">Manage your projects and tasks</p>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {items.map((item) => (
            <Link to={item.href || "#"} key={item.label} className="w-full">
              <Button
                variant={
                  item.label === currentActiveItem ? "secondary" : "ghost"
                }
                className="w-full justify-start gap-2 text-sm h-10"
                onClick={() => onItemClick(item.label)}
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <h3 className="text-xs font-medium px-3 py-2 text-gray-500">
            Filters
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm h-9"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm h-9"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            High Priority
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm h-9"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            In Progress
          </Button>
        </div>
      </ScrollArea>

      <div className="p-3 mt-auto border-t border-gray-200">
        {defaultBottomItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className="w-full justify-start gap-2 text-sm h-10 mb-1"
            onClick={() => onItemClick(item.label)}
          >
            {item.icon}
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
