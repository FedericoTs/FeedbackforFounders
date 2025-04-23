import { supabase } from "../../supabase/supabase";

export enum NotificationType {
  FEEDBACK = "feedback",
  PROJECT = "project",
  REWARD = "reward",
  ACHIEVEMENT = "achievement",
  SYSTEM = "system",
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  feedback: boolean;
  project: boolean;
  reward: boolean;
  achievement: boolean;
  system: boolean;
  email_notifications: boolean;
}

export const notificationsService = {
  /**
   * Get notifications for the current user
   */
  async getNotifications(
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {},
  ): Promise<{ data: Notification[]; count: number }> {
    try {
      const { limit = 10, offset = 0, unreadOnly = false } = options;

      // Get the total count
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq(unreadOnly ? "is_read" : "id", unreadOnly ? false : "id");

      if (countError) {
        console.error("Error getting notifications count:", countError);
        return { data: [], count: 0 };
      }

      // Get the notifications
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error getting notifications:", error);
        return { data: [], count: 0 };
      }

      return { data: data as Notification[], count: count || 0 };
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return { data: [], count: 0 };
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) {
        console.error("Error getting unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getUnreadCount:", error);
      return 0;
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return false;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc("mark_all_notifications_as_read");

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteNotification:", error);
      return false;
    }
  },

  /**
   * Create a notification
   */
  async createNotification(notification: {
    type: NotificationType;
    title: string;
    content?: string;
    link?: string;
  }): Promise<Notification | null> {
    try {
      const { data, error } = await supabase.rpc("create_notification", {
        p_type: notification.type,
        p_title: notification.title,
        p_content: notification.content || null,
        p_link: notification.link || null,
      });

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      return data as Notification;
    } catch (error) {
      console.error("Error in createNotification:", error);
      return null;
    }
  },

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(callback: (notification: Notification) => void) {
    const user = supabase.auth.getUser();
    if (!user) return { unsubscribe: () => {} };

    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const notification = payload.new as Notification;
          callback(notification);
        },
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      },
    };
  },

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("notification_preferences")
        .single();

      if (error) {
        console.error("Error getting notification preferences:", error);
        return {
          feedback: true,
          project: true,
          reward: true,
          achievement: true,
          system: true,
          email_notifications: true,
        };
      }

      return (
        data?.notification_preferences || {
          feedback: true,
          project: true,
          reward: true,
          achievement: true,
          system: true,
          email_notifications: true,
        }
      );
    } catch (error) {
      console.error("Error in getNotificationPreferences:", error);
      return {
        feedback: true,
        project: true,
        reward: true,
        achievement: true,
        system: true,
        email_notifications: true,
      };
    }
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<boolean> {
    try {
      // First get current preferences
      const currentPrefs = await this.getNotificationPreferences();

      // Merge with new preferences
      const updatedPrefs = { ...currentPrefs, ...preferences };

      const { error } = await supabase
        .from("user_profiles")
        .update({ notification_preferences: updatedPrefs })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error("Error updating notification preferences:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateNotificationPreferences:", error);
      return false;
    }
  },
};
