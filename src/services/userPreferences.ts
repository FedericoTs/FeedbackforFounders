/**
 * User Preferences Service
 *
 * Service for managing user preferences in the database, with local storage fallback
 */

import { supabase } from "../../supabase/supabase";
import { requestCache } from "@/utils/requestCache";

// Define preference types
export enum PreferenceType {
  SOUND = "sound",
  THEME = "theme",
  NOTIFICATIONS = "notifications",
  DASHBOARD = "dashboard",
}

// Define sound settings interface
export interface SoundSettings {
  masterVolume: number;
  categoryVolumes: Record<string, number>;
  muted: boolean;
  soundEnabled: boolean;
}

export const userPreferencesService = {
  /**
   * Get user preferences from the database
   */
  async getUserPreference<T>(
    userId: string,
    preferenceType: PreferenceType,
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cacheKey = `user-preference:${userId}:${preferenceType}`;
      const cachedData = requestCache.get<T>(cacheKey);
      if (cachedData) return cachedData;

      // If not in cache, get from database
      const { data, error } = await supabase
        .from("user_preferences")
        .select("preference_data")
        .eq("user_id", userId)
        .eq("preference_type", preferenceType)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No data found, not an error
          return null;
        }
        console.error(`Error fetching ${preferenceType} preferences:`, error);
        return null;
      }

      // Cache the result
      if (data) {
        requestCache.set(cacheKey, data.preference_data as T);
        return data.preference_data as T;
      }

      return null;
    } catch (err) {
      console.error(`Error in getUserPreference (${preferenceType}):`, err);
      return null;
    }
  },

  /**
   * Save user preferences to the database
   */
  async saveUserPreference<T>(
    userId: string,
    preferenceType: PreferenceType,
    preferenceData: T,
  ): Promise<boolean> {
    try {
      // Update cache immediately for responsive UI
      const cacheKey = `user-preference:${userId}:${preferenceType}`;
      requestCache.set(cacheKey, preferenceData);

      // Upsert to database
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          preference_type: preferenceType,
          preference_data: preferenceData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, preference_type" },
      );

      if (error) {
        console.error(`Error saving ${preferenceType} preferences:`, error);
        return false;
      }

      return true;
    } catch (err) {
      console.error(`Error in saveUserPreference (${preferenceType}):`, err);
      return false;
    }
  },

  /**
   * Subscribe to changes in user preferences
   */
  subscribeToPreferenceChanges(
    userId: string,
    preferenceType: PreferenceType,
    callback: (data: any) => void,
  ) {
    const subscription = supabase
      .channel(`user_preferences_${userId}_${preferenceType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_preferences",
          filter: `user_id=eq.${userId} AND preference_type=eq.${preferenceType}`,
        },
        (payload) => {
          // Invalidate cache
          const cacheKey = `user-preference:${userId}:${preferenceType}`;
          requestCache.delete(cacheKey);

          // Call callback with new data
          if (payload.new) {
            callback(payload.new.preference_data);
          }
        },
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  },
};
