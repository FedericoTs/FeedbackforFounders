import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Crosshair, X } from "lucide-react";

interface VisualSelectionOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  onSelectionComplete: (selection: {
    type: "area" | "point";
    position: { x: number; y: number; width?: number; height?: number };
  }) => void;
  onCancel: () => void;
}

const VisualSelectionOverlay: React.FC<VisualSelectionOverlayProps> = ({
  containerRef,
  onSelectionComplete,
  onCancel,
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState<"area" | "point">("area");
  const [instructions, setInstructions] = useState(
    "Click and drag to select an area, or click once for a point selection",
  );
  const overlayRef = useRef<HTMLDivElement>(null);

  // Set up the overlay when the component mounts
  useEffect(() => {
    if (!containerRef.current || !overlayRef.current) return;

    // Position the overlay to cover the container
    const containerRect = containerRef.current.getBoundingClientRect();
    const overlay = overlayRef.current;

    overlay.style.position = "absolute";
    overlay.style.top = `${containerRect.top}px`;
    overlay.style.left = `${containerRect.left}px`;
    overlay.style.width = `${containerRect.width}px`;
    overlay.style.height = `${containerRect.height}px`;
    overlay.style.zIndex = "1000";

    // Start in selection mode
    setIsSelecting(true);

    // Clean up
    return () => {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    };
  }, [containerRef]);

  // Handle mouse down event to start selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;

    // Get container position
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate position relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionStart({ x, y });
    setSelectionEnd({ x, y }); // Initialize end to same as start

    // Update instructions
    setInstructions(
      "Drag to define selection area, or release for point selection",
    );
  };

  // Handle mouse move event to update selection
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !containerRef.current) return;

    // Get container position
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate position relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSelectionEnd({ x, y });
    setSelectionMode("area"); // If dragging, we're in area selection mode
  };

  // Handle mouse up event to complete selection
  const handleMouseUp = () => {
    if (
      !isSelecting ||
      !selectionStart ||
      !selectionEnd ||
      !containerRef.current
    )
      return;

    // Calculate selection dimensions
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    // Determine if this is a point or area selection
    // If the selection is very small, treat it as a point
    if (width < 5 && height < 5) {
      onSelectionComplete({
        type: "point",
        position: { x: selectionStart.x, y: selectionStart.y },
      });
    } else {
      onSelectionComplete({
        type: "area",
        position: { x, y, width, height },
      });
    }

    // Reset selection state
    setIsSelecting(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setIsSelecting(false);
    onCancel();
  };

  // Toggle between area and point selection modes
  const toggleSelectionMode = () => {
    setSelectionMode(selectionMode === "area" ? "point" : "area");
    setInstructions(
      selectionMode === "area"
        ? "Click to select a specific point"
        : "Click and drag to select an area",
    );
  };

  // Calculate selection box style
  const getSelectionBoxStyle = () => {
    if (!selectionStart || !selectionEnd) return { display: "none" };

    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    return {
      position: "absolute" as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: "2px dashed rgba(59, 130, 246, 0.8)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      pointerEvents: "none" as const,
    };
  };

  return (
    <div
      ref={overlayRef}
      className="bg-black bg-opacity-20 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Selection box */}
      <div style={getSelectionBoxStyle()} />

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 bg-white dark:bg-slate-800 p-2 rounded-md shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant={selectionMode === "area" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectionMode("area")}
            className="h-8"
          >
            <Crosshair className="h-3.5 w-3.5 mr-1" />
            Area
          </Button>
          <Button
            variant={selectionMode === "point" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectionMode("point")}
            className="h-8"
          >
            <Crosshair className="h-3.5 w-3.5 mr-1" />
            Point
          </Button>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mx-2 flex-grow text-center">
          {instructions}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="h-8"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
      </div>

      {/* Coordinates display */}
      {selectionStart && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-2 rounded-md shadow-md text-xs">
          {selectionMode === "area" && selectionEnd ? (
            <>
              <div>
                Start: ({selectionStart.x.toFixed(0)},{" "}
                {selectionStart.y.toFixed(0)})
              </div>
              <div>
                End: ({selectionEnd.x.toFixed(0)}, {selectionEnd.y.toFixed(0)})
              </div>
              <div>
                Size: {Math.abs(selectionEnd.x - selectionStart.x).toFixed(0)} x{" "}
                {Math.abs(selectionEnd.y - selectionStart.y).toFixed(0)}
              </div>
            </>
          ) : (
            <div>
              Position: ({selectionStart.x.toFixed(0)},{" "}
              {selectionStart.y.toFixed(0)})
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualSelectionOverlay;
