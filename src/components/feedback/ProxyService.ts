/**
 * ProxyService.ts
 * Handles proxying requests to bypass CORS restrictions
 */

// List of reliable CORS proxies
export const PROXY_SERVICES = [
  // Format: url => `${proxyUrl}${encodeURIComponent(url)}`
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${url}`,
];

// Index of the currently selected proxy service
let currentProxyIndex = 0;

/**
 * Get a proxied URL for the given URL
 */
export const getProxiedUrl = (url: string): string => {
  return PROXY_SERVICES[currentProxyIndex](url);
};

/**
 * Rotate to the next proxy service
 */
export const rotateProxyService = (): void => {
  currentProxyIndex = (currentProxyIndex + 1) % PROXY_SERVICES.length;
};

/**
 * Get the current proxy service name
 */
export const getCurrentProxyServiceName = (): string => {
  const proxyUrl = PROXY_SERVICES[currentProxyIndex].toString();
  if (proxyUrl.includes("corsproxy.io")) return "corsproxy.io";
  if (proxyUrl.includes("allorigins.win")) return "allorigins.win";
  if (proxyUrl.includes("cors-anywhere")) return "CORS Anywhere";
  if (proxyUrl.includes("thingproxy")) return "ThingProxy";
  if (proxyUrl.includes("codetabs.com")) return "CodeTabs Proxy";
  return "Unknown Proxy";
};

/**
 * Get all available proxy services
 */
export const getAllProxyServices = () => {
  return [
    { name: "corsproxy.io", index: 0, reliability: "high" },
    { name: "allorigins.win", index: 1, reliability: "medium" },
    { name: "CORS Anywhere", index: 2, reliability: "low" },
    { name: "ThingProxy", index: 3, reliability: "medium" },
    { name: "CodeTabs Proxy", index: 4, reliability: "medium" },
  ];
};

/**
 * Set the current proxy service by index
 */
export const setProxyServiceByIndex = (index: number): void => {
  if (index >= 0 && index < PROXY_SERVICES.length) {
    currentProxyIndex = index;
  }
};

/**
 * Check if a URL is likely to work with iframe embedding
 */
export const isLikelyEmbeddable = (url: string): boolean => {
  // Some sites are known to block iframe embedding
  const nonEmbeddableDomains = [
    "google.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
    "github.com",
    "youtube.com",
    "netflix.com",
    "amazon.com",
    "apple.com",
    "microsoft.com",
  ];

  try {
    const urlObj = new URL(url);
    return !nonEmbeddableDomains.some((domain) =>
      urlObj.hostname.includes(domain),
    );
  } catch {
    return true; // If URL parsing fails, we can't determine
  }
};

/**
 * Suggest alternative URLs that are likely to work with iframe embedding
 */
export const getSuggestedUrls = (): string[] => [
  "https://example.com",
  "https://placekitten.com",
  "https://jsonplaceholder.typicode.com",
  "https://httpbin.org",
  "https://picsum.photos",
];

/**
 * Create a proxy service instance
 */
export interface ProxyService {
  targetUrl: string;
  fetchContent: () => Promise<string>;
  close: () => void;
}

export const createProxyService = (options: {
  targetUrl: string;
  corsProxyUrl: string;
  injectSelectionScript?: boolean;
  rewriteUrls?: boolean;
  enableWebSocket?: boolean;
}): ProxyService => {
  const {
    targetUrl,
    corsProxyUrl,
    injectSelectionScript: injectScript = false,
    rewriteUrls: rewrite = false,
  } = options;

  return {
    targetUrl,
    fetchContent: async () => {
      try {
        // Fetch content through proxy
        const proxyUrl = corsProxyUrl.replace(
          "${url}",
          encodeURIComponent(targetUrl),
        );
        const response = await fetch(proxyUrl);
        let html = await response.text();

        // Inject selection script if requested
        if (injectScript) {
          html = injectSelectionScript(html);
        }

        // Rewrite URLs if requested
        if (rewrite) {
          html = rewriteUrls(html, targetUrl, corsProxyUrl);
        }

        return html;
      } catch (error) {
        console.error("Error fetching content through proxy:", error);
        throw error;
      }
    },
    close: () => {
      // Cleanup resources if needed
    },
  };
};

/**
 * Inject selection script into HTML content
 * This function adds a script to the HTML that enables element selection
 */
export const injectSelectionScript = (html: string): string => {
  const selectionScript = `
    <script>
      (function() {
        // Element selection functionality
        window.TempoElementSelector = {
          isActive: false,
          highlightedElement: null,
          selectedElement: null,
          
          init: function() {
            this.addStyles();
            this.setupEventListeners();
            console.log('Tempo Element Selector initialized');
            
            // Notify parent that we're ready
            if (window.parent) {
              try {
                window.parent.postMessage({ type: 'tempo_selector_ready' }, '*');
              } catch (e) {
                console.warn('Could not notify parent frame', e);
              }
            }
          },
          
          addStyles: function() {
            const style = document.createElement('style');
            style.textContent = ".tempo-element-hover {" +
              "outline: 2px dashed rgba(0, 120, 255, 0.7) !important;" +
              "outline-offset: 2px !important;" +
              "background-color: rgba(0, 120, 255, 0.05) !important;" +
              "cursor: pointer !important;" +
              "}" +
              ".tempo-element-selected {" +
              "outline: 3px solid rgba(0, 255, 120, 0.9) !important;" +
              "outline-offset: 3px !important;" +
              "background-color: rgba(0, 255, 120, 0.05) !important;" +
              "}";
            document.head.appendChild(style);
          },
          
          setupEventListeners: function() {
            // Mouse over event for highlighting elements
            document.addEventListener('mouseover', function(e) {
              if (!window.TempoElementSelector.isActive) return;
              
              const target = e.target;
              if (target && target.nodeType === Node.ELEMENT_NODE) {
                // Skip body and html elements
                if (target.tagName.toLowerCase() === 'body' || 
                    target.tagName.toLowerCase() === 'html') return;
                
                // Remove previous highlight
                if (window.TempoElementSelector.highlightedElement) {
                  window.TempoElementSelector.highlightedElement.classList.remove('tempo-element-hover');
                }
                
                // Add highlight to current element
                target.classList.add('tempo-element-hover');
                window.TempoElementSelector.highlightedElement = target;
              }
            }, true);
            
            // Mouse out event for removing highlight
            document.addEventListener('mouseout', function(e) {
              if (!window.TempoElementSelector.isActive) return;
              
              const target = e.target;
              if (target && target.nodeType === Node.ELEMENT_NODE) {
                target.classList.remove('tempo-element-hover');
              }
            }, true);
            
            // Click event for selecting elements
            document.addEventListener('click', function(e) {
              if (!window.TempoElementSelector.isActive) return;
              
              e.preventDefault();
              e.stopPropagation();
              
              const target = e.target;
              if (target && target.nodeType === Node.ELEMENT_NODE) {
                // Skip body and html elements
                if (target.tagName.toLowerCase() === 'body' || 
                    target.tagName.toLowerCase() === 'html') return;
                
                // Remove previous selection
                if (window.TempoElementSelector.selectedElement) {
                  window.TempoElementSelector.selectedElement.classList.remove('tempo-element-selected');
                }
                
                // Add selection to current element
                target.classList.add('tempo-element-selected');
                target.classList.remove('tempo-element-hover');
                window.TempoElementSelector.selectedElement = target;
                
                // Send selection data to parent
                window.TempoElementSelector.sendElementData(target);
              }
            }, true);
            
            // Listen for messages from parent frame
            window.addEventListener('message', function(e) {
              if (e.data && e.data.type === 'tempo_activate_selection') {
                window.TempoElementSelector.isActive = e.data.active;
                console.log('Selection mode ' + (e.data.active ? 'activated' : 'deactivated'));
                
                // Clear any existing highlights/selections when toggling
                if (!e.data.active) {
                  if (window.TempoElementSelector.highlightedElement) {
                    window.TempoElementSelector.highlightedElement.classList.remove('tempo-element-hover');
                  }
                  if (window.TempoElementSelector.selectedElement) {
                    window.TempoElementSelector.selectedElement.classList.remove('tempo-element-selected');
                  }
                }
              }
            });
          },
          
          sendElementData: function(element) {
            try {
              // Get element details
              const rect = element.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(element);
              
              // Generate selectors
              const cssSelector = this.generateCssSelector(element);
              const xpath = this.generateXPath(element);
              
              // Create element data object
              const elementData = {
                selector: cssSelector,
                xpath: xpath,
                elementType: element.tagName.toLowerCase(),
                dimensions: {
                  width: rect.width,
                  height: rect.height,
                  top: rect.top,
                  left: rect.left
                },
                styles: {
                  backgroundColor: computedStyle.backgroundColor,
                  color: computedStyle.color,
                  fontSize: computedStyle.fontSize,
                  fontFamily: computedStyle.fontFamily
                },
                text: element.textContent ? element.textContent.trim().substring(0, 100) : '',
                attributes: this.getElementAttributes(element),
                html: element.outerHTML.substring(0, 500),
                timestamp: new Date().toISOString()
              };
              
              // Send data to parent frame
              if (window.parent) {
                window.parent.postMessage({
                  type: 'tempo_element_selected',
                  data: elementData
                }, '*');
              }
            } catch (error) {
              console.error('Error sending element data:', error);
            }
          },
          
          generateCssSelector: function(element) {
            if (element.id) {
              return '#' + element.id;
            }
            
            let selector = element.tagName.toLowerCase();
            
            if (element.className) {
              const classes = element.className.split(' ').filter(c => c);
              if (classes.length > 0) {
                selector += '.' + classes.join('.');
              }
            }
            
            // Add position if needed
            if (!element.id && element.parentNode) {
              const siblings = Array.from(element.parentNode.children)
                .filter(child => child.tagName === element.tagName);
              if (siblings.length > 1) {
                const index = Array.from(siblings).indexOf(element) + 1;
                selector += ':nth-of-type(' + index + ')';
              }
            }
            
            return selector;
          },
          
          generateXPath: function(element) {
            let xpath = '';
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
              xpath = '/' + tagName + '[' + index + ']' + xpath;
              current = current.parentElement;
            }
            
            return '/html[1]/body[1]' + xpath;
          },
          
          getElementAttributes: function(element) {
            const attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
              const attr = element.attributes[i];
              attributes[attr.name] = attr.value;
            }
            return attributes;
          }
        };
        
        // Initialize when the DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            window.TempoElementSelector.init();
          });
        } else {
          window.TempoElementSelector.init();
        }
      })();
    </script>
  `;

  // Insert the script right before the closing </body> tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${selectionScript}</body>`);
  } else {
    // If there's no body tag, append to the end
    return html + selectionScript;
  }
};

