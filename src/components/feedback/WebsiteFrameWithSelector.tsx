import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crosshair, X, RefreshCw, ExternalLink, Shield } from "lucide-react";
import ElementSelector from "./ElementSelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import AdvancedProxySelector from "./AdvancedProxySelector";
import {
  getProxiedUrl,
  getCurrentProxyServiceName,
  setProxyServiceByIndex,
  isLikelyEmbeddable,
} from "./ProxyService";

interface WebsiteFrameWithSelectorProps {
  url: string;
  onElementSelected: (element: {
    selector: string;
    xpath: string;
    elementType: string;
    dimensions: { width: number; height: number; top: number; left: number };
    screenshot?: string;
  }) => void;
}

const WebsiteFrameWithSelector: React.FC<WebsiteFrameWithSelectorProps> = ({
  url,
  onElementSelected,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(Date.now()); // Used to force iframe reload
  const [proxyMode, setProxyMode] = useState(false);
  const [isAccessible, setIsAccessible] = useState(true);
  const [isAdvancedProxyOpen, setIsAdvancedProxyOpen] = useState(false);
  const [currentProxyName, setCurrentProxyName] = useState(
    getCurrentProxyServiceName(),
  );

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    console.log("Website loaded in iframe");

    // Check if we can access the iframe content
    try {
      const iframeDocument =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;
      if (!iframeDocument) {
        throw new Error("Could not access iframe document");
      }

      // Try to access the body to verify we have real access
      try {
        const body = iframeDocument.body;
        if (body) {
          console.log("Successfully accessed iframe body");
          setIsAccessible(true);
        } else {
          throw new Error("Could not access iframe body");
        }
      } catch (bodyError) {
        console.warn("Could not access iframe body:", bodyError);
        setIsAccessible(false);
        setError(
          "Cross-origin restrictions detected. Element selection may not work properly. Try enabling proxy mode.",
        );
        // Auto-enable proxy mode if not already enabled
        if (!proxyMode) {
          console.log(
            "Auto-enabling proxy mode due to cross-origin restrictions",
          );
          toggleProxyMode();
        }
      }
    } catch (error) {
      console.warn("Cross-origin restrictions detected:", error);
      setIsAccessible(false);
      setError(
        "Cross-origin restrictions detected. Element selection may not work properly. Try enabling proxy mode.",
      );
      // Auto-enable proxy mode if not already enabled
      if (!proxyMode) {
        console.log(
          "Auto-enabling proxy mode due to cross-origin restrictions",
        );
        toggleProxyMode();
      }
    }

    // If proxy mode is enabled, force a small delay to ensure everything is loaded
    if (proxyMode) {
      setTimeout(() => {
        console.log("Proxy mode: additional delay completed");
      }, 1000);
    }
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError(
      "Failed to load website. This might be due to cross-origin restrictions.",
    );
    setIsAccessible(false);
    // Auto-enable proxy mode if not already enabled
    if (!proxyMode && isLikelyEmbeddable(url)) {
      console.log("Auto-enabling proxy mode due to load error");
      toggleProxyMode();
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionModeActive(!isSelectionModeActive);
    console.log("Selection mode toggled:", !isSelectionModeActive);
  };

  // Toggle proxy mode
  const toggleProxyMode = () => {
    const newProxyMode = !proxyMode;
    setProxyMode(newProxyMode);
    // Reload iframe with new settings
    setIsLoading(true);
    setError(null);
    setIframeKey(Date.now());

    console.log(
      `Proxy mode ${newProxyMode ? "enabled" : "disabled"}, reloading iframe...`,
    );

    // Reset connection status
    setIsAccessible(true);
    // Update current proxy name
    setCurrentProxyName(getCurrentProxyServiceName());
  };

  // Handle proxy service change
  const handleProxyChange = (proxyIndex: number) => {
    setProxyServiceByIndex(proxyIndex);
    setCurrentProxyName(getCurrentProxyServiceName());
    if (proxyMode) {
      // Reload iframe with new proxy settings
      setIsLoading(true);
      setError(null);
      setIframeKey(Date.now());
    }
  };

  // Handle element selection
  const handleElementSelected = (elementData: any) => {
    onElementSelected(elementData);
    // Optionally disable selection mode after an element is selected
    // setIsSelectionModeActive(false);
  };

  // Reload iframe
  const reloadIframe = () => {
    setIsLoading(true);
    setError(null);
    setIframeKey(Date.now()); // Change key to force complete reload
  };

  // Open in new tab
  const openInNewTab = () => {
    window.open(url, "_blank");
  };

  // Prepare iframe src URL with proxy if needed
  const getIframeSrc = () => {
    if (proxyMode) {
      return getProxiedUrl(url);
    }
    return url;
  };

  // Add message listener for cross-origin communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from the iframe
      if (event.data && event.data.type === "tempo_element_selected") {
        onElementSelected(event.data.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementSelected]);

  // Prepare sandbox attributes based on needs
  const sandboxAttributes = [
    "allow-same-origin", // Needed for DOM access
    "allow-scripts", // Allow scripts to run
    "allow-forms", // Allow form submissions
    "allow-popups", // Allow popups if needed
    "allow-modals", // Allow modal dialogs
    "allow-downloads", // Allow downloads
    "allow-storage-access-by-user-activation", // Allow storage access
  ].join(" ");

  return (
    <div className="relative w-full h-full flex flex-col border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isSelectionModeActive ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="flex items-center space-x-1"
                  aria-pressed={isSelectionModeActive}
                  aria-label={
                    isSelectionModeActive
                      ? "Exit element selection mode"
                      : "Enter element selection mode"
                  }
                >
                  {isSelectionModeActive ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>Exit Selection</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="h-4 w-4" />
                      <span>Select Element</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSelectionModeActive
                  ? "Exit element selection mode"
                  : "Enter element selection mode to provide targeted feedback"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reloadIframe}
                  className="flex items-center space-x-1"
                  aria-label="Reload website"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reload website</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInNewTab}
                  className="flex items-center space-x-1"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open in new tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center space-x-2 ml-4 border-l border-slate-200 dark:border-slate-700 pl-4 flex-wrap">
            <Popover
              open={isAdvancedProxyOpen}
              onOpenChange={setIsAdvancedProxyOpen}
            >
              <PopoverTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="proxy-mode"
                    checked={proxyMode}
                    onCheckedChange={toggleProxyMode}
                    aria-label="Toggle proxy mode"
                  />
                  <Label
                    htmlFor="proxy-mode"
                    className="text-xs cursor-pointer flex items-center"
                  >
                    {proxyMode ? (
                      <>
                        <Shield className="h-3 w-3 mr-1 text-green-500" />
                        <span>Proxy: {currentProxyName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAdvancedProxyOpen(!isAdvancedProxyOpen);
                          }}
                        >
                          <span className="text-xs">⚙️</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3 mr-1 text-slate-500" />
                        <span>Proxy: Off</span>
                      </>
                    )}
                  </Label>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <AdvancedProxySelector
                  onProxyChange={handleProxyChange}
                  targetUrl={url}
                  isProxyEnabled={proxyMode}
                  onProxyToggle={toggleProxyMode}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-md">
          {url}
        </div>
      </div>

      {/* Iframe container */}
      <div className="relative flex-grow">
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
            <div className="max-w-md p-4 bg-white dark:bg-slate-800 rounded-md shadow-md border border-red-200 dark:border-red-900">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                Error Loading Website
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {error}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                This might be due to cross-origin restrictions or the website's
                security settings. Try using a different URL or a website that
                allows embedding.
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={reloadIframe}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
                <Button variant="outline" size="sm" onClick={openInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey} // Force reload when key changes
          ref={iframeRef}
          src={getIframeSrc()}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox={sandboxAttributes}
          allow="camera; microphone; fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Website preview"
          aria-label="Website content for element selection"
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Element selector overlay */}
        <ElementSelector
          isActive={isSelectionModeActive}
          onElementSelected={handleElementSelected}
          iframeRef={iframeRef}
          proxyMode={proxyMode}
        />
      </div>
    </div>
  );
};

export default WebsiteFrameWithSelector;
