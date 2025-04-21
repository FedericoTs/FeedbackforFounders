import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, ExternalLink, Shield } from "lucide-react";
import {
  getProxiedUrl,
  rotateProxyService,
  getCurrentProxyServiceName,
  isLikelyEmbeddable,
  getSuggestedUrls,
} from "./ProxyService";

interface WebsiteFrameProps {
  url: string;
  isLoading: boolean;
  onLoad: () => void;
  onError: (error: string) => void;
  proxyMode?: boolean;
}

const WebsiteFrame: React.FC<WebsiteFrameProps> = ({
  url,
  isLoading,
  onLoad,
  onError,
  proxyMode = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [iframeAccessible, setIframeAccessible] = useState<boolean | null>(
    null,
  );
  const [effectiveUrl, setEffectiveUrl] = useState<string>(url);
  const [suggestedUrls] = useState<string[]>(getSuggestedUrls());

  // Determine the effective URL based on proxy mode
  const getIframeSrc = useCallback(
    (sourceUrl: string, useProxy: boolean): string => {
      if (!sourceUrl) return "about:blank";

      try {
        // Validate URL
        new URL(sourceUrl);

        // Apply proxy if enabled
        return useProxy ? getProxiedUrl(sourceUrl) : sourceUrl;
      } catch (error) {
        console.error("Invalid URL:", sourceUrl, error);
        return "about:blank";
      }
    },
    [],
  );

  // Check if iframe is accessible
  const checkIframeAccess = useCallback(() => {
    if (!iframeRef.current) return false;

    try {
      // Try to access the iframe document
      const doc =
        iframeRef.current.contentDocument ||
        (iframeRef.current.contentWindow &&
          iframeRef.current.contentWindow.document);

      // If we can access the document body, it's accessible
      if (doc && doc.body) {
        setIframeAccessible(true);
        return true;
      }
    } catch (error) {
      console.warn("Cross-origin restrictions detected:", error);
      setIframeAccessible(false);
    }

    setIframeAccessible(false);
    return false;
  }, []);

  // Update effective URL when url or proxyMode changes
  useEffect(() => {
    setError(null);
    setIframeAccessible(null);
    const newEffectiveUrl = getIframeSrc(url, proxyMode);
    setEffectiveUrl(newEffectiveUrl);

    // Check if the URL is likely to be embeddable
    if (!proxyMode && !isLikelyEmbeddable(url)) {
      setError(
        `This website (${url}) may block iframe embedding. Try enabling proxy mode.`,
      );
    }
  }, [url, proxyMode, getIframeSrc]);

  // Check iframe accessibility after loading
  useEffect(() => {
    if (!isLoading && iframeRef.current) {
      // Add a small delay to ensure the iframe has fully loaded
      const timer = setTimeout(() => {
        const isAccessible = checkIframeAccess();

        if (!isAccessible && !error) {
          const errorMessage = proxyMode
            ? `Cross-origin restrictions detected even with proxy (${getCurrentProxyServiceName()}). Try a different proxy or website.`
            : "Cross-origin restrictions detected. Element selection may not work properly. Try enabling proxy mode.";

          setError(errorMessage);
          onError(errorMessage);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, error, proxyMode, checkIframeAccess, onError]);

  const handleLoad = () => {
    // Clear any previous errors
    setError(null);

    // Check if we can access the iframe content
    const isAccessible = checkIframeAccess();

    if (isAccessible) {
      console.log("Iframe loaded and accessible");
      onLoad();
    } else {
      console.warn(
        "Iframe loaded but not accessible due to cross-origin restrictions",
      );
      // We'll let the useEffect handle the error message
    }
  };

  const handleError = () => {
    const errorMessage = proxyMode
      ? `Failed to load the website using proxy (${getCurrentProxyServiceName()}). Try a different proxy or website.`
      : "Failed to load the website. It may be blocking iframe embedding.";

    setError(errorMessage);
    onError(errorMessage);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    setIframeAccessible(null);

    // Reload the iframe with the current settings
    if (iframeRef.current) {
      const refreshUrl = getIframeSrc(url, proxyMode);
      setEffectiveUrl(refreshUrl);
      iframeRef.current.src = refreshUrl;
    }

    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleRotateProxy = () => {
    if (!proxyMode) return;

    setIsRefreshing(true);
    setError(null);
    setIframeAccessible(null);

    // Rotate to the next proxy service
    rotateProxyService();

    // Update the iframe src with the new proxy
    const newProxyUrl = getIframeSrc(url, true);
    setEffectiveUrl(newProxyUrl);

    if (iframeRef.current) {
      iframeRef.current.src = newProxyUrl;
    }

    // Reset refreshing state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 z-10">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-200 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">
              Loading website...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
          <Alert variant="destructive" className="max-w-md">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <AlertTitle className="text-sm font-medium mb-1">
                  Error Loading Website
                </AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>

                {/* Additional guidance */}
                <div className="mt-2 text-xs">
                  <p>
                    This might be due to cross-origin restrictions or the
                    website's security settings.
                    {!proxyMode &&
                      " Try using a different URL or a website that allows embedding."}
                  </p>

                  {/* Suggested URLs */}
                  {suggestedUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">
                        Try these example URLs:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedUrls.map((suggestedUrl, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs py-0 h-6"
                            onClick={() => {
                              if (iframeRef.current) {
                                const newUrl = getIframeSrc(
                                  suggestedUrl,
                                  proxyMode,
                                );
                                setEffectiveUrl(newUrl);
                                iframeRef.current.src = newUrl;
                              }
                            }}
                          >
                            {new URL(suggestedUrl).hostname}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              {proxyMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotateProxy}
                  disabled={isRefreshing}
                  className="text-xs"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Try Different Proxy
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs"
              >
                {isRefreshing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open External
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {/* Status indicator for proxy mode */}
      {proxyMode && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <Shield className="h-3 w-3 mr-1" />
          Proxy: {getCurrentProxyServiceName()}
        </div>
      )}

      {/* Status indicator for iframe accessibility */}
      {iframeAccessible !== null && (
        <div
          className={`absolute top-2 left-2 z-10 text-xs px-2 py-1 rounded-full flex items-center ${iframeAccessible ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
        >
          {iframeAccessible ? "Accessible" : "Restricted"}
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={effectiveUrl}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        allow="camera; microphone; fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="no-referrer"
        title="Website Preview"
      />
    </div>
  );
};

export default WebsiteFrame;
