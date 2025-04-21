import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crosshair, X, Camera, AlertCircle } from "lucide-react";

interface DirectSelectionFrameProps {
  url: string;
  onElementSelected: (element: any) => void;
  className?: string;
  height?: string | number;
}

const DirectSelectionFrame: React.FC<DirectSelectionFrameProps> = ({
  url,
  onElementSelected,
  className = "",
  height = "600px",
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [isAccessible, setIsAccessible] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);

    // Check if we can access the iframe content
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDocument) {
        throw new Error("Could not access iframe document");
      }

      // Try to access the body to verify we have real access
      const body = iframeDocument.body;
      if (!body) {
        throw new Error("Could not access iframe body");
      }

      console.log("Successfully accessed iframe content");
      setIsAccessible(true);

      // Set up event listeners for element selection
      setupSelectionListeners(iframeDocument);
    } catch (error) {
      console.warn("Cross-origin restrictions detected:", error);
      setIsAccessible(false);
      setError(
        "Cross-origin restrictions detected. Element selection may not work properly. Try using the screenshot mode instead.",
      );
    }
  };

  // Set up event listeners for element selection
  const setupSelectionListeners = (document: Document) => {
    // Function to handle element selection
    const handleElementClick = (e: MouseEvent) => {
      if (!isSelectionMode) return;

      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (!target) return;

      // Get element details
      const rect = target.getBoundingClientRect();
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeRect = iframe.getBoundingClientRect();

      // Create element data
      const elementData = {
        selector: generateSelector(target),
        xpath: generateXPath(target),
        elementType: target.tagName.toLowerCase(),
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top + iframeRect.top,
          left: rect.left + iframeRect.left,
        },
        text: target.textContent?.trim().substring(0, 100) || "",
        pageContext: {
          url: url,
          timestamp: new Date().toISOString(),
          viewportSize: {
            width: iframe.clientWidth,
            height: iframe.clientHeight,
          },
          userAgent: navigator.userAgent,
        },
      };

      setSelectedElement(elementData);
      onElementSelected(elementData);

      // Exit selection mode
      setIsSelectionMode(false);
    };

    // Add event listener
    document.addEventListener("click", handleElementClick, true);

    // Return cleanup function
    return () => {
      document.removeEventListener("click", handleElementClick, true);
    };
  };

  // Generate a CSS selector for an element
  const generateSelector = (element: HTMLElement): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    let selector = element.tagName.toLowerCase();

    if (element.className) {
      const classes = element.className.split(" ").filter((c) => c);
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }

    return selector;
  };

  // Generate an XPath for an element
  const generateXPath = (element: HTMLElement): string => {
    try {
      let xpath = "";
      let current = element;

      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = current.previousElementSibling;

        while (sibling) {
          if (sibling.nodeName === current.nodeName) {
            index++;
          }
          sibling = sibling.previousElementSibling;
        }

        const tagName = current.nodeName.toLowerCase();
        xpath = `/${tagName}[${index}]${xpath}`;
        current = current.parentElement as HTMLElement;
      }

      return `/html[1]/body[1]${xpath}`;
    } catch (error) {
      console.error("Error generating XPath:", error);
      return "/html/body";
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (!isAccessible) {
      setError(
        "Cannot enable selection mode due to cross-origin restrictions. Try screenshot mode instead.",
      );
      return;
    }

    setIsSelectionMode(!isSelectionMode);
    setIsScreenshotMode(false);
  };

  // Toggle screenshot mode
  const toggleScreenshotMode = () => {
    setIsScreenshotMode(!isScreenshotMode);
    setIsSelectionMode(false);

    if (!isScreenshotMode) {
      // Take screenshot on next tick
      setTimeout(captureScreenshot, 100);
    }
  };

  // Capture screenshot of the iframe
  const captureScreenshot = () => {
    try {
      const iframe = iframeRef.current;
      const canvas = canvasRef.current;

      if (!iframe || !canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      // Set canvas dimensions to match iframe
      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Draw iframe to canvas
      context.drawImage(iframe, 0, 0, rect.width, rect.height);

      // Get screenshot as data URL
      const screenshot = canvas.toDataURL("image/png");

      // Create element data for the screenshot
      const elementData = {
        selector: "screenshot",
        xpath: "/html/body",
        elementType: "screenshot",
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
        },
        screenshot: screenshot,
        pageContext: {
          url: url,
          timestamp: new Date().toISOString(),
          viewportSize: {
            width: rect.width,
            height: rect.height,
          },
          userAgent: navigator.userAgent,
        },
      };

      setSelectedElement(elementData);
      onElementSelected(elementData);

      // Exit screenshot mode
      setIsScreenshotMode(false);
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      setError(
        "Failed to capture screenshot. This might be due to cross-origin restrictions.",
      );
    }
  };

  return (
    <div
      className={`flex flex-col border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <Button
            variant={isSelectionMode ? "destructive" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            disabled={isLoading || !isAccessible}
            className="flex items-center space-x-1"
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Exit Selection
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 mr-1" />
                Select Element
              </>
            )}
          </Button>

          <Button
            variant={isScreenshotMode ? "destructive" : "outline"}
            size="sm"
            onClick={toggleScreenshotMode}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            {isScreenshotMode ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-1" />
                Screenshot
              </>
            )}
          </Button>

          {isAccessible === false && (
            <span className="text-xs text-amber-500 flex items-center ml-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Cross-origin restricted
            </span>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
          {url}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin"></div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Loading website...
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md shadow-md z-50 text-sm text-red-800 dark:text-red-200">
            <div className="font-medium mb-1 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Error:
            </div>
            <div>{error}</div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts"
          title="Website content"
        />

        {/* Hidden canvas for screenshots */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* Selection mode indicator */}
        {isSelectionMode && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2">
            <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
            <span className="text-sm font-medium">Selection Mode Active</span>
          </div>
        )}

        {/* Screenshot mode indicator */}
        {isScreenshotMode && (
          <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2">
            <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
            <span className="text-sm font-medium">Taking Screenshot...</span>
          </div>
        )}

        {/* Selected element info */}
        {selectedElement && !isSelectionMode && !isScreenshotMode && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-md shadow-md z-50 max-w-xs">
            <div className="text-xs font-medium mb-1">
              Selected: {selectedElement.elementType}
            </div>
            {selectedElement.text && (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {selectedElement.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectSelectionFrame;
