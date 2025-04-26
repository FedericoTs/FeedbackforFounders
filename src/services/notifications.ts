import { supabase } from "../../supabase/supabase";

export enum NotificationType {
  FEEDBACK = "feedback",
  PROJECT = "project",
  REWARD = "reward",
  ACHIEVEMENT = "achievement",
  SYSTEM = "system",
}

export enum NotificationCategory {
  GENERAL = "general",
  ACTIVITY = "activity",
  COLLABORATION = "collaboration",
  GAMIFICATION = "gamification",
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
  category?: NotificationCategory;
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
      includeRead?: boolean;
      category?: NotificationCategory;
      type?: NotificationType;
      cursor?: string;
    } = {},
  ): Promise<{
    data: Notification[];
    metadata: { hasMore: boolean; nextCursor?: string };
  }> {
    try {
      const {
        limit = 10,
        offset = 0,
        unreadOnly = false,
        includeRead = true,
        category,
        type,
        cursor,
      } = options;

      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (unreadOnly) {
        query = query.eq("is_read", false);
      } else if (!includeRead) {
        query = query.eq("is_read", false);
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (type) {
        query = query.eq("type", type);
      }

      // Apply pagination
      if (cursor) {
        // Cursor-based pagination
        query = query.lt("created_at", cursor);
      } else {
        // Offset-based pagination
        query = query.range(offset, offset + limit - 1);
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error("Error getting notifications:", error);
        return { data: [], metadata: { hasMore: false } };
      }

      // Determine if there are more results
      const hasMore = (data?.length || 0) === limit;

      // Get the next cursor value from the last item
      let nextCursor: string | undefined;
      if (hasMore && data && data.length > 0) {
        const lastItem = data[data.length - 1];
        nextCursor = lastItem.created_at;
      }

      return {
        data: data || [],
        metadata: {
          hasMore,
          nextCursor,
        },
      };
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return { data: [], metadata: { hasMore: false } };
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
    category?: NotificationCategory;
  }): Promise<Notification | null> {
    try {
      const { data, error } = await supabase.rpc("create_notification", {
        p_type: notification.type,
        p_title: notification.title,
        p_content: notification.content || null,
        p_link: notification.link || null,
        p_category: notification.category || NotificationCategory.GENERAL,
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
