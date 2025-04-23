import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  X,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface BaseWidgetProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  isCollapsible?: boolean;
  isResizable?: boolean;
  isRemovable?: boolean;
  isRefreshable?: boolean;
  isConfigurable?: boolean;
  onRemove?: () => void;
  onRefresh?: () => void;
  onConfigure?: () => void;
  children: React.ReactNode;
}

const BaseWidget = ({
  title,
  icon,
  className,
  isLoading = false,
  isCollapsible = true,
  isResizable = false,
  isRemovable = false,
  isRefreshable = false,
  isConfigurable = false,
  onRemove,
  onRefresh,
  onConfigure,
  children,
}: BaseWidgetProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      // Simulate refresh delay
      setTimeout(() => {
        onRefresh();
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <Card
      className={cn(
        "border border-gray-200 shadow-sm bg-white dark:bg-slate-800 h-full",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          {(isRefreshable || isConfigurable) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Widget Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isRefreshable && (
                  <DropdownMenuItem onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                )}
                {isConfigurable && (
                  <DropdownMenuItem onClick={onConfigure}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isCollapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
          {isRemovable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {isLoading || isRefreshing ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BaseWidget;
