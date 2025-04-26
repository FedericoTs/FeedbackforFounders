import React from "react";
import { useSoundManager } from "./SoundManager";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Volume2,
  VolumeX,
  Music,
  Bell,
  Trophy,
  MessageSquare,
} from "lucide-react";

interface SoundSettingsProps {
  className?: string;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ className }) => {
  const {
    settings,
    setMasterVolume,
    setCategoryVolume,
    toggleMute,
    toggleSoundEnabled,
  } = useSoundManager();

  const categoryIcons: Record<string, React.ReactNode> = {
    achievement: <Trophy className="h-4 w-4 text-amber-500" />,
    notification: <Bell className="h-4 w-4 text-blue-500" />,
    feedback: <MessageSquare className="h-4 w-4 text-teal-500" />,
    ui: <Music className="h-4 w-4 text-purple-500" />,
    background: <Music className="h-4 w-4 text-slate-500" />,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {settings.muted ? (
            <VolumeX className="h-5 w-5 text-slate-500" />
          ) : (
            <Volume2 className="h-5 w-5 text-teal-500" />
          )}
          Sound Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-enabled" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Enable Sounds
            </Label>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={toggleSoundEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound-muted" className="flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              Mute All Sounds
            </Label>
            <Switch
              id="sound-muted"
              checked={settings.muted}
              onCheckedChange={toggleMute}
              disabled={!settings.soundEnabled}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="master-volume" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Master Volume: {Math.round(settings.masterVolume * 100)}%
          </Label>
          <Slider
            id="master-volume"
            min={0}
            max={1}
            step={0.01}
            value={[settings.masterVolume]}
            onValueChange={(values) => setMasterVolume(values[0])}
            disabled={!settings.soundEnabled || settings.muted}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Category Volumes</h3>
          {Object.entries(settings.categoryVolumes).map(
            ([category, volume]) => (
              <div key={category} className="space-y-2">
                <Label
                  htmlFor={`volume-${category}`}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    {categoryIcons[category] || <Music className="h-4 w-4" />}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                  <span>{Math.round(volume * 100)}%</span>
                </Label>
                <Slider
                  id={`volume-${category}`}
                  min={0}
                  max={1}
                  step={0.01}
                  value={[volume]}
                  onValueChange={(values) =>
                    setCategoryVolume(category, values[0])
                  }
                  disabled={!settings.soundEnabled || settings.muted}
                />
              </div>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SoundSettings;
