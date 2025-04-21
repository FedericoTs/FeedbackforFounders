import React, { useEffect, useRef, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Crosshair, AlertCircle, RefreshCw, Camera, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ElementSelectorProps {
  isActive: boolean;
  onElementSelected: (element: {
    selector: string;
    xpath: string;
    elementType: string;
    dimensions: { width: number; height: number; top: number; left: number };
    screenshot?: string;
  }) => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  proxyMode?: boolean;
}

// Define utility functions outside the component to avoid initialization issues
const getElementPathUtil = (element: HTMLElement): string[] => {
  try {
    const path: string[] = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let elementDesc = current.tagName.toLowerCase();
      if (current.id) {
        elementDesc += `#${current.id}`;
      } else if (current.className && typeof current.className === "string") {
        const classes = current.className.split(" ").filter((c) => c);
        if (classes.length > 0) {
          elementDesc += `.${classes[0]}`;
        }
      }
      path.unshift(elementDesc);
      current = current.parentElement as HTMLElement;

      // Limit path length for performance
      if (path.length >= 10) break;
    }

    return path;
  } catch (error) {
    console.error("Error generating element path:", error);
    return ["unknown"];
  }
};

const determineElementTypeUtil = (element: HTMLElement): string => {
  try {
    const tagName = element.tagName?.toLowerCase();
    const role = element.getAttribute("role");

    // Check for ARIA role first
    if (role) return role;

    // Map common elements to their semantic types
    const typeMap: Record<string, string> = {
      a: "link",
      button: "button",
      input: element.getAttribute("type") || "input",
      select: "dropdown",
      textarea: "text area",
      img: "image",
      ul: "list",
      ol: "ordered list",
      table: "table",
      form: "form",
      nav: "navigation",
      header: "header",
      footer: "footer",
      aside: "sidebar",
      main: "main content",
      div: "container",
      span: "text",
      p: "paragraph",
      h1: "heading",
      h2: "heading",
      h3: "heading",
      h4: "heading",
      h5: "heading",
      h6: "heading",
    };

    return typeMap[tagName] || "element";
  } catch (error) {
    console.error("Error determining element type:", error);
    return "element";
  }
};

