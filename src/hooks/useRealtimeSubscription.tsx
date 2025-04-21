import { useEffect, useState } from "react";
import { supabase } from "../../supabase/supabase";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type SubscriptionCallback = (
  payload: RealtimePostgresChangesPayload<any>,
) => void;

interface SubscriptionOptions {
  table: string;
  schema?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

/**
 * Hook for subscribing to Supabase realtime changes
 */
export function useRealtimeSubscription(
  options: SubscriptionOptions,
  callback: SubscriptionCallback,
): { isConnected: boolean } {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create a unique channel name based on the options
    const channelName = `${options.table}_${options.event || "*"}_${Date.now()}`;

    // Set up the subscription
    const newChannel = supabase.channel(channelName);

    // Configure the subscription
    const subscription = newChannel.on(
      "postgres_changes",
      {
        event: options.event || "*",
        schema: options.schema || "public",
        table: options.table,
        filter: options.filter,
      },
      (payload) => {
        callback(payload);
      },
    );

    // Subscribe to connection status changes
    subscription
      .on("system", { event: "connected" }, () => {
        console.log(`Connected to realtime channel: ${channelName}`);
        setIsConnected(true);
      })
      .on("system", { event: "disconnected" }, () => {
        console.log(`Disconnected from realtime channel: ${channelName}`);
        setIsConnected(false);
      });

    // Subscribe to the channel
    newChannel.subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
      setIsConnected(status === "SUBSCRIBED");
    });

    // Store the channel
    setChannel(newChannel);

    // Clean up the subscription when the component unmounts
    return () => {
      console.log(`Unsubscribing from realtime channel: ${channelName}`);
      newChannel.unsubscribe();
    };
  }, [options.table, options.schema, options.event, options.filter]);

  return { isConnected };
}

/**
 * Hook for subscribing to feedback changes
 */
export function useRealtimeFeedback(
  projectId: string,
  onFeedbackChange: (payload: RealtimePostgresChangesPayload<any>) => void,
): { isConnected: boolean } {
  return useRealtimeSubscription(
    {
      table: "feedback",
      filter: `project_id=eq.${projectId}`,
    },
    onFeedbackChange,
  );
}

/**
 * Hook for subscribing to feedback response changes
 */
export function useRealtimeFeedbackResponses(
  feedbackId: string,
  onResponseChange: (payload: RealtimePostgresChangesPayload<any>) => void,
): { isConnected: boolean } {
  return useRealtimeSubscription(
    {
      table: "feedback_response",
      filter: `feedback_id=eq.${feedbackId}`,
    },
    onResponseChange,
  );
}

/**
 * Hook for subscribing to notification changes
 */
export function useRealtimeNotifications(
  userId: string,
  onNotificationChange: (payload: RealtimePostgresChangesPayload<any>) => void,
): { isConnected: boolean } {
  return useRealtimeSubscription(
    {
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    },
    onNotificationChange,
  );
}
