import React from "react";
import SoundSettings from "@/components/sound/SoundSettings";
import { Button } from "@/components/ui/button";
import { Volume2, Play } from "lucide-react";
import { useSoundManager } from "@/components/sound/SoundManager";

const SoundSettingsPage: React.FC = () => {
  const { playSound } = useSoundManager();

  const handleTestSound = (soundId: string) => {
    playSound(soundId);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-2">Sound Settings</h1>
      <p className="text-slate-600 mb-6">
        Customize your sound experience in the FeedbackLoop platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SoundSettings />
        </div>

        <div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Test Sounds</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Click the buttons below to test different sound effects.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTestSound("notification")}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Notification Sound
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTestSound("achievement")}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Achievement Sound
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTestSound("level-up")}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Level Up Sound
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTestSound("streak")}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Streak Sound
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleTestSound("feedback")}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Feedback Sound
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSettingsPage;
