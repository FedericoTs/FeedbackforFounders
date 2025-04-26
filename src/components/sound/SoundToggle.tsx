import React from "react";
import { useSoundManager } from "./SoundManager";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SoundToggleProps {
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

const SoundToggle: React.FC<SoundToggleProps> = ({
  className,
  size = "icon",
  variant = "ghost",
}) => {
  const { settings, toggleMute } = useSoundManager();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={toggleMute}
            aria-label={settings.muted ? "Unmute sounds" : "Mute sounds"}
          >
            {settings.muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{settings.muted ? "Unmute sounds" : "Mute sounds"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SoundToggle;
