import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Move } from "lucide-react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMemoizedCallback } from "@/hooks/useMemoizedCallback";

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
  component: React.ReactNode;
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
  widgets,
  onRemoveWidget,
  onLayoutChange,
  onAddWidget,
  editable = true,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Convert widgets to layout format
  const layouts = {
    lg: widgets.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: widget.minW || 2,
      minH: widget.minH || 2,
      maxW: widget.maxW,
      maxH: widget.maxH,
      static: widget.static,
    })),
    md: widgets.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: Math.min(widget.w, 6),
      h: widget.h,
      minW: widget.minW || 2,
      minH: widget.minH || 2,
      maxW: widget.maxW,
      maxH: widget.maxH,
      static: widget.static,
    })),
    sm: widgets.map((widget) => ({
      i: widget.id,
      x: 0,
      y: widget.y,
      w: 4,
      h: widget.h,
      minW: widget.minW || 2,
      minH: widget.minH || 2,
      maxW: widget.maxW,
      maxH: widget.maxH,
      static: widget.static,
    })),
  };

  // Use memoized callbacks to prevent unnecessary re-renders
  const handleLayoutChange = useMemoizedCallback(
    (layout: any, layouts: any) => {
      if (onLayoutChange && !isDragging) {
        onLayoutChange(layouts);
      }
    },
    [onLayoutChange, isDragging],
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemoveWidget = useCallback(
    (id: string) => {
      if (onRemoveWidget) {
        onRemoveWidget(id);
      }
    },
    [onRemoveWidget],
  );

  return (
    <div className={`w-full ${className || ""}`}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 }}
        rowHeight={60}
        margin={[16, 16]}
        isDraggable={editable}
        isResizable={editable}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        useCSSTransforms
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="bg-white">
            <Card className="h-full overflow-hidden border shadow-sm">
              <div className="flex items-center justify-between border-b p-3">
                <h3 className="text-sm font-medium">{widget.title}</h3>
                <div className="flex items-center gap-1">
                  {editable && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 cursor-move"
                      >
                        <Move className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveWidget(widget.id)}
                      >
                        <X className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4">{widget.component}</div>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>

      {editable && onAddWidget && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddWidget}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardWidgetGrid;
