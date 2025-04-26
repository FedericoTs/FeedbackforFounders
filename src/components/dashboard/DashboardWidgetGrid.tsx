import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMemoizedCallback } from "@/hooks/useMemoizedCallback";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "@/supabase/auth";

// Import widget components
import {
  StatsWidget,
  ProjectsWidget,
  ActivityWidget,
  RewardsWidget,
  NotificationsWidget,
  AchievementsWidget,
  BaseWidget,
} from "./widgets";

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface Widget {
  id: string;
  type: string;
  title: string;
  w: number;
  h: number;
  x: number;
  y: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  component?: React.ReactNode;
}

interface DashboardWidgetGridProps {
  widgets: Widget[];
  onRemoveWidget?: (id: string) => void;
  onLayoutChange?: (layout: any) => void;
  onAddWidget?: () => void;
  editable?: boolean;
  className?: string;
}

const DashboardWidgetGrid: React.FC<DashboardWidgetGridProps> = ({
  widgets = [],
  onRemoveWidget,
  onLayoutChange,
  onAddWidget,
  editable = true,
  className = "",
}) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [currentWidgets, setCurrentWidgets] = useState<Widget[]>(widgets);
  const [isEditing, setIsEditing] = useState(false);

  // Convert widgets to layout format
  const getLayoutFromWidgets = useCallback(() => {
    return currentWidgets.map((widget) => ({
      i: widget.id,
      x: widget.x || 0,
      y: widget.y || 0,
      w: widget.w || 1,
      h: widget.h || 1,
      minW: widget.minW || 1,
      minH: widget.minH || 1,
      maxW: widget.maxW,
      maxH: widget.maxH,
      static: widget.static,
    }));
  }, [currentWidgets]);

  // Handle layout change
  const handleLayoutChange = useMemoizedCallback(
    (currentLayout: any) => {
      if (isDragging) return;

      // Update widget positions based on layout
      const updatedWidgets = currentWidgets.map((widget) => {
        const layoutItem = currentLayout.find(
          (item: any) => item.i === widget.id,
        );
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
        return widget;
      });

      setCurrentWidgets(updatedWidgets);

      // Call parent onLayoutChange if provided
      if (onLayoutChange) {
        onLayoutChange(currentLayout);
      }

      // Save layout to database if user is authenticated
      if (user) {
        saveDashboardPreferences(updatedWidgets);
      }
    },
    [currentWidgets, onLayoutChange, user, isDragging],
  );

  // Save dashboard preferences to database
  const saveDashboardPreferences = async (updatedWidgets: Widget[]) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("dashboard_preferences").upsert(
        {
          user_id: user.id,
          widgets: updatedWidgets,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("Error saving dashboard preferences:", error);
      }
    } catch (err) {
      console.error("Error in saveDashboardPreferences:", err);
    }
  };

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Remove a widget
  const handleRemoveWidget = useCallback(
    (id: string) => {
      const updatedWidgets = currentWidgets.filter(
        (widget) => widget.id !== id,
      );
      setCurrentWidgets(updatedWidgets);

      if (onRemoveWidget) {
        onRemoveWidget(id);
      }

      if (user) {
        saveDashboardPreferences(updatedWidgets);
      }
    },
    [currentWidgets, onRemoveWidget, user],
  );

  // Render the appropriate widget based on type
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "stats":
        return <StatsWidget title={widget.title} />;
      case "projects":
        return <ProjectsWidget title={widget.title} />;
      case "activity":
        return <ActivityWidget title={widget.title} />;
      case "rewards":
        return <RewardsWidget title={widget.title} />;
      case "notifications":
        return <NotificationsWidget title={widget.title} />;
      case "achievements":
        return <AchievementsWidget />;
      default:
        return (
          <BaseWidget title={widget.title || "Widget"}>
            <div className="p-4 text-center text-slate-500">
              Unknown widget type: {widget.type}
            </div>
          </BaseWidget>
        );
    }
  };

  // If no widgets, show empty state
  if (currentWidgets.length === 0) {
    return (
      <div
        className={`${className} p-8 text-center border rounded-lg bg-slate-50`}
      >
        <h3 className="text-lg font-medium text-slate-700 mb-2">
          No widgets added yet
        </h3>
        <p className="text-slate-500 mb-4">
          Add widgets to customize your dashboard experience
        </p>
        <Button variant="outline" onClick={onAddWidget}>
          <Plus className="mr-2 h-4 w-4" /> Add Widget
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Done" : "Edit Layout"}
        </Button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: getLayoutFromWidgets() }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={150}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={(layout) => handleLayoutChange(layout)}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        margin={[16, 16]}
      >
        {currentWidgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            <Card className="h-full overflow-hidden">
              <div className="p-3 flex flex-row items-center justify-between bg-slate-50 border-b">
                <div className="text-sm font-medium flex items-center">
                  {isEditing && (
                    <GripVertical className="h-4 w-4 mr-2 text-slate-400 cursor-move" />
                  )}
                  {widget.title}
                </div>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleRemoveWidget(widget.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="p-0 overflow-auto h-[calc(100%-40px)]">
                {renderWidget(widget)}
              </div>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardWidgetGrid;
