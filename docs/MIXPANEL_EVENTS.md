# Centro de Carreiras - Mixpanel Analytics Events

This document describes all analytics events tracked in the Centro de Carreiras platform.

---

## Authentication Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Login Started` | User clicks "Entrar" button on login form | `auth_provider: "email"` |
| `Login Completed` | Successful login (email/password or Google) | `auth_provider`, `role` |
| `Login Error` | Failed login attempt | `auth_provider`, `error_code` |
| `Sign Up Started` | User clicks "Cadastrar" button on signup form | `auth_provider: "email"`, `role` |
| `Sign Up Completed` | Successful account creation | `auth_provider`, `role` |
| `Sign Up Error` | Failed signup attempt | `auth_provider`, `error_code` |
| `Google Auth Started` | User clicks "Entrar com Google" button | - |
| `Google Auth Completed` | Google OAuth flow completes | `is_new_user`, `role` |
| `Google Auth Error` | Google OAuth fails | `error_code` |
| `Role Selected` | User selects role in modal after Google signup | `role`, `auth_provider: "google"` |
| `Role Modal Opened` | Role selection modal appears | `user_email` |
| `Magic Link Sent` | User requests passwordless login link | `role` |
| `Magic Link Verified` | User signs in via magic link | `role` |
| `Magic Link Error` | Magic link verification fails | `error_code`, `error_message` |
| `Password Reset Requested` | User requests password reset email | `email` |
| `Password Reset Completed` | User successfully sets new password | `email` |
| `Logout` | User clicks logout button | `user_role`, `from_page` (optional) |

---

## Email Verification Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Verification Email Sent` | Verification email sent after signup | `role` |
| `Verification Email Resent` | User clicks "Reenviar email" | `user_id` |
| `Verification Email Resend Error` | Resend fails | `user_id`, `error` |
| `Verification Token Success` | Email link clicked and validated | `email`, `role` |
| `Verification Token Error` | Token invalid or expired | `error` |
| `Verification Token Missing` | User visits verify page without token | - |
| `Pending Verification Viewed` | User sees pending verification page | `user_id` |

---

## Page View Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Page Viewed` | Generic page view | `page_name`, `url`, `from_mode`, `to_mode` |
| `Auth Page Viewed` | User lands on /auth | `initial_mode` |
| `Verify Email Viewed` | User lands on /auth/verify | - |
| `Estudante Dashboard Viewed` | Student views dashboard | - |
| `Mentor Dashboard Viewed` | Mentor views dashboard | - |
| `Mentors List Viewed` | Student views mentor list | - |
| `My Sessions Viewed` | User views sessions page | - |
| `Pending Approval Viewed` | User sees pending approval page | `user_role` |
| `Admin Approvals Viewed` | Admin views approvals page | - |

---

## Navigation Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Navigation Clicked` | User clicks sidebar menu item | `destination`, `destination_path`, `user_role` |
| `Quick Access Clicked` | User clicks quick action on dashboard | `action`, `user_role` |

---

## Mentor Browsing Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Mentors Viewed` | Mentor list loads | `results_count` |
| `Mentor Search` | User types in search box | `query`, `results_count` |
| `Mentor Profile Viewed` | User opens mentor drawer | `mentor_id`, `mentor_name`, `mentor_company` |
| `Mentor Drawer Opened` | Drawer opens | `mentor_id`, `mentor_name` |
| `Mentor Drawer Closed` | Drawer closes | `mentor_id` |
| `LinkedIn Clicked` | User clicks LinkedIn link | `mentor_id`, `mentor_name` |
| `Book Session Clicked` | User clicks "Agendar Mentoria" | `mentor_id`, `mentor_name`, `mentor_company` |

---

## Session & Booking Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Booking Modal Opened` | Booking modal appears | `mentor_id`, `mentor_name`, `mentor_company` |
| `Booking Modal Closed` | User closes modal | `mentor_id`, `submit_state` |
| `Session Requested` | User submits booking | `mentor_id`, `mentor_name`, `mentor_company` |
| `Session Request Success` | Booking succeeds | `mentor_id`, `mentor_name` |
| `Session Request Error` | Booking fails | `mentor_id`, `mentor_name`, `error` |
| `View My Sessions Clicked` | User clicks after booking | `from`, `mentor_id` |
| `Session Filter Applied` | User filters sessions | `filter_status`, `previous_status` |

---

## Admin Events

| Event Name | Trigger | Properties |
|------------|---------|------------|
| `Admin Filter Changed` | Admin changes filter | `filter_type`, `filter_value` |
| `User Approved` | Admin approves user | `approved_user_id`, `approved_user_role` |
| `User Rejected` | Admin rejects user | `rejected_user_id`, `rejected_user_role` |
| `Admin Action Error` | Admin action fails | `action`, `error` |

---

## User Identification

When a user logs in, we identify them in Mixpanel with:

```javascript
analytics.identify(userId, {
  email: profile.email,
  role: profile.role,
  authProvider: profile.authProvider,
  displayName: profile.displayName,
});
```

On logout, we call `analytics.reset()` to clear the user identity.

---

## Events Not Yet Implemented

The following events are defined but not currently tracked:

- `Booking Message Edited` - When user edits the booking message
- `Session Card Clicked` - When user clicks on a session card
- `Back Button Clicked` - Browser back navigation
- `Mentor Filter Applied` - When user applies filters on mentor list
- `Form Validation Error` - Client-side form validation errors
- `Page Load Error` - Page fails to load
- `Profile Updated` - User updates their profile
- `Profile Update Error` - Profile update fails

---

## Implementation Notes

- All events include an automatic `timestamp` property
- Events are only tracked if the Mixpanel token is configured
- In development mode, Mixpanel runs in debug mode for easier testing
- User properties are persisted in localStorage

---

*Last updated: February 2026*
