import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SoundSettings from "@/components/sound/SoundSettings";
import { useSoundManager } from "@/components/sound/SoundManager";
import { useAuth } from "@/supabase/auth";

const SoundSettingsSyncDemo: React.FC = () => {
  const { user } = useAuth();
  const { settings, playSound } = useSoundManager();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Simulate sync status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        setLastSynced(new Date());
        setSyncStatus("Settings synchronized successfully");
        setTimeout(() => setSyncStatus(null), 3000);
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleTestSound = (soundId: string) => {
    playSound(soundId);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Sound Settings Sync Demo</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          About This Demo
        </h2>
        <p className="text-blue-700">
          This demo showcases how sound settings are synchronized across devices
          using the database. Settings are stored in the{" "}
          <code>user_preferences</code> table with type <code>SOUND</code>.
        </p>
        {user ? (
          <p className="mt-2 text-blue-700">
            You are logged in as {user.email}. Your settings will be
            synchronized.
            {lastSynced && (
              <span className="block text-sm mt-1">
                Last synced: {lastSynced.toLocaleTimeString()}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-2 text-amber-700">
            You are not logged in. Settings will only be saved locally.
          </p>
        )}
        {syncStatus && (
          <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
            {syncStatus}
          </div>
        )}
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mb-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test Sounds</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SoundSettings />
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Sound Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleTestSound("notification")}
                >
                  Notification Sound
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTestSound("achievement")}
                >
                  Achievement Sound
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTestSound("level-up")}
                >
                  Level Up Sound
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTestSound("streak")}
                >
                  Streak Sound
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleTestSound("feedback")}
                >
                  Feedback Sound
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SoundSettingsSyncDemo;