const getCssSelectorUtil = (element: HTMLElement): string => {
  try {
    // Try ID-based selector if available
    if (element.id) {
      return `#${element.id}`;
    }

    // Build selector using classes, attributes, and position
    let selector = element.tagName.toLowerCase();

    // Add classes (up to 2 for specificity without overspecificity)
    if (element.classList && element.classList.length > 0) {
      const classSelectors = Array.from(element.classList)
        .slice(0, 2)
        .map((cls) => `.${cls}`)
        .join("");
      selector += classSelectors;
    }

    // Add position among siblings if needed
    if (!element.id && element.parentNode) {
      const siblings = Array.from(element.parentNode.children).filter(
        (child) => child.tagName === element.tagName,
      );
      if (siblings.length > 1) {
        const index = Array.from(siblings).indexOf(element) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    // Build full path (limit to 3 levels for readability)
    let current = element.parentElement;
    let levels = 0;
    let fullSelector = selector;

    while (current && current.tagName && levels < 2) {
      const parentSelector = getCssSelectorUtil(current);
      fullSelector = `${parentSelector} > ${fullSelector}`;
      current = current.parentElement;
      levels++;
    }

    return fullSelector;
  } catch (error) {
    console.error("Error generating CSS selector:", error);
    return element.tagName.toLowerCase();
  }
};

const getXPathUtil = (element: HTMLElement): string => {
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

// Function to capture element screenshot
const captureElementScreenshot = async (
  element: HTMLElement,
): Promise<string | null> => {
  try {
    // Use html2canvas if available (would need to be imported)
    if (typeof html2canvas !== "undefined") {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });
      return canvas.toDataURL("image/png");
    }

    // Fallback method using browser APIs
    return null;
  } catch (error) {
    console.error("Error capturing element screenshot:", error);
    return null;
  }
};

// Declare html2canvas to avoid TypeScript errors
declare const html2canvas: any;

const ElementSelector: React.FC<ElementSelectorProps> = ({
  isActive,
  onElementSelected,
  iframeRef,
  proxyMode = false,
}) => {
  const [hoveredElement, setHoveredElement] = useState<{
    element: HTMLElement | null;
    type: string;
    path: string[];
  }>({ element: null, type: "", path: [] });
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null,
  );
  const [highlightStyle, setHighlightStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    display: "none",
  });
  const [tooltipStyle, setTooltipStyle] = useState({
    top: 0,
    left: 0,
    display: "none",
  });
  const highlightRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const [isDynamicContentDetected, setIsDynamicContentDetected] =
    useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [showFallbackHelp, setShowFallbackHelp] = useState(false);

  // Function to get element path (for display) - using the utility function
  const getElementPath = useCallback((element: HTMLElement): string[] => {
    return getElementPathUtil(element);
  }, []);

  // Function to determine element type - using the utility function
  const determineElementType = useCallback((element: HTMLElement): string => {
    return determineElementTypeUtil(element);
  }, []);

  // Function to get CSS selector for an element - using the utility function
  const getCssSelector = useCallback((element: HTMLElement): string => {
    return getCssSelectorUtil(element);
  }, []);

  // Function to get XPath for an element - using the utility function
  const getXPath = useCallback((element: HTMLElement): string => {
    return getXPathUtil(element);
  }, []);

  // Function to observe dynamic changes in the DOM
  const observeDynamicChanges = useCallback(
    (document: Document) => {
      try {
        if (window.mutationDebounceTimeout) {
          clearTimeout(window.mutationDebounceTimeout);
        }

        const observer = new MutationObserver((mutations) => {
          // Debounce to avoid excessive processing
          if (window.mutationDebounceTimeout) {
            clearTimeout(window.mutationDebounceTimeout);
          }

          window.mutationDebounceTimeout = setTimeout(() => {
            console.log("DOM mutations detected:", mutations.length);
            setIsDynamicContentDetected(true);

            // If we have a hovered element, update its path
            if (hoveredElement.element) {
              setHoveredElement({
                ...hoveredElement,
                path: getElementPathUtil(hoveredElement.element),
              });
            }

            // Hide dynamic content indicator after a delay
            setTimeout(() => {
              setIsDynamicContentDetected(false);
            }, 3000);
          }, 200);
        });

        // Observe the entire document for changes
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });

        console.log("Dynamic content observer attached");
        return observer;
      } catch (error) {
        console.warn("Error setting up mutation observer:", error);
        return null;
      }
    },
    [hoveredElement],
  );

  // Function to inject styles into iframe
  const injectStyles = useCallback((document: Document) => {
    try {
      // Check if styles are already injected
      if (document.getElementById("tempo-element-selector-styles")) {
        return;
      }

      const style = document.createElement("style");
      style.id = "tempo-element-selector-styles";
      style.textContent = `
        .tempo-element-hover {
          outline: 2px dashed rgba(0, 120, 255, 0.7) !important;
          outline-offset: 2px !important;
          background-color: rgba(0, 120, 255, 0.05) !important;
          cursor: pointer !important;
          transition: outline 0.15s ease-in-out, background-color 0.15s ease-in-out !important;
        }
        .tempo-element-selected {
          outline: 3px solid rgba(0, 255, 120, 0.9) !important;
          outline-offset: 3px !important;
          background-color: rgba(0, 255, 120, 0.05) !important;
          transition: outline 0.15s ease-in-out, background-color 0.15s ease-in-out !important;
        }
        .tempo-element-keyboard-focus {
          outline: 3px dashed rgba(255, 165, 0, 0.9) !important;
          outline-offset: 3px !important;
          background-color: rgba(255, 165, 0, 0.05) !important;
          transition: outline 0.15s ease-in-out, background-color 0.15s ease-in-out !important;
        }
        /* Accessibility enhancements for high contrast */
        @media (prefers-contrast: high) {
          .tempo-element-hover {
            outline: 3px dashed #0000FF !important;
            background-color: rgba(0, 0, 255, 0.1) !important;
          }
          .tempo-element-selected {
            outline: 4px solid #00AA00 !important;
            background-color: rgba(0, 170, 0, 0.1) !important;
          }
          .tempo-element-keyboard-focus {
            outline: 4px dashed #FF8C00 !important;
            background-color: rgba(255, 140, 0, 0.1) !important;
          }
        }
      `;
      document.head.appendChild(style);
      console.log("Styles injected into iframe");
    } catch (error) {
      console.warn("Could not inject styles into iframe:", error);
      setErrorMessage(
        "Could not inject styles into iframe. This might be due to cross-origin restrictions.",
      );
    }
  }, []);

  // Function to safely access iframe document
  const getIframeDocument = useCallback(() => {
    if (!iframeRef.current) return null;

    try {
      const iframe = iframeRef.current;
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDocument) {
        throw new Error("Could not access iframe document");
      }

      setIsConnected(true);
      setErrorMessage(null);
      return iframeDocument;
    } catch (error) {
      console.error("Error accessing iframe content:", error);
      setIsConnected(false);
      setErrorMessage(
        "Could not access iframe document. This might be due to cross-origin restrictions.",
      );
      return null;
    }
  }, [iframeRef]);

  // Function to calculate element position relative to viewport
  const calculateElementPosition = useCallback(
    (element: HTMLElement) => {
      try {
        if (!iframeRef.current) return { top: 0, left: 0, width: 0, height: 0 };

        const rect = element.getBoundingClientRect();
        const iframeRect = iframeRef.current.getBoundingClientRect();

        return {
          top: rect.top + iframeRect.top + window.scrollY,
          left: rect.left + iframeRect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        };
      } catch (error) {
        console.error("Error calculating element position:", error);
        return { top: 0, left: 0, width: 0, height: 0 };
      }
    },
    [iframeRef],
  );

  // Debounce function for performance optimization
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return function (...args: any[]) {
      const context = this;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    };
  }, []);

  // Function to enable fallback mode when iframe access fails
  const enableFallbackMode = useCallback(() => {
    setFallbackMode(true);
    setErrorMessage(
      "Switched to fallback mode due to cross-origin restrictions. Use the manual selection tools below.",
    );
  }, []);

  // Function to handle manual screenshot capture
  const handleManualScreenshot = useCallback(async () => {
    try {
      if (!iframeRef.current) return;

      // Take a screenshot of the entire iframe
      const iframe = iframeRef.current;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Could not create canvas context");

      // Set canvas dimensions to match iframe
      const rect = iframe.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Draw iframe content to canvas (this will only work for same-origin content)
      try {
        context.drawImage(iframe, 0, 0, rect.width, rect.height);
        const screenshot = canvas.toDataURL("image/png");

        // Create a simulated element selection with the screenshot
        onElementSelected({
          selector: "manual-selection",
          xpath: "/html/body",
          elementType: "manual-screenshot",
          dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          },
          screenshot: screenshot,
        });

        // Show success message
        setErrorMessage(
          "Screenshot captured successfully. You can now add your feedback.",
        );
        setTimeout(() => setErrorMessage(null), 3000);
      } catch (error) {
        throw new Error(
          "Could not capture iframe content due to security restrictions",
        );
      }
    } catch (error) {
      console.error("Error capturing manual screenshot:", error);
      setErrorMessage(
        "Could not capture screenshot. Please use the coordinate selection method instead.",
      );
    }
  }, [iframeRef, onElementSelected]);

  // Function to handle manual coordinate selection
  const handleManualCoordinateSelection = useCallback(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const rect = iframe.getBoundingClientRect();

    // Create a simulated element selection with coordinates
    onElementSelected({
      selector: "manual-coordinates",
      xpath: "/html/body",
      elementType: "manual-selection",
      dimensions: {
        width: rect.width / 2, // Default to half the iframe width
        height: rect.height / 2, // Default to half the iframe height
        top: rect.top + rect.height / 4, // Center vertically
        left: rect.left + rect.width / 4, // Center horizontally
      },
    });

    // Show success message
    setErrorMessage("Coordinates selected. You can now add your feedback.");
    setTimeout(() => setErrorMessage(null), 3000);
  }, [iframeRef, onElementSelected]);

  // Set up event listeners for the iframe
  useEffect(() => {
    if (!isActive) {
      setHighlightStyle({ ...highlightStyle, display: "none" });
      setTooltipStyle({ ...tooltipStyle, display: "none" });
      return;
    }

    const iframeDocument = getIframeDocument();
    if (!iframeDocument) {
      // If we can't access the iframe document, enable fallback mode
      enableFallbackMode();
      return;
    }

    // Inject styles into iframe
    injectStyles(iframeDocument);

    // Function to handle mouseover events
    const handleMouseOver = debounce((e: MouseEvent) => {
      if (!isActive) return;

      // Remove previous hover class if exists
      const previousHovered = iframeDocument.querySelector(
        ".tempo-element-hover",
      );
      if (previousHovered) {
        previousHovered.classList.remove("tempo-element-hover");
      }

      const target = e.target as HTMLElement;
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        // Skip body and html elements
        if (
          target.tagName.toLowerCase() === "body" ||
          target.tagName.toLowerCase() === "html"
        ) {
          return;
        }

        // Add hover class to current element
        try {
          target.classList.add("tempo-element-hover");
        } catch (error) {
          console.warn("Could not add hover class:", error);
        }

        // Update hovered element state
        setHoveredElement({
          element: target,
          type: determineElementType(target),
          path: getElementPath(target),
        });

        // Update highlight position
        const position = calculateElementPosition(target);
        setHighlightStyle({
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          display: "block",
        });

        // Update tooltip position
        setTooltipStyle({
          top: position.top - 25,
          left: position.left,
          display: "block",
        });
      }
    }, 10);

    // Function to handle mouseout events
    const handleMouseOut = (e: MouseEvent) => {
      if (!isActive) return;

      const target = e.target as HTMLElement;
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        try {
          target.classList.remove("tempo-element-hover");
        } catch (error) {
          console.warn("Could not remove hover class:", error);
        }
      }
    };

    // Function to handle click events
    const handleClick = async (e: MouseEvent) => {
      if (!isActive) return;

      e.preventDefault();
      e.stopPropagation();

      // Remove previous selected class if exists
      const previousSelected = iframeDocument.querySelector(
        ".tempo-element-selected",
      );
      if (previousSelected) {
        previousSelected.classList.remove("tempo-element-selected");
      }

      const target = e.target as HTMLElement;
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        // Skip body and html elements
        if (
          target.tagName.toLowerCase() === "body" ||
          target.tagName.toLowerCase() === "html"
        ) {
          return;
        }

        // Add selected class to current element
        try {
          target.classList.add("tempo-element-selected");
          target.classList.remove("tempo-element-hover");
        } catch (error) {
          console.warn("Could not add selected class:", error);
        }

        setSelectedElement(target);

        // Get element details and pass to parent component
        const selector = getCssSelector(target);
        const xpath = getXPath(target);
        const position = calculateElementPosition(target);

        // Try to capture a screenshot of the element if possible
        let screenshot = null;
        let screenshotHash = null;
        try {
          screenshot = await captureElementScreenshot(target);
          if (screenshot) {
            screenshotHash = await generateImageHash(screenshot);
          }
        } catch (error) {
          console.warn("Could not capture element screenshot:", error);
        }

        // Get iframe information for context
        const iframe = iframeRef.current;
        const iframeRect = iframe?.getBoundingClientRect();

        onElementSelected({
          selector,
          xpath,
          elementType: determineElementType(target),
          dimensions: {
            width: position.width,
            height: position.height,
            top: position.top,
            left: position.left,
          },
          screenshot,
          // Add enhanced data collection
          visualFingerprint: {
            boundingBox: {
              x: position.left - (iframeRect?.left || 0),
              y: position.top - (iframeRect?.top || 0),
              width: position.width,
              height: position.height,
            },
            screenshotHash,
          },
          pageContext: {
            url: iframe?.src || window.location.href,
            timestamp: new Date().toISOString(),
            viewportSize: {
              width: iframeRect?.width || window.innerWidth,
              height: iframeRect?.height || window.innerHeight,
            },
            userAgent: navigator.userAgent,
          },
        });

        // Show a visual confirmation of selection
        console.log("Element selected:", selector);
      }
    };

    // Function to handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      // ESC key cancels selection mode
      if (e.key === "Escape") {
        // This would be handled by the parent component
        return;
      }

      // If no element is currently hovered/focused and an arrow key is pressed,
      // start keyboard navigation from the body
      if (!hoveredElement.element && e.key.startsWith("Arrow")) {
        try {
          const bodyElement = iframeDocument.body;
          if (bodyElement) {
            setIsKeyboardNavigating(true);

            // Find the first meaningful element to focus
            const firstElement =
              (bodyElement.querySelector(
                "h1, h2, header, nav, main, button, a",
              ) as HTMLElement) ||
              (bodyElement.firstElementChild as HTMLElement);

            if (firstElement) {
              // Add keyboard focus class
              firstElement.classList.add("tempo-element-keyboard-focus");

              // Update hovered element state
              setHoveredElement({
                element: firstElement,
                type: determineElementType(firstElement),
                path: getElementPath(firstElement),
              });

              // Ensure element is visible
              firstElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
          return;
        } catch (error) {
          console.warn("Error starting keyboard navigation:", error);
        }
      }

      if (!hoveredElement.element) return;

      // Arrow keys for navigating DOM hierarchy
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        setIsKeyboardNavigating(true);

        const current = hoveredElement.element;
        let newTarget: HTMLElement | null = null;

        // Remove keyboard focus class from current element
        try {
          current.classList.remove("tempo-element-keyboard-focus");
          current.classList.remove("tempo-element-hover");
        } catch (error) {
          console.warn("Error removing keyboard focus class:", error);
        }

        switch (e.key) {
          case "ArrowUp":
            // Navigate to parent
            newTarget = current.parentElement;
            break;

          case "ArrowDown":
            // Navigate to first child
            if (current.children.length > 0) {
              newTarget = current.children[0] as HTMLElement;
            }
            break;

          case "ArrowLeft":
            // Navigate to previous sibling
            newTarget = current.previousElementSibling as HTMLElement;
            break;

          case "ArrowRight":
            // Navigate to next sibling
            newTarget = current.nextElementSibling as HTMLElement;
            break;
        }

        if (newTarget && newTarget.nodeType === Node.ELEMENT_NODE) {
          // Skip body and html elements
          if (
            newTarget.tagName.toLowerCase() === "body" ||
            newTarget.tagName.toLowerCase() === "html"
          ) {
            return;
          }

          // Add keyboard focus class
          try {
            newTarget.classList.add("tempo-element-keyboard-focus");
          } catch (error) {
            console.warn("Error adding keyboard focus class:", error);
          }

          // Update hovered element state
          setHoveredElement({
            element: newTarget,
            type: determineElementType(newTarget),
            path: getElementPath(newTarget),
          });

          // Update highlight position
          const position = calculateElementPosition(newTarget);
          setHighlightStyle({
            top: position.top,
            left: position.left,
            width: position.width,
            height: position.height,
            display: "block",
          });

          // Update tooltip position
          setTooltipStyle({
            top: position.top - 25,
            left: position.left,
            display: "block",
          });

          // Ensure element is visible
          newTarget.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }

      // Enter key to select current element
      if (e.key === "Enter" && hoveredElement.element) {
        // Remove keyboard focus class
        try {
          hoveredElement.element.classList.remove(
            "tempo-element-keyboard-focus",
          );
        } catch (error) {
          console.warn("Error removing keyboard focus class:", error);
        }

        // Simulate click
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        hoveredElement.element.dispatchEvent(clickEvent);
      }
    };

    // Add event listeners to the iframe document
    try {
      iframeDocument.addEventListener(
        "mouseover",
        handleMouseOver as EventListener,
        true,
      );
      iframeDocument.addEventListener(
        "mouseout",
        handleMouseOut as EventListener,
        true,
      );
      iframeDocument.addEventListener(
        "click",
        handleClick as EventListener,
        true,
      );
      iframeDocument.addEventListener(
        "keydown",
        handleKeyDown as EventListener,
        true,
      );

      // Log success message
      console.log("Element selector event listeners attached successfully");
    } catch (error) {
      console.error("Error attaching event listeners to iframe:", error);
      setErrorMessage(
        "Error attaching event listeners to iframe. This might be due to cross-origin restrictions.",
      );
      enableFallbackMode();
    }

    // Clean up event listeners
    return () => {
      try {
        iframeDocument?.removeEventListener(
          "mouseover",
          handleMouseOver as EventListener,
          true,
        );
        iframeDocument?.removeEventListener(
          "mouseout",
          handleMouseOut as EventListener,
          true,
        );
        iframeDocument?.removeEventListener(
          "click",
          handleClick as EventListener,
          true,
        );
        iframeDocument?.removeEventListener(
          "keydown",
          handleKeyDown as EventListener,
          true,
        );

        // Remove any added styles or classes
        const styleElement = iframeDocument?.getElementById(
          "tempo-element-selector-styles",
        );
        if (styleElement) {
          styleElement.remove();
        }

        const hoveredElements = iframeDocument?.querySelectorAll(
          ".tempo-element-hover",
        );
        hoveredElements?.forEach((el) =>
          el.classList.remove("tempo-element-hover"),
        );

        const selectedElements = iframeDocument?.querySelectorAll(
          ".tempo-element-selected",
        );
        selectedElements?.forEach((el) =>
          el.classList.remove("tempo-element-selected"),
        );

        const keyboardFocusElements = iframeDocument?.querySelectorAll(
          ".tempo-element-keyboard-focus",
        );
        keyboardFocusElements?.forEach((el) =>
          el.classList.remove("tempo-element-keyboard-focus"),
        );
      } catch (error) {
        console.warn("Error cleaning up event listeners:", error);
      }
    };
  }, [
    isActive,
    iframeRef,
    onElementSelected,
    getIframeDocument,
    injectStyles,
    calculateElementPosition,
    debounce,
    getCssSelector,
    getXPath,
    getElementPath,
    determineElementType,
    highlightStyle,
    tooltipStyle,
    observeDynamicChanges,
    enableFallbackMode,
  ]);

  if (!isActive) return null;

  return (
    <>
      {/* Element highlight overlay - now handled by adding classes directly to elements */}
      <div
        ref={highlightRef}
        className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-50 transition-all duration-100"
        style={highlightStyle}
      />

      {/* Element type tooltip */}
      <div
        className="absolute bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
        style={tooltipStyle}
      >
        {hoveredElement.type}
      </div>

      {/* Element path display */}
      {hoveredElement.element && !fallbackMode && (
        <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-slate-900 p-2 rounded-md shadow-md z-50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Path:
            </span>
            {hoveredElement.path.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-slate-400 dark:text-slate-600">
                    &gt;
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {item}
                </Badge>
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500 mt-1">
              Hover over elements and click to select
            </div>
            {selectedElement && (
              <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Element selected! ✓
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback mode UI */}
      {fallbackMode && (
        <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-slate-900 p-3 rounded-md shadow-md z-50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 text-amber-500" />
              Alternative Selection Methods
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowFallbackHelp(!showFallbackHelp)}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>

          {showFallbackHelp && (
            <div className="mb-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <p>
                Due to cross-origin restrictions, direct element selection is
                not available. Use these alternative methods instead:
              </p>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>
                  <strong>Screenshot Method:</strong> Captures the current view
                  for feedback
                </li>
                <li>
                  <strong>Coordinate Method:</strong> Uses a predefined area for
                  feedback
                </li>
              </ul>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleManualScreenshot}
            >
              <Camera className="h-4 w-4 mr-1" />
              Screenshot Method
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleManualCoordinateSelection}
            >
              <Crosshair className="h-4 w-4 mr-1" />
              Coordinate Method
            </Button>
          </div>
        </div>
      )}

      {/* Selection mode indicator */}
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2">
        <span className="animate-pulse h-3 w-3 bg-white rounded-full"></span>
        <span className="text-sm font-medium">
          {fallbackMode
            ? "Alternative Selection Mode"
            : "Element Selection Mode Active"}
        </span>
      </div>

      {/* Instructions tooltip */}
      {!fallbackMode && (
        <div
          className="fixed top-16 right-4 bg-white dark:bg-slate-800 p-3 rounded-md shadow-md z-50 border border-slate-200 dark:border-slate-700 max-w-xs"
          role="region"
          aria-label="Selection controls"
        >
          <h4 className="font-medium text-sm mb-2">Selection Controls:</h4>
          <ul className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <li className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded mr-1.5">
                Mouse
              </kbd>{" "}
              Hover over elements
            </li>
            <li className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded mr-1.5">
                Click
              </kbd>{" "}
              Select element
            </li>
            <li className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded mr-1.5">
                ↑↓←→
              </kbd>{" "}
              Navigate DOM tree
            </li>
            <li className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded mr-1.5">
                Enter
              </kbd>{" "}
              Select current element
            </li>
            <li className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded mr-1.5">
                ESC
              </kbd>{" "}
              Cancel selection
            </li>
          </ul>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div
          className="fixed bottom-20 left-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md shadow-md z-50 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          <div className="font-medium mb-1 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {fallbackMode ? "Notice:" : "Error:"}
          </div>
          <div>{errorMessage}</div>
          {!fallbackMode && (
            <div className="mt-2 text-xs">
              Note: Some websites may block selection due to cross-origin
              restrictions.
              {!proxyMode && (
                <div className="mt-1">
                  Try using a different website or enabling proxy mode in the
                  settings.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keyboard navigation indicator */}
      {isKeyboardNavigating && !fallbackMode && (
        <div
          className="fixed top-16 left-4 bg-orange-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2"
          role="status"
        >
          <span className="text-sm font-medium">
            Keyboard Navigation Active
          </span>
        </div>
      )}

      {/* Connection status */}
      {!isConnected && !fallbackMode && (
        <div className="fixed top-4 left-4 bg-yellow-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2">
          <Crosshair className="h-4 w-4" />
          <span className="text-sm font-medium">
            Trying to connect to iframe...
          </span>
        </div>
      )}

      {/* Dynamic content indicator */}
      {isDynamicContentDetected && !fallbackMode && (
        <div className="fixed top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-md shadow-md z-50 flex items-center space-x-2 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Dynamic content detected</span>
        </div>
      )}
    </>
  );
};

// Add type definition for window to include mutationDebounceTimeout
declare global {
  interface Window {
    mutationDebounceTimeout: ReturnType<typeof setTimeout> | null;
  }
}

export default ElementSelector;
