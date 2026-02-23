import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BookingModal from './BookingModal'
import {
  mockMentorComplete,
  mockMentorMissingEmail,
  mockMentorIncomplete,
  mockStudentProfile,
  mockSessionResponse,
  createValidationError,
  createApiError,
} from '../../test/mocks'

// Mock the services
vi.mock('../../services/sessionService', () => ({
  default: {
    createSession: vi.fn(),
  },
}))

vi.mock('../../services/analytics', () => ({
  default: {
    track: vi.fn(),
  },
  EVENTS: {
    BOOKING_MODAL_OPENED: 'Booking Modal Opened',
    BOOKING_MODAL_CLOSED: 'Booking Modal Closed',
    SESSION_REQUESTED: 'Session Requested',
    SESSION_REQUEST_SUCCESS: 'Session Request Success',
    SESSION_REQUEST_ERROR: 'Session Request Error',
    FORM_VALIDATION_ERROR: 'Form Validation Error',
    VIEW_MY_SESSIONS_CLICKED: 'View My Sessions Clicked',
  },
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: mockStudentProfile,
  }),
}))

// Import mocked modules
import sessionService from '../../services/sessionService'
import analytics from '../../services/analytics'

const renderModal = (mentor, isOpen = true) => {
  const onClose = vi.fn()
  render(
    <BrowserRouter>
      <BookingModal mentor={mentor} isOpen={isOpen} onClose={onClose} />
    </BrowserRouter>
  )
  return { onClose }
}

describe('BookingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders modal with mentor information', () => {
      renderModal(mockMentorComplete)

      expect(screen.getByText('Agendar Mentoria')).toBeInTheDocument()
      expect(screen.getByText(mockMentorComplete.name)).toBeInTheDocument()
      expect(screen.getByText(`${mockMentorComplete.title} @ ${mockMentorComplete.company}`)).toBeInTheDocument()
    })

    it('does not render when mentor is null', () => {
      renderModal(null)

      expect(screen.queryByText('Agendar Mentoria')).not.toBeInTheDocument()
    })

    it('generates default message with student and mentor names', () => {
      renderModal(mockMentorComplete)

      const textarea = screen.getByRole('textbox')
      expect(textarea.value).toContain(`Ola ${mockMentorComplete.name}`)
      expect(textarea.value).toContain(mockStudentProfile.displayName)
    })
  })

  describe('validation', () => {
    it('disables submit button when message is empty', async () => {
      renderModal(mockMentorComplete)

      // Clear the default message
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '' } })

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      expect(submitButton).toBeDisabled()
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })

    it('shows error when message is only whitespace', async () => {
      renderModal(mockMentorComplete)

      // Set message to whitespace only
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '   ' } })

      // Submit button should still be disabled
      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      expect(submitButton).toBeDisabled()
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })

    it('shows error when mentor email is missing', async () => {
      renderModal(mockMentorMissingEmail)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/dados incompletos do mentor/i)).toBeInTheDocument()
        expect(screen.getByText(/email do mentor/i)).toBeInTheDocument()
      })

      expect(sessionService.createSession).not.toHaveBeenCalled()
      expect(analytics.track).toHaveBeenCalledWith(
        'Form Validation Error',
        expect.objectContaining({
          missing_fields: expect.arrayContaining(['email do mentor']),
          form: 'booking_modal',
        })
      )
    })

    it('shows error when multiple mentor fields are missing', async () => {
      renderModal(mockMentorIncomplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/dados incompletos do mentor/i)).toBeInTheDocument()
      })

      expect(sessionService.createSession).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('submits session request with complete mentor data', async () => {
      sessionService.createSession.mockResolvedValueOnce(mockSessionResponse)

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(sessionService.createSession).toHaveBeenCalledWith({
          mentor_id: mockMentorComplete.id,
          mentor_name: mockMentorComplete.name,
          mentor_email: mockMentorComplete.email,
          mentor_company: mockMentorComplete.company,
          message: expect.any(String),
        })
      })

      // Should show success state
      await waitFor(() => {
        expect(screen.getByText('Solicitacao enviada!')).toBeInTheDocument()
      })
    })

    it('tracks analytics on successful submission', async () => {
      sessionService.createSession.mockResolvedValueOnce(mockSessionResponse)

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(analytics.track).toHaveBeenCalledWith(
          'Session Requested',
          expect.objectContaining({
            mentor_id: mockMentorComplete.id,
            mentor_name: mockMentorComplete.name,
          })
        )
        expect(analytics.track).toHaveBeenCalledWith(
          'Session Request Success',
          expect.any(Object)
        )
      })
    })
  })

  describe('error handling', () => {
    it('handles API validation errors (422)', async () => {
      const validationError = createValidationError([
        { field: 'mentor_email', message: 'value is not a valid email address' },
      ])
      sessionService.createSession.mockRejectedValueOnce(validationError)

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/value is not a valid email address/i)).toBeInTheDocument()
      })

      expect(analytics.track).toHaveBeenCalledWith(
        'Session Request Error',
        expect.objectContaining({
          mentor_id: mockMentorComplete.id,
          error: expect.any(String),
        })
      )
    })

    it('handles standard API errors', async () => {
      const apiError = createApiError(500, 'Internal server error')
      sessionService.createSession.mockRejectedValueOnce(apiError)

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument()
      })
    })

    it('handles network errors with default message', async () => {
      sessionService.createSession.mockRejectedValueOnce(new Error('Network Error'))

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/erro ao enviar solicitacao/i)).toBeInTheDocument()
      })
    })

    it('does not crash when rendering validation error array', async () => {
      // This tests the fix for React error #31
      const validationError = createValidationError([
        { field: 'mentor_email', message: 'Field required' },
        { field: 'mentor_id', message: 'Field required' },
      ])
      sessionService.createSession.mockRejectedValueOnce(validationError)

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        // Should display joined error messages as string, not crash
        const errorElement = screen.getByText(/field required/i)
        expect(errorElement).toBeInTheDocument()
      })
    })
  })

  describe('modal state', () => {
    it('disables buttons while submitting', async () => {
      // Make the API call hang
      sessionService.createSession.mockImplementation(
        () => new Promise(() => {})
      )

      renderModal(mockMentorComplete)

      const submitButton = screen.getByRole('button', { name: /enviar solicitacao/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancelar/i })
      expect(cancelButton).toBeDisabled()
    })

    it('tracks modal open on mount', () => {
      renderModal(mockMentorComplete)

      expect(analytics.track).toHaveBeenCalledWith(
        'Booking Modal Opened',
        expect.objectContaining({
          mentor_id: mockMentorComplete.id,
          mentor_name: mockMentorComplete.name,
        })
      )
    })
  })
})
