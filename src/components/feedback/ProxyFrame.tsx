import React, { useRef, useState, useEffect } from "react";
import {
  ProxyService,
  createProxyService,
  PROXY_SERVICES,
} from "./ProxyService";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProxyFrameProps {
  url: string;
  onElementSelected: (element: any) => void;
  className?: string;
  height?: string | number;
}

const ProxyFrame: React.FC<ProxyFrameProps> = ({
  url,
  onElementSelected,
  className = "",
  height = "600px",
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proxyService, setProxyService] = useState<ProxyService | null>(null);
  const [proxyContent, setProxyContent] = useState<string | null>(null);
  const [selectedProxyIndex, setSelectedProxyIndex] = useState(0);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [proxyStatus, setProxyStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // Initialize proxy service
  useEffect(() => {
    const initProxy = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setProxyStatus("loading");

        // Create a new proxy service
        const proxy = createProxyService({
          targetUrl: url,
          corsProxyUrl: PROXY_SERVICES[selectedProxyIndex].url,
          injectSelectionScript: true,
          rewriteUrls: true,
          enableWebSocket: false,
        });

        setProxyService(proxy);

        // Fetch content through the proxy
        const content = await proxy.fetchContent();
        setProxyContent(content);
        setProxyStatus("success");
      } catch (error) {
        console.error("Error initializing proxy:", error);
        setError(
          `Failed to load content through proxy: ${error instanceof Error ? error.message : String(error)}`,
        );
        setProxyStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    initProxy();

    // Clean up
    return () => {
      if (proxyService) {
        proxyService.close();
      }
    };
  }, [url, selectedProxyIndex]);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security in a real implementation
      // if (event.origin !== expectedOrigin) return;

      if (event.data.type === "tempo_selection_ready") {
        console.log("Selection script is ready in iframe");
      } else if (event.data.type === "tempo_element_selected") {
        console.log("Element selected:", event.data.data);
        setSelectedElement(event.data.data);
        onElementSelected({
          selector: event.data.data.selector,
          xpath: "", // We don't have XPath in this implementation
          elementType: event.data.data.tagName.toLowerCase(),
          dimensions: event.data.data.rect,
          styles: event.data.data.styles,
          text: event.data.data.text,
          // Add additional context
          pageContext: {
            url: url,
            timestamp: new Date().toISOString(),
            viewportSize: {
              width: iframeRef.current?.clientWidth || 0,
              height: iframeRef.current?.clientHeight || 0,
            },
            userAgent: navigator.userAgent,
          },
        });

        // Automatically exit selection mode after selecting
        setIsSelectionMode(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onElementSelected, url]);

  // Toggle selection mode
  const toggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    setIsSelectionMode(newMode);

    // Send message to iframe to activate/deactivate selection mode
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "tempo_activate_selection",
          active: newMode,
        },
        "*",
      );
    }
  };

  // Try a different proxy
  const tryDifferentProxy = () => {
    const nextIndex = (selectedProxyIndex + 1) % PROXY_SERVICES.length;
    setSelectedProxyIndex(nextIndex);
  };

  // Render the iframe with the proxied content
  const renderIframe = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading content through proxy...
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Using {PROXY_SERVICES[selectedProxyIndex].name}
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading content</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={tryDifferentProxy}
                    className="flex items-center space-x-1"
                  >
                    Try different proxy
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    if (proxyContent) {
      return (
        <iframe
          ref={iframeRef}
          srcDoc={proxyContent}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts"
          title="Proxied content"
        />
      );
    }

    return null;
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
            disabled={isLoading || !!error}
            className="flex items-center space-x-1"
          >
            {isSelectionMode ? "Exit Selection Mode" : "Select Element"}
          </Button>

          <div className="flex items-center space-x-1 ml-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Proxy:
            </span>
            <span className="text-xs font-medium flex items-center">
              {proxyStatus === "loading" && (
                <Loader2 className="h-3 w-3 animate-spin mr-1 text-blue-500" />
              )}
              {proxyStatus === "success" && (
                <Check className="h-3 w-3 mr-1 text-green-500" />
              )}
              {proxyStatus === "error" && (
                <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
              )}
              {PROXY_SERVICES[selectedProxyIndex].name}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
          {url}
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow relative">
        {renderIframe()}

        {/* Selection mode indicator */}
        {isSelectionMode && !isLoading && !error && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2">
            <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
            <span className="text-sm font-medium">Selection Mode Active</span>
          </div>
        )}

        {/* Selected element info */}
        {selectedElement && !isSelectionMode && !isLoading && !error && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 p-3 rounded-md shadow-md z-50 max-w-xs">
            <div className="text-xs font-medium mb-1">
              Selected: {selectedElement.tagName.toLowerCase()}
              {selectedElement.selector.startsWith("#")
                ? selectedElement.selector
                : ""}
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

export default ProxyFrame;
