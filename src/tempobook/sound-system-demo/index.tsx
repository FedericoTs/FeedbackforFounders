import React from "react";
import { SoundProvider } from "@/components/sound/SoundManager";
import SoundEffects from "@/components/sound/SoundEffects";
import SoundSettings from "@/components/sound/SoundSettings";
import SoundToggle from "@/components/sound/SoundToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SoundSystemDemo: React.FC = () => {
  const handlePlaySound = (soundId: string) => {
    // Create and dispatch a custom event to trigger sound playback
    const event = new CustomEvent("award:received", {
      detail: { variant: soundId, sound: true },
    });
    document.dispatchEvent(event);
  };

  return (
    <SoundProvider>
      <SoundEffects />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Sound System Demo</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <SoundSettings />
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Test Sounds
                  <SoundToggle className="ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">
                  Click the buttons below to test different sound effects.
                </p>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlaySound("notification")}
                >
                  Notification Sound
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlaySound("achievement")}
                >
                  Achievement Sound
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlaySound("level")}
                >
                  Level Up Sound
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlaySound("streak")}
                >
                  Streak Sound
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handlePlaySound("feedback")}
                >
                  Feedback Sound
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SoundProvider>
  );
};

export default SoundSystemDemo;
