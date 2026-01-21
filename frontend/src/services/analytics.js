/**
 * Mixpanel Analytics Service
 * Centralized analytics tracking for Centro de Carreiras
 */

import mixpanel from 'mixpanel-browser';

// Event name constants for consistency
export const EVENTS = {
  // Authentication events
  SIGN_UP_STARTED: 'Sign Up Started',
  SIGN_UP_COMPLETED: 'Sign Up Completed',
  LOGIN_STARTED: 'Login Started',
  LOGIN_COMPLETED: 'Login Completed',
  GOOGLE_AUTH_STARTED: 'Google Auth Started',
  ROLE_SELECTED: 'Role Selected',
  MAGIC_LINK_SENT: 'Magic Link Sent',
  MAGIC_LINK_VERIFIED: 'Magic Link Verified',
  LOGOUT: 'Logout',

  // Mentor browsing events
  MENTORS_VIEWED: 'Mentors Viewed',
  MENTOR_SEARCH: 'Mentor Search',
  MENTOR_PROFILE_VIEWED: 'Mentor Profile Viewed',
  LINKEDIN_CLICKED: 'LinkedIn Clicked',
  BOOK_SESSION_CLICKED: 'Book Session Clicked',

  // Session events
  SESSION_REQUESTED: 'Session Requested',
};

// Initialize Mixpanel
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

let isInitialized = false;

if (MIXPANEL_TOKEN) {
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: true,
    persistence: 'localStorage',
  });
  isInitialized = true;
} else {
  console.warn('Mixpanel token not found. Analytics will be disabled.');
}

/**
 * Identify user for tracking
 * @param {string} userId - User's unique ID (Firebase UID)
 * @param {Object} userProperties - Additional user properties
 */
export function identify(userId, userProperties = {}) {
  if (!isInitialized) return;

  mixpanel.identify(userId);

  if (Object.keys(userProperties).length > 0) {
    mixpanel.people.set(userProperties);
  }
}

/**
 * Track an event
 * @param {string} eventName - Name of the event (use EVENTS constants)
 * @param {Object} properties - Event properties
 */
export function track(eventName, properties = {}) {
  if (!isInitialized) return;

  mixpanel.track(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Reset user identity (call on logout)
 */
export function reset() {
  if (!isInitialized) return;

  mixpanel.reset();
}

/**
 * Set user properties
 * @param {Object} properties - User properties to set
 */
export function setUserProperties(properties) {
  if (!isInitialized) return;

  mixpanel.people.set(properties);
}

// Export default object for convenience
const analytics = {
  identify,
  track,
  reset,
  setUserProperties,
  EVENTS,
};

export default analytics;
