// lib/analytics.ts

declare global {
    interface Window {
      gtag: (
        command: 'event',
        action: string,
        params: {
          event_category?: string;
          event_label?: string;
          value?: number;
          [key: string]: any;
        }
      ) => void;
    }
}
  
/**
 * Tracks a custom event with Google Analytics.
 * This function is designed to capture user actions for academic research,
 * using a clear structure for analysis.
 *
 * @param {string} action - The specific action the user took (e.g., 'Generate Ideas', 'Select Item'). This is the primary verb.
 * @param {string} category - The high-level section of the application where the action occurred (e.g., 'Day 1 - Ideation', 'Authentication').
 * @param {string} [label] - (Optional) Provides additional context for the event (e.g., the title of a selected item, the chosen language).
 * @param {number} [value] - (Optional) A numerical value associated with the event (e.g., number of items generated).
 */
export const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    } else {
        console.warn('Google Analytics gtag function not found. Event was not tracked.');
    }
};
