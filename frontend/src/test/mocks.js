import { vi } from 'vitest'

// Mock user profiles
export const mockStudentProfile = {
  uid: 'student-123',
  email: 'student@dac.unicamp.br',
  displayName: 'Test Student',
  role: 'estudante',
  status: 'active',
}

export const mockMentorProfile = {
  uid: 'mentor-456',
  email: 'mentor@company.com',
  displayName: 'Test Mentor',
  role: 'mentor',
  status: 'active',
}

// Mock mentor data (complete)
export const mockMentorComplete = {
  id: 'mentor-456',
  name: 'Maria Silva',
  email: 'maria.silva@company.com',
  title: 'Senior Engineer',
  company: 'Tech Corp',
  bio: 'Experienced engineer with 10+ years in the industry.',
  photoURL: 'https://example.com/photo.jpg',
  tags: ['technology', 'engineering'],
  expertise: ['career guidance', 'technical interviews'],
  linkedin: 'https://linkedin.com/in/mariasilva',
  course: 'Computer Science',
}

// Mock mentor data (missing email - simulates the bug we fixed)
export const mockMentorMissingEmail = {
  id: 'mentor-789',
  name: 'John Doe',
  email: '', // Missing email
  title: 'Manager',
  company: 'Big Corp',
  bio: 'Manager with experience.',
  photoURL: null,
  tags: ['business'],
  expertise: ['management'],
  linkedin: '',
  course: 'Business',
}

// Mock mentor data (missing multiple fields)
export const mockMentorIncomplete = {
  id: 'mentor-999',
  name: 'Incomplete Mentor',
  // email missing
  // company missing
  title: 'Title Only',
}

// Mock session response
export const mockSessionResponse = {
  id: 'session-abc123',
  student_uid: 'student-123',
  student_name: 'Test Student',
  student_email: 'student@dac.unicamp.br',
  mentor_id: 'mentor-456',
  mentor_name: 'Maria Silva',
  mentor_email: 'maria.silva@company.com',
  mentor_company: 'Tech Corp',
  message: 'Hello, I would like to schedule a mentorship session.',
  status: 'pending',
  created_at: '2026-02-23T10:00:00Z',
  updated_at: '2026-02-23T10:00:00Z',
}

// Mock analytics
export const mockAnalytics = {
  track: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  setUserProperties: vi.fn(),
  trackPageView: vi.fn(),
  trackClick: vi.fn(),
  trackError: vi.fn(),
  EVENTS: {
    BOOKING_MODAL_OPENED: 'Booking Modal Opened',
    BOOKING_MODAL_CLOSED: 'Booking Modal Closed',
    SESSION_REQUESTED: 'Session Requested',
    SESSION_REQUEST_SUCCESS: 'Session Request Success',
    SESSION_REQUEST_ERROR: 'Session Request Error',
    FORM_VALIDATION_ERROR: 'Form Validation Error',
    VIEW_MY_SESSIONS_CLICKED: 'View My Sessions Clicked',
  },
}

// Mock session service
export const createMockSessionService = (overrides = {}) => ({
  createSession: vi.fn().mockResolvedValue(mockSessionResponse),
  getMySessions: vi.fn().mockResolvedValue({ sessions: [], total: 0 }),
  getSession: vi.fn().mockResolvedValue(mockSessionResponse),
  ...overrides,
})

// Mock AuthContext value
export const createMockAuthContext = (overrides = {}) => ({
  user: { uid: 'student-123', email: 'student@dac.unicamp.br' },
  userProfile: mockStudentProfile,
  loading: false,
  isAdmin: false,
  logout: vi.fn(),
  ...overrides,
})

// Create API error response (FastAPI validation error format)
export const createValidationError = (errors) => ({
  response: {
    status: 422,
    data: {
      detail: errors.map(err => ({
        type: 'missing',
        loc: ['body', err.field],
        msg: err.message,
        input: err.input || null,
      })),
    },
  },
})

// Create API error response (standard format)
export const createApiError = (status, message) => ({
  response: {
    status,
    data: {
      detail: message,
    },
  },
})