/**
 * Rewrite URLs in HTML content to go through the proxy
 */
export const rewriteUrls = (
  html: string,
  baseUrl: string,
  proxyUrl: string,
): string => {
  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;

    // Function to convert relative URLs to absolute and then proxied
    const processUrl = (url: string): string => {
      // Skip data URLs, anchors, and javascript URLs
      if (
        !url ||
        url.startsWith("data:") ||
        url.startsWith("#") ||
        url.startsWith("javascript:")
      ) {
        return url;
      }

      // Convert relative URLs to absolute
      let absoluteUrl = url;
      if (url.startsWith("/")) {
        absoluteUrl = `${origin}${url}`;
      } else if (!url.startsWith("http")) {
        absoluteUrl = `${origin}/${url}`;
      }

      // Apply proxy
      return proxyUrl.replace("${url}", encodeURIComponent(absoluteUrl));
    };

    // Replace src and href attributes
    return html.replace(
      /\ssrc=['"]([^'"]+)['"]|\shref=['"]([^'"]+)['"]|\surl\(['"]?([^'"\)]+)['"]?\)/gi,
      (match, src, href, url) => {
        if (src) return ` src="${processUrl(src)}"`;
        if (href) return ` href="${processUrl(href)}"`;
        if (url) return ` url("${processUrl(url)}")`;
        return match;
      },
    );
  } catch (error) {
    console.error("Error rewriting URLs:", error);
    return html; // Return original HTML if rewriting fails
  }
};
