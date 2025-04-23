import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Plus,
  Search,
  FolderKanban,
  MessageSquare,
  BarChart2,
  Settings,
  UserCircle,
  Home,
  Clock,
  Keyboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface QuickActionsProps {
  recentProjects?: Array<{ id: string; title: string }>;
  recentFeedback?: Array<{ id: string; title: string }>;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  recentProjects = [],
  recentFeedback = [],
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [frequentActions, setFrequentActions] = useState<QuickAction[]>([]);

  // Load frequent actions from localStorage
  useEffect(() => {
    const storedFrequent = localStorage.getItem("frequentActions");
    if (storedFrequent) {
      try {
        const parsedFrequent = JSON.parse(storedFrequent);
        // We only store IDs, so we need to map them back to actions
        const frequent = parsedFrequent
          .map((id: string) => allActions.find((action) => action.id === id))
          .filter(Boolean)
          .slice(0, 5);
        setFrequentActions(frequent);
      } catch (error) {
        console.error("Error parsing frequent actions:", error);
      }
    }
  }, []);

  // Track action usage
  const trackActionUsage = (actionId: string) => {
    try {
      // Get existing usage data
      const usageData = JSON.parse(localStorage.getItem("actionUsage") || "{}");

      // Update usage count
      usageData[actionId] = (usageData[actionId] || 0) + 1;

      // Store updated usage data
      localStorage.setItem("actionUsage", JSON.stringify(usageData));

      // Update frequent actions based on usage
      const sortedActions = Object.entries(usageData)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, 5);

      localStorage.setItem("frequentActions", JSON.stringify(sortedActions));

      // Update frequent actions state
      const updatedFrequent = sortedActions
        .map((id) => allActions.find((action) => action.id === id))
        .filter(Boolean);
      setFrequentActions(updatedFrequent);
    } catch (error) {
      console.error("Error tracking action usage:", error);
    }
  };

  // Execute an action and close the dialog
  const runAction = (action: QuickAction) => {
    action.action();
    trackActionUsage(action.id);
    setOpen(false);
  };

  // Define all available actions
  const allActions: QuickAction[] = [
    {
      id: "new-project",
      name: "Create New Project",
      shortcut: "P",
      icon: <Plus className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/projects/new"),
      keywords: ["add", "project", "create", "new"],
    },
    {
      id: "new-feedback",
      name: "Give Feedback",
      shortcut: "F",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/feedback/new"),
      keywords: ["add", "feedback", "create", "new", "comment"],
    },
    {
      id: "dashboard",
      name: "Go to Dashboard",
      shortcut: "D",
      icon: <Home className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard"),
      keywords: ["home", "main", "dashboard"],
    },
    {
      id: "projects",
      name: "View All Projects",
      shortcut: "A P",
      icon: <FolderKanban className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/projects"),
      keywords: ["projects", "list", "all"],
    },
    {
      id: "feedback",
      name: "View All Feedback",
      shortcut: "A F",
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/feedback"),
      keywords: ["feedback", "list", "all", "comments"],
    },
    {
      id: "analytics",
      name: "View Analytics",
      shortcut: "A",
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/feedback-analytics"),
      keywords: ["stats", "charts", "analytics", "metrics"],
    },
    {
      id: "profile",
      name: "View Profile",
      shortcut: "U",
      icon: <UserCircle className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/profile"),
      keywords: ["user", "account", "profile", "me"],
    },
    {
      id: "settings",
      name: "Open Settings",
      shortcut: "S",
      icon: <Settings className="mr-2 h-4 w-4" />,
      action: () => navigate("/dashboard/settings"),
      keywords: ["preferences", "options", "settings", "configure"],
    },
  ];

  // Generate actions for recent projects
  const recentProjectActions: QuickAction[] = recentProjects.map((project) => ({
    id: `project-${project.id}`,
    name: project.title,
    icon: <FolderKanban className="mr-2 h-4 w-4" />,
    action: () => navigate(`/dashboard/projects/${project.id}`),
    keywords: ["recent", "project", project.title],
  }));

  // Generate actions for recent feedback
  const recentFeedbackActions: QuickAction[] = recentFeedback.map(
    (feedback) => ({
      id: `feedback-${feedback.id}`,
      name: feedback.title,
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      action: () => navigate(`/dashboard/feedback/${feedback.id}`),
      keywords: ["recent", "feedback", feedback.title],
    }),
  );

  // Set up keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search actions...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {frequentActions.length > 0 && (
            <CommandGroup heading="Frequent Actions">
              {frequentActions.map((action) => (
                <CommandItem key={action.id} onSelect={() => runAction(action)}>
                  {action.icon}
                  <span>{action.name}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Create New">
            <CommandItem
              onSelect={() =>
                runAction(allActions.find((a) => a.id === "new-project")!)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>New Project</span>
              <kbd className="ml-auto flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                P
              </kbd>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runAction(allActions.find((a) => a.id === "new-feedback")!)
              }
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Give Feedback</span>
              <kbd className="ml-auto flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                F
              </kbd>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Navigation">
            {allActions
              .filter(
                (action) =>
                  !["new-project", "new-feedback"].includes(action.id),
              )
              .map((action) => (
                <CommandItem key={action.id} onSelect={() => runAction(action)}>
                  {action.icon}
                  <span>{action.name}</span>
                  {action.shortcut && (
                    <kbd className="ml-auto flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                      {action.shortcut}
                    </kbd>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>

          {recentProjectActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Projects">
                {recentProjectActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => runAction(action)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{action.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {recentFeedbackActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Feedback">
                {recentFeedbackActions.map((action) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => runAction(action)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{action.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default QuickActions;
