import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ConfirmExternalBookingModal from './ConfirmExternalBookingModal'
import { mockMentorComplete, mockSessionResponse } from '../../test/mocks'

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
    SESSION_SCHEDULED_VIA_LINK: 'Session Scheduled Via Link',
    EXTERNAL_BOOKING_CONFIRMATION_OPENED: 'External Booking Confirmation Opened',
    EXTERNAL_BOOKING_CONFIRMATION_CONFIRMED: 'External Booking Confirmation Confirmed',
    EXTERNAL_BOOKING_CONFIRMATION_DISMISSED: 'External Booking Confirmation Dismissed',
    EXTERNAL_BOOKING_CONFIRMATION_ERROR: 'External Booking Confirmation Error',
  },
}))

// Import mocked modules
import sessionService from '../../services/sessionService'
import analytics from '../../services/analytics'

const mentorWithLink = {
  ...mockMentorComplete,
  schedulingLink: 'https://calendly.com/maria-silva/mentoria',
}

const renderModal = (mentor = mentorWithLink, isOpen = true) => {
  const onClose = vi.fn()
  const onConfirmed = vi.fn()
  render(
    <BrowserRouter>
      <ConfirmExternalBookingModal
        mentor={mentor}
        isOpen={isOpen}
        onClose={onClose}
        onConfirmed={onConfirmed}
      />
    </BrowserRouter>
  )
  return { onClose, onConfirmed }
}

describe('ConfirmExternalBookingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the question and mentor name when open', () => {
    renderModal()

    expect(screen.getByText('Você conseguiu marcar a mentoria?')).toBeInTheDocument()
    expect(screen.getByText(mockMentorComplete.name)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sim, já agendei/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ainda não/i })).toBeInTheDocument()
    expect(sessionService.createSession).not.toHaveBeenCalled()
  })

  it('creates the session and shows success when confirming', async () => {
    sessionService.createSession.mockResolvedValueOnce(mockSessionResponse)

    const { onConfirmed } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /sim, já agendei/i }))

    await waitFor(() => {
      expect(sessionService.createSession).toHaveBeenCalledWith({
        mentor_id: mockMentorComplete.id,
        mentor_name: mockMentorComplete.name,
        mentor_email: mockMentorComplete.email,
        mentor_company: mockMentorComplete.company,
        booking_method: 'scheduling_link',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Mentoria registrada! Ela já aparece em Minhas Sessões.')).toBeInTheDocument()
    })

    expect(onConfirmed).toHaveBeenCalledWith(mockSessionResponse)
    expect(analytics.track).toHaveBeenCalledWith(
      'Session Scheduled Via Link',
      expect.objectContaining({
        mentor_id: mockMentorComplete.id,
        mentor_name: mockMentorComplete.name,
      })
    )
  })

  it('dismisses without creating a session', () => {
    const { onClose } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /ainda não/i }))

    expect(sessionService.createSession).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
    expect(analytics.track).toHaveBeenCalledWith(
      'External Booking Confirmation Dismissed',
      expect.objectContaining({
        mentor_id: mockMentorComplete.id,
        mentor_name: mockMentorComplete.name,
      })
    )
  })

  it('shows an error and keeps onConfirmed uncalled when the API rejects', async () => {
    sessionService.createSession.mockRejectedValueOnce(new Error('Network Error'))

    const { onConfirmed } = renderModal()

    fireEvent.click(screen.getByRole('button', { name: /sim, já agendei/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível registrar a mentoria. Tente novamente.')
      ).toBeInTheDocument()
    })

    expect(onConfirmed).not.toHaveBeenCalled()
    expect(analytics.track).toHaveBeenCalledWith(
      'External Booking Confirmation Error',
      expect.objectContaining({
        mentor_id: mockMentorComplete.id,
        mentor_name: mockMentorComplete.name,
        error: 'Network Error',
      })
    )
  })
})
