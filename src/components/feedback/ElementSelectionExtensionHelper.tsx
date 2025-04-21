import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Puzzle, ExternalLink, Check, AlertTriangle } from "lucide-react";

interface ElementSelectionExtensionHelperProps {
  onInstallClick?: () => void;
}

const ElementSelectionExtensionHelper: React.FC<
  ElementSelectionExtensionHelperProps
> = ({ onInstallClick }) => {
  const [isExtensionDetected, setIsExtensionDetected] = useState<
    boolean | null
  >(null);

  // This function would check if the extension is installed
  // In a real implementation, this would communicate with the extension
  const checkExtensionInstalled = () => {
    // Simulate extension detection
    // In a real implementation, you would use something like:
    // window.postMessage({type: 'DETECT_EXTENSION'}, '*');
    // And listen for a response from the extension

    // For demo purposes, we'll just set it to false
    setIsExtensionDetected(false);

    return false;
  };

  // Check for extension on component mount
  React.useEffect(() => {
    checkExtensionInstalled();
  }, []);

  // Handle install button click
  const handleInstallClick = () => {
    if (onInstallClick) {
      onInstallClick();
    } else {
      // Open extension installation page
      window.open(
        "https://chrome.google.com/webstore/category/extensions",
        "_blank",
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Puzzle className="h-4 w-4 mr-1" />
          <span>Extension</span>
          {isExtensionDetected === true && (
            <span className="ml-1 h-2 w-2 rounded-full bg-green-500" />
          )}
          {isExtensionDetected === false && (
            <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Element Selection Extension</DialogTitle>
          <DialogDescription>
            Enhance your feedback experience with our browser extension
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start mb-4">
            {isExtensionDetected ? (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <Check className="h-5 w-5 mr-2" />
                <span className="font-medium">Extension detected!</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">Extension not detected</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">
                Why use the extension?
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
                <li>Bypass cross-origin restrictions</li>
                <li>Select elements on any website</li>
                <li>Capture accurate screenshots</li>
                <li>Improved element detection</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">How it works</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The extension injects a content script into the webpage,
                allowing direct access to the DOM. This bypasses cross-origin
                restrictions that normally prevent iframe interaction.
              </p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                Privacy Notice
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The extension only activates on websites you're providing
                feedback for. It doesn't collect any personal data or track your
                browsing activity.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {!isExtensionDetected && (
            <Button
              type="button"
              variant="default"
              onClick={handleInstallClick}
              className="flex items-center"
            >
              <Puzzle className="h-4 w-4 mr-2" />
              Install Extension
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open("https://example.com/extension-help", "_blank")
            }
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Learn More
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ElementSelectionExtensionHelper;
