import React from "react";
import { NavLink } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackNavItemProps {
  collapsed?: boolean;
}

const FeedbackNavItem = ({ collapsed = false }: FeedbackNavItemProps) => {
  return (
    <NavLink
      to="/dashboard/feedback"
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
          isActive
            ? "bg-slate-100 text-teal-600 dark:bg-slate-800 dark:text-teal-400"
            : "text-slate-600 dark:text-slate-400",
          collapsed && "justify-center px-2",
        )
      }
    >
      <MessageSquare className="h-5 w-5" />
      {!collapsed && <span>Feedback</span>}
    </NavLink>
  );
};

export default FeedbackNavItem;
