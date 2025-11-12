import { useCallback } from "react";
import {
  scheduleSundayPostServiceReminder,
  scheduleComposerReminder,
  cancelNotification,
  cancelAllNotifications,
  areNotificationsEnabled,
  requestNotificationPermissions,
  NOTIFICATION_TYPES,
} from "./index";

/**
 * Hook for managing notifications
 * 
 * Provides hooks for scheduling reminders and wiring composer events.
 * Currently stubs - will be implemented when push notifications are integrated.
 */
export function useNotifications() {
  /**
   * Schedule a Sunday post-service reminder
   * Call this when user completes onboarding or enables reminders
   */
  const scheduleSundayReminder = useCallback(async (options = {}) => {
    try {
      const identifier = await scheduleSundayPostServiceReminder(options);
      return { success: true, identifier };
    } catch (error) {
      console.error("[useNotifications] Failed to schedule Sunday reminder", error);
      return { success: false, error };
    }
  }, []);

  /**
   * Schedule a composer reminder
   * Call this when user opens the ShareComposer
   */
  const scheduleComposerReminderNotification = useCallback(async (options = {}) => {
    try {
      const identifier = await scheduleComposerReminder(options);
      return { success: true, identifier };
    } catch (error) {
      console.error("[useNotifications] Failed to schedule composer reminder", error);
      return { success: false, error };
    }
  }, []);

  /**
   * Cancel a specific notification
   */
  const cancel = useCallback(async (identifier) => {
    try {
      await cancelNotification(identifier);
      return { success: true };
    } catch (error) {
      console.error("[useNotifications] Failed to cancel notification", error);
      return { success: false, error };
    }
  }, []);

  /**
   * Cancel all scheduled notifications
   */
  const cancelAll = useCallback(async () => {
    try {
      await cancelAllNotifications();
      return { success: true };
    } catch (error) {
      console.error("[useNotifications] Failed to cancel all notifications", error);
      return { success: false, error };
    }
  }, []);

  /**
   * Check if notifications are enabled
   */
  const checkEnabled = useCallback(async () => {
    try {
      return await areNotificationsEnabled();
    } catch (error) {
      console.error("[useNotifications] Failed to check notification status", error);
      return false;
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      return await requestNotificationPermissions();
    } catch (error) {
      console.error("[useNotifications] Failed to request permissions", error);
      return false;
    }
  }, []);

  return {
    scheduleSundayReminder,
    scheduleComposerReminderNotification,
    cancel,
    cancelAll,
    checkEnabled,
    requestPermissions,
    NOTIFICATION_TYPES,
  };
}

/**
 * Hook specifically for composer events
 * 
 * Use this in ShareComposer to wire notification reminders
 */
export function useComposerNotifications() {
  const { scheduleComposerReminderNotification, cancel } = useNotifications();

  /**
   * Call this when the composer is opened
   * Schedules a reminder to share if user doesn't complete the action
   */
  const onComposerOpened = useCallback(async () => {
    // Cancel any existing composer reminder first
    // TODO: Track composer reminder identifiers in state/context
    // For now, this is a placeholder
    
    // Schedule new reminder (e.g., 1 hour after opening)
    const result = await scheduleComposerReminderNotification({ delayMinutes: 60 });
    return result;
  }, [scheduleComposerReminderNotification]);

  /**
   * Call this when the composer is closed/completed
   * Cancels any pending composer reminders
   */
  const onComposerCompleted = useCallback(async (identifier) => {
    if (identifier) {
      await cancel(identifier);
    }
    // TODO: Cancel all composer reminders if identifier not provided
  }, [cancel]);

  /**
   * Call this when user shares from composer
   * Cancels any pending reminders since action was completed
   */
  const onComposerShared = useCallback(async (identifier) => {
    if (identifier) {
      await cancel(identifier);
    }
  }, [cancel]);

  return {
    onComposerOpened,
    onComposerCompleted,
    onComposerShared,
  };
}

