import React, { useState } from "react";
import { useAwardToast } from "@/hooks/useAwardToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Award, Star, Zap, Trophy, MessageSquare, Volume2 } from "lucide-react";
import RewardHistoryPanel from "./RewardHistoryPanel";

export const RewardNotificationDemo: React.FC = () => {
  const { showAwardToast, clearToasts } = useAwardToast();
  const [title, setTitle] = useState("Points Awarded!");
  const [description, setDescription] = useState(
    "Great job on your contribution!",
  );
  const [points, setPoints] = useState(10);
  const [variant, setVariant] = useState<
    "default" | "achievement" | "streak" | "level" | "feedback"
  >("default");
  const [context, setContext] = useState("");
  const [playSound, setPlaySound] = useState(true);
  const [priority, setPriority] = useState(0);
  const [queueMultiple, setQueueMultiple] = useState(false);

  const handleShowToast = () => {
    const metadata: Record<string, any> = {};
    if (context) metadata.context = context;

    showAwardToast({
      title,
      description,
      points,
      variant,
      metadata,
      sound: playSound,
      priority,
    });
  };

  const handleShowMultiple = () => {
    // Show multiple toasts with different variants
    const toasts = [
      {
        title: "Daily Login Streak!",
        description: "You've logged in for 5 consecutive days",
        points: 25,
        variant: "streak" as const,
        priority: 15,
      },
      {
        title: "Quality Feedback",
        description: "Your feedback was rated as highly valuable",
        points: 15,
        variant: "feedback" as const,
        priority: 10,
      },
      {
        title: "Points Awarded",
        description: "You earned points for project creation",
        points: 20,
        variant: "default" as const,
        priority: 5,
      },
    ];

    // Show toasts with a slight delay between them if not queueing
    if (!queueMultiple) {
      toasts.forEach((toast, index) => {
        setTimeout(() => {
          showAwardToast(toast);
        }, index * 300);
      });
    } else {
      // Show all at once to demonstrate queueing
      toasts.forEach((toast) => showAwardToast(toast));
    }
  };

  const handleShowAchievement = () => {
    showAwardToast({
      title: "Achievement Unlocked!",
      description: "Feedback Master: Provided 10 pieces of quality feedback",
      points: 50,
      variant: "achievement",
      metadata: {
        context:
          "You've reached a significant milestone in providing valuable feedback to others!",
        achievementId: "feedback-master-10",
      },
      priority: 30,
    });
  };

  const handleShowLevelUp = () => {
    showAwardToast({
      title: "Level Up!",
      description: "You've reached Level 5",
      points: 100,
      variant: "level",
      metadata: {
        context: "New feature unlocked: Custom project templates",
        oldLevel: 4,
        newLevel: 5,
      },
      priority: 25,
    });
  };

  const getVariantIcon = () => {
    switch (variant) {
      case "achievement":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "streak":
        return <Star className="h-5 w-5 text-blue-500" />;
      case "level":
        return <Award className="h-5 w-5 text-purple-500" />;
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Zap className="h-5 w-5 text-teal-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-white">
      <h1 className="text-3xl font-bold mb-8">Reward Notification System</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="custom">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="custom">Custom Reward</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="multiple">Multiple</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getVariantIcon()}
                    <span>Custom Reward Notification</span>
                  </CardTitle>
                  <CardDescription>
                    Create and test a custom reward notification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Reward Title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="variant">Reward Type</Label>
                        <Select
                          value={variant}
                          onValueChange={(value: any) => setVariant(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Points</SelectItem>
                            <SelectItem value="achievement">
                              Achievement
                            </SelectItem>
                            <SelectItem value="streak">Streak</SelectItem>
                            <SelectItem value="level">Level Up</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Reward Description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="context">
                        Additional Context (optional)
                      </Label>
                      <Input
                        id="context"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Additional context or details"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="points">Points: {points}</Label>
                      <Slider
                        id="points"
                        min={1}
                        max={100}
                        step={1}
                        value={[points]}
                        onValueChange={(values) => setPoints(values[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority: {priority}</Label>
                      <Slider
                        id="priority"
                        min={0}
                        max={30}
                        step={1}
                        value={[priority]}
                        onValueChange={(values) => setPriority(values[0])}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sound"
                        checked={playSound}
                        onCheckedChange={setPlaySound}
                      />
                      <Label
                        htmlFor="sound"
                        className="flex items-center gap-1"
                      >
                        <Volume2 className="h-4 w-4" />
                        Play Sound
                      </Label>
                    </div>

                    <Button onClick={handleShowToast} className="w-full">
                      Show Reward Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="presets">
              <Card>
                <CardHeader>
                  <CardTitle>Preset Notifications</CardTitle>
                  <CardDescription>
                    Test predefined reward notification types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          Achievement
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 mb-4">
                          Special notification for unlocking achievements
                        </p>
                        <Button
                          onClick={handleShowAchievement}
                          variant="outline"
                          className="w-full"
                        >
                          Show Achievement
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-500" />
                          Level Up
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 mb-4">
                          Celebration notification for reaching a new level
                        </p>
                        <Button
                          onClick={handleShowLevelUp}
                          variant="outline"
                          className="w-full"
                        >
                          Show Level Up
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="multiple">
              <Card>
                <CardHeader>
                  <CardTitle>Multiple Notifications</CardTitle>
                  <CardDescription>
                    Test how multiple notifications are queued and displayed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="queue"
                        checked={queueMultiple}
                        onCheckedChange={setQueueMultiple}
                      />
                      <Label htmlFor="queue">
                        Send simultaneously (to test queueing)
                      </Label>
                    </div>

                    <p className="text-sm text-slate-500">
                      This will trigger multiple notifications with different
                      priorities.
                      {queueMultiple
                        ? " They will be sent simultaneously and queued based on priority."
                        : " They will be sent with a slight delay between them."}
                    </p>

                    <Button onClick={handleShowMultiple} className="w-full">
                      Show Multiple Notifications
                    </Button>

                    <div className="pt-4">
                      <Button
                        onClick={clearToasts}
                        variant="outline"
                        className="w-full"
                      >
                        Clear All Notifications
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how reward notifications behave
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      These settings would typically be saved to user
                      preferences. For this demo, they apply only to the current
                      session.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="sound-toggle"
                          className="flex items-center gap-1"
                        >
                          <Volume2 className="h-4 w-4" />
                          Sound Effects
                        </Label>
                        <Switch
                          id="sound-toggle"
                          checked={playSound}
                          onCheckedChange={setPlaySound}
                        />
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={clearToasts}
                          variant="outline"
                          className="w-full"
                        >
                          Clear Notification Queue
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <RewardHistoryPanel />
        </div>
      </div>
    </div>
  );
};

export default RewardNotificationDemo;
