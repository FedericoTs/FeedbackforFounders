import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, Mail, BellRing } from "lucide-react";
import { useAuth } from "@/supabase/auth";
import {
  NotificationCategory,
  notificationsService,
} from "@/services/notifications";

interface NotificationPreferencesProps {
  className?: string;
}

const NotificationPreferencesPanel: React.FC<NotificationPreferencesProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsService.getNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: any) => {
    if (!preferences) return;

    // Update local state immediately for responsive UI
    const updatedPreferences = { ...preferences };

    if (key.startsWith("categories.")) {
      const category = key.split(".")[1];
      updatedPreferences.categories = {
        ...updatedPreferences.categories,
        [category]: value,
      };
    } else {
      updatedPreferences[key] = value;
    }

    setPreferences(updatedPreferences);

    // Save to database
    setIsSaving(true);
    try {
      await notificationsService.updateNotificationPreferences(
        updatedPreferences,
      );
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      // Revert on error
      fetchPreferences();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-slate-500">Failed to load preferences</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchPreferences}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Delivery Methods</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-slate-500" />
              <Label htmlFor="in-app-notifications">In-app notifications</Label>
            </div>
            <Switch
              id="in-app-notifications"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                handleUpdatePreference("in_app_enabled", checked)
              }
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-500" />
              <Label htmlFor="email-notifications">Email notifications</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                handleUpdatePreference("email_enabled", checked)
              }
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Categories</h3>

          {Object.entries(preferences.categories).map(([category, enabled]) => (
            <div key={category} className="flex items-center justify-between">
              <Label htmlFor={`category-${category}`} className="capitalize">
                {category}
              </Label>
              <Switch
                id={`category-${category}`}
                checked={enabled as boolean}
                onCheckedChange={(checked) =>
                  handleUpdatePreference(`categories.${category}`, checked)
                }
                disabled={isSaving}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesPanel;
