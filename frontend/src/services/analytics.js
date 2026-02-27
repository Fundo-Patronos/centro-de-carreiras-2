/**
 * Mixpanel Analytics Service
 * Centralized analytics tracking for Centro de Carreiras
 */

import mixpanel from 'mixpanel-browser';

// Event name constants for consistency
export const EVENTS = {
  // ============================================
  // AUTHENTICATION EVENTS
  // ============================================
  SIGN_UP_STARTED: 'Sign Up Started',
  SIGN_UP_COMPLETED: 'Sign Up Completed',
  SIGN_UP_ERROR: 'Sign Up Error',
  LOGIN_STARTED: 'Login Started',
  LOGIN_COMPLETED: 'Login Completed',
  LOGIN_ERROR: 'Login Error',
  GOOGLE_AUTH_STARTED: 'Google Auth Started',
  GOOGLE_AUTH_COMPLETED: 'Google Auth Completed',
  GOOGLE_AUTH_ERROR: 'Google Auth Error',
  ROLE_SELECTED: 'Role Selected',
  ROLE_MODAL_OPENED: 'Role Modal Opened',
  MAGIC_LINK_SENT: 'Magic Link Sent',
  MAGIC_LINK_VERIFIED: 'Magic Link Verified',
  MAGIC_LINK_ERROR: 'Magic Link Error',
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  PASSWORD_RESET_COMPLETED: 'Password Reset Completed',
  PASSWORD_CHANGE_STARTED: 'Password Change Started',
  PASSWORD_CHANGE_COMPLETED: 'Password Change Completed',
  PASSWORD_CHANGE_ERROR: 'Password Change Error',
  LOGOUT: 'Logout',

  // ============================================
  // EMAIL VERIFICATION EVENTS
  // ============================================
  VERIFICATION_EMAIL_SENT: 'Verification Email Sent',
  VERIFICATION_EMAIL_RESENT: 'Verification Email Resent',
  VERIFICATION_EMAIL_RESEND_ERROR: 'Verification Email Resend Error',
  VERIFICATION_TOKEN_SUCCESS: 'Verification Token Success',
  VERIFICATION_TOKEN_ERROR: 'Verification Token Error',
  VERIFICATION_TOKEN_MISSING: 'Verification Token Missing',
  PENDING_VERIFICATION_VIEWED: 'Pending Verification Viewed',

  // ============================================
  // PAGE VIEW EVENTS
  // ============================================
  PAGE_VIEWED: 'Page Viewed',
  AUTH_PAGE_VIEWED: 'Auth Page Viewed',
  ESTUDANTE_DASHBOARD_VIEWED: 'Estudante Dashboard Viewed',
  MENTOR_DASHBOARD_VIEWED: 'Mentor Dashboard Viewed',
  MENTORS_LIST_VIEWED: 'Mentors List Viewed',
  MY_SESSIONS_VIEWED: 'My Sessions Viewed',
  PENDING_APPROVAL_VIEWED: 'Pending Approval Viewed',
  ADMIN_APPROVALS_VIEWED: 'Admin Approvals Viewed',
  VERIFY_EMAIL_VIEWED: 'Verify Email Viewed',

  // ============================================
  // NAVIGATION EVENTS
  // ============================================
  NAVIGATION_CLICKED: 'Navigation Clicked',
  QUICK_ACCESS_CLICKED: 'Quick Access Clicked',
  BACK_BUTTON_CLICKED: 'Back Button Clicked',

  // ============================================
  // MENTOR BROWSING EVENTS
  // ============================================
  MENTORS_VIEWED: 'Mentors Viewed',
  MENTOR_SEARCH: 'Mentor Search',
  MENTOR_FILTER_APPLIED: 'Mentor Filter Applied',
  MENTOR_PROFILE_VIEWED: 'Mentor Profile Viewed',
  MENTOR_DRAWER_OPENED: 'Mentor Drawer Opened',
  MENTOR_DRAWER_CLOSED: 'Mentor Drawer Closed',
  LINKEDIN_CLICKED: 'LinkedIn Clicked',
  BOOK_SESSION_CLICKED: 'Book Session Clicked',

  // ============================================
  // SESSION/BOOKING EVENTS
  // ============================================
  BOOKING_MODAL_OPENED: 'Booking Modal Opened',
  BOOKING_MODAL_CLOSED: 'Booking Modal Closed',
  BOOKING_MESSAGE_EDITED: 'Booking Message Edited',
  SESSION_REQUESTED: 'Session Requested',
  SESSION_REQUEST_SUCCESS: 'Session Request Success',
  SESSION_REQUEST_ERROR: 'Session Request Error',
  VIEW_MY_SESSIONS_CLICKED: 'View My Sessions Clicked',
  SESSION_FILTER_APPLIED: 'Session Filter Applied',
  SESSION_CARD_CLICKED: 'Session Card Clicked',
  SESSION_STATUS_UPDATED: 'Session Status Updated',
  SESSION_FEEDBACK_SUBMITTED: 'Session Feedback Submitted',
  SESSION_EMAIL_RESENT: 'Session Email Resent',
  RESEND_EMAIL_MODAL_OPENED: 'Resend Email Modal Opened',
  RESEND_EMAIL_MODAL_CLOSED: 'Resend Email Modal Closed',
  FEEDBACK_MODAL_OPENED: 'Feedback Modal Opened',
  FEEDBACK_MODAL_CLOSED: 'Feedback Modal Closed',
  SESSION_COMPLETED_WITH_FEEDBACK: 'Session Completed With Feedback',
  SESSION_COMPLETION_MODAL_OPENED: 'Session Completion Modal Opened',

  // ============================================
  // ADMIN EVENTS
  // ============================================
  ADMIN_FILTER_CHANGED: 'Admin Filter Changed',
  USER_APPROVED: 'User Approved',
  USER_REJECTED: 'User Rejected',
  ADMIN_ACTION_ERROR: 'Admin Action Error',
  PENDING_MENTOR_VIEWED: 'Pending Mentor Viewed',

  // ============================================
  // ERROR EVENTS
  // ============================================
  API_ERROR: 'API Error',
  API_RETRY: 'API Retry',
  FORM_VALIDATION_ERROR: 'Form Validation Error',
  PAGE_LOAD_ERROR: 'Page Load Error',

  // ============================================
  // USER PROFILE EVENTS
  // ============================================
  PROFILE_UPDATED: 'Profile Updated',
  PROFILE_UPDATE_ERROR: 'Profile Update Error',

  // ============================================
  // MENTOR PROFILE EVENTS
  // ============================================
  MENTOR_PROFILE_PAGE_VIEWED: 'Mentor Profile Page Viewed',
  MENTOR_PROFILE_SAVED: 'Mentor Profile Saved',
  MENTOR_PROFILE_SAVE_ERROR: 'Mentor Profile Save Error',
  MENTOR_PHOTO_UPLOADED: 'Mentor Photo Uploaded',
  MENTOR_PHOTO_UPLOAD_ERROR: 'Mentor Photo Upload Error',
};

