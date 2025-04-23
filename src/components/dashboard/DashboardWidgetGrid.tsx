import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  StatsWidget,
  ProjectsWidget,
  ActivityWidget,
  RewardsWidget,
} from "./widgets";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings } from "lucide-react";
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../supabase/auth";

// Enable responsive features
const ResponsiveGridLayout = WidthProvider(Responsive);

export interface WidgetConfig {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  props?: Record<string, any>;
}

interface DashboardWidgetGridProps {
  initialWidgets?: WidgetConfig[];
  className?: string;
  editable?: boolean;
}

const defaultWidgets: WidgetConfig[] = [
  { id: "stats", type: "stats", x: 0, y: 0, w: 2, h: 1, minW: 1, minH: 1 },
  {
    id: "projects",
    type: "projects",
    x: 0,
    y: 1,
    w: 2,
    h: 2,
    minW: 1,
    minH: 2,
  },
  {
    id: "activity",
    type: "activity",
    x: 2,
    y: 0,
    w: 1,
    h: 2,
    minW: 1,
    minH: 1,
  },
  { id: "rewards", type: "rewards", x: 2, y: 2, w: 1, h: 1, minW: 1, minH: 1 },
];

const widgetTypes = [
  { id: "stats", label: "Statistics Overview" },
  { id: "projects", label: "Recent Projects" },
  { id: "activity", label: "Activity Feed" },
  { id: "rewards", label: "Rewards & Achievements" },
];

const DashboardWidgetGrid = ({
  initialWidgets = defaultWidgets,
  className = "",
  editable = true,
}: DashboardWidgetGridProps) => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [isEditing, setIsEditing] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState(widgetTypes);

  // Load user dashboard preferences
  useEffect(() => {
    if (user) {
      loadUserDashboard();
    }
  }, [user]);

  const loadUserDashboard = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_dashboard_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading dashboard preferences:", error);
        return;
      }

      if (data && data.widgets) {
        setWidgets(data.widgets);
        updateAvailableWidgets(data.widgets);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  // Save user dashboard preferences
  const saveUserDashboard = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_dashboard_preferences")
        .upsert({
          user_id: user.id,
          widgets: widgets,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error saving dashboard preferences:", error);
      }
    } catch (error) {
      console.error("Error saving dashboard:", error);
    }
  };

  const updateAvailableWidgets = (currentWidgets: WidgetConfig[]) => {
    const usedWidgetTypes = currentWidgets.map((w) => w.type);
    setAvailableWidgets(
      widgetTypes.filter((type) => !usedWidgetTypes.includes(type.id)),
    );
  };

  const handleLayoutChange = (layout: any) => {
    if (!isEditing) return;

    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = layout.find((item: any) => item.i === widget.id);
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

    setWidgets(updatedWidgets);
  };

  const removeWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter((widget) => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    updateAvailableWidgets(updatedWidgets);
    saveUserDashboard();
  };

  const addWidget = (widgetType: string) => {
    const newWidget: WidgetConfig = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      x: 0,
      y: Infinity, // Place at the bottom
      w: 1,
      h: 1,
      minW: 1,
      minH: 1,
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    updateAvailableWidgets(updatedWidgets);
    saveUserDashboard();
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save layout when exiting edit mode
      saveUserDashboard();
    }
  };

  const renderWidget = (widget: WidgetConfig) => {
    const { id, type, props = {} } = widget;

    switch (type) {
      case "stats":
        return (
          <StatsWidget
            key={id}
            {...props}
            isRemovable={isEditing}
            onRemove={() => removeWidget(id)}
          />
        );
      case "projects":
        return (
          <ProjectsWidget
            key={id}
            {...props}
            isRemovable={isEditing}
            onRemove={() => removeWidget(id)}
          />
        );
      case "activity":
        return (
          <ActivityWidget
            key={id}
            {...props}
            isRemovable={isEditing}
            onRemove={() => removeWidget(id)}
          />
        );
      case "rewards":
        return (
          <RewardsWidget
            key={id}
            {...props}
            isRemovable={isEditing}
            onRemove={() => removeWidget(id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${className}`}>
      {editable && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              {isEditing ? "Save Layout" : "Edit Layout"}
            </Button>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              {availableWidgets.map((widget) => (
                <Button
                  key={widget.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addWidget(widget.id)}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  {widget.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: widgets.map((widget) => ({
            i: widget.id,
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h,
            minW: widget.minW || 1,
            minH: widget.minH || 1,
          })),
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 3, md: 2, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={250}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>{renderWidget(widget)}</div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default DashboardWidgetGrid;
