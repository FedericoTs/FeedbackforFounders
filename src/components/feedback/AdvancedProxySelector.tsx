import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Check, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProxyService {
  id: string;
  name: string;
  url: (targetUrl: string) => string;
  description: string;
  reliability: "high" | "medium" | "low";
  limitations?: string;
}

interface AdvancedProxySelectorProps {
  onProxyChange: (proxyUrl: string | null) => void;
  targetUrl: string;
  isProxyEnabled: boolean;
  onProxyToggle: (enabled: boolean) => void;
}

const AdvancedProxySelector: React.FC<AdvancedProxySelectorProps> = ({
  onProxyChange,
  targetUrl,
  isProxyEnabled,
  onProxyToggle,
}) => {
  const [selectedProxyId, setSelectedProxyId] = useState<string>("corsproxy");
  const [proxyStatus, setProxyStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");

  // List of available proxy services
  const proxyServices: ProxyService[] = [
    {
      id: "corsproxy",
      name: "CORS Proxy.io",
      url: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      description: "Fast and reliable CORS proxy service",
      reliability: "high",
    },
    {
      id: "allorigins",
      name: "All Origins",
      url: (url: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      description: "Reliable proxy with good compatibility",
      reliability: "medium",
      limitations: "May have issues with some JavaScript-heavy sites",
    },
    {
      id: "corsanywhere",
      name: "CORS Anywhere",
      url: (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
      description: "Popular proxy service with request limits",
      reliability: "low",
      limitations: "Limited requests per hour, may require authorization",
    },
  ];

  // Get the currently selected proxy service
  const getSelectedProxy = (): ProxyService | undefined => {
    return proxyServices.find((proxy) => proxy.id === selectedProxyId);
  };

  // Handle proxy selection change
  const handleProxyChange = (proxyId: string) => {
    setSelectedProxyId(proxyId);
    const proxy = proxyServices.find((p) => p.id === proxyId);
    if (proxy && isProxyEnabled) {
      onProxyChange(proxy.url(targetUrl));
    }
  };

  // Handle proxy toggle
  const handleProxyToggle = () => {
    const newState = !isProxyEnabled;
    onProxyToggle(newState);

    if (newState) {
      const proxy = getSelectedProxy();
      if (proxy) {
        onProxyChange(proxy.url(targetUrl));
      }
    } else {
      onProxyChange(null);
    }
  };

  // Test the selected proxy
  const testProxy = async () => {
    const proxy = getSelectedProxy();
    if (!proxy) return;

    setProxyStatus("testing");

    try {
      const proxyUrl = proxy.url("https://httpbin.org/get");
      const response = await fetch(proxyUrl);

      if (response.ok) {
        setProxyStatus("success");
        setTimeout(() => setProxyStatus("idle"), 3000);
      } else {
        setProxyStatus("error");
        setTimeout(() => setProxyStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Proxy test failed:", error);
      setProxyStatus("error");
      setTimeout(() => setProxyStatus("idle"), 3000);
    }
  };

  // Get reliability badge color
  const getReliabilityColor = (reliability: "high" | "medium" | "low") => {
    switch (reliability) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="flex flex-col space-y-2 p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Advanced Proxy Settings</h3>
        <Button
          variant={isProxyEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleProxyToggle}
          className="h-7"
        >
          <Shield className="h-3.5 w-3.5 mr-1" />
          {isProxyEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>

      {isProxyEnabled && (
        <>
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <Select
                value={selectedProxyId}
                onValueChange={handleProxyChange}
                disabled={proxyStatus === "testing"}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select proxy service" />
                </SelectTrigger>
                <SelectContent>
                  {proxyServices.map((proxy) => (
                    <SelectItem key={proxy.id} value={proxy.id}>
                      <div className="flex items-center">
                        <span
                          className={`h-2 w-2 rounded-full mr-2 ${getReliabilityColor(
                            proxy.reliability,
                          )}`}
                        />
                        {proxy.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={testProxy}
                    disabled={proxyStatus === "testing"}
                  >
                    {proxyStatus === "testing" ? (
                      <div className="h-3.5 w-3.5 border-2 border-t-blue-500 border-slate-200 rounded-full animate-spin" />
                    ) : proxyStatus === "success" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : proxyStatus === "error" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <span className="text-xs">Test</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test proxy connection</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {getSelectedProxy()?.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getSelectedProxy()?.description}
            </p>
          )}

          {getSelectedProxy()?.limitations && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
              {getSelectedProxy()?.limitations}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedProxySelector;