// Initialize Mixpanel
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

let isInitialized = false;
let currentUserEmail = null;

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

  // Store email for inclusion in all future events
  if (userProperties.email) {
    currentUserEmail = userProperties.email;
  }

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
    // Automatically include email if available and not already provided
    ...(currentUserEmail && !properties.email ? { email: currentUserEmail } : {}),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Reset user identity (call on logout)
 */
export function reset() {
  if (!isInitialized) return;

  currentUserEmail = null;
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

/**
 * Track a page view
 * @param {string} pageName - Name of the page
 * @param {Object} properties - Additional page properties
 */
export function trackPageView(pageName, properties = {}) {
  if (!isInitialized) return;

  mixpanel.track(EVENTS.PAGE_VIEWED, {
    page_name: pageName,
    url: window.location.pathname,
    ...properties,
    ...(currentUserEmail && !properties.email ? { email: currentUserEmail } : {}),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a button click
 * @param {string} buttonName - Name/label of the button
 * @param {Object} properties - Additional properties
 */
export function trackClick(buttonName, properties = {}) {
  if (!isInitialized) return;

  mixpanel.track('Button Clicked', {
    button_name: buttonName,
    page: window.location.pathname,
    ...properties,
    ...(currentUserEmail && !properties.email ? { email: currentUserEmail } : {}),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track an error
 * @param {string} errorType - Type of error (API, form, etc.)
 * @param {Object} properties - Error details
 */
export function trackError(errorType, properties = {}) {
  if (!isInitialized) return;

  mixpanel.track(EVENTS.API_ERROR, {
    error_type: errorType,
    page: window.location.pathname,
    ...properties,
    ...(currentUserEmail && !properties.email ? { email: currentUserEmail } : {}),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get the current user email (useful for manual inclusion in events before identify)
 * @returns {string|null} Current user email or null
 */
export function getCurrentUserEmail() {
  return currentUserEmail;
}

/**
 * Set user email manually (useful for pre-auth events like login/signup)
 * @param {string} email - User email address
 */
export function setCurrentUserEmail(email) {
  currentUserEmail = email;
}

// Export default object for convenience
const analytics = {
  identify,
  track,
  reset,
  setUserProperties,
  trackPageView,
  trackClick,
  trackError,
  getCurrentUserEmail,
  setCurrentUserEmail,
  EVENTS,
};

export default analytics;
