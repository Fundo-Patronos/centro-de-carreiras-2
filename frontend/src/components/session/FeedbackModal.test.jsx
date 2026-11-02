import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FeedbackModal from './FeedbackModal'
import { mockSessionResponse } from '../../test/mocks'

// Mock the services
vi.mock('../../services/sessionService', () => ({
  default: {
    completeSessionWithFeedback: vi.fn(),
    submitFeedback: vi.fn(),
  },
}))

vi.mock('../../services/analytics', () => ({
  default: {
    track: vi.fn(),
  },
  EVENTS: {
    SESSION_COMPLETED_WITH_FEEDBACK: 'Session Completed With Feedback',
    SESSION_FEEDBACK_SUBMITTED: 'Session Feedback Submitted',
    FEEDBACK_MODAL_CLOSED: 'Feedback Modal Closed',
    FEEDBACK_MODAL_OPENED: 'Feedback Modal Opened',
  },
}))

// Import mocked modules
import sessionService from '../../services/sessionService'

const renderModal = (mode = 'complete') => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const utils = render(
    <FeedbackModal
      session={mockSessionResponse}
      viewerRole="mentor"
      isOpen
      onClose={onClose}
      onSuccess={onSuccess}
      mode={mode}
    />
  )
  return { onClose, onSuccess, ...utils }
}

const selectStar = (star) => {
  const stars = document.querySelectorAll('svg.h-8')
  fireEvent.click(stars[star - 1].closest('button'))
}

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the three meeting status options', () => {
    renderModal()

    expect(screen.getByText('Aconteceu')).toBeInTheDocument()
    expect(screen.getByText('Marcado')).toBeInTheDocument()
    expect(screen.getByText('Não aconteceu')).toBeInTheDocument()
  })

  it("completes with 'Marcado' without requiring a rating", async () => {
    sessionService.completeSessionWithFeedback.mockResolvedValueOnce(mockSessionResponse)

    renderModal()

    fireEvent.click(screen.getByRole('radio', { name: 'Marcado' }))

    const submitButton = screen.getByRole('button', { name: 'Enviar Feedback' })
    expect(submitButton).toBeEnabled()

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(sessionService.completeSessionWithFeedback).toHaveBeenCalledWith(
        mockSessionResponse.id,
        expect.objectContaining({ meeting_status: 'scheduled', rating: null })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Resposta registrada!')).toBeInTheDocument()
    })
  })

  it("requires a reason for 'Não aconteceu' and sends no_meeting_reason", async () => {
    sessionService.completeSessionWithFeedback.mockResolvedValueOnce(mockSessionResponse)

    renderModal()

    fireEvent.click(screen.getByRole('radio', { name: 'Não aconteceu' }))

    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => {
      expect(
        screen.getByText('Por favor, explique por que o encontro não aconteceu.')
      ).toBeInTheDocument()
    })
    expect(sessionService.completeSessionWithFeedback).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/por que o encontro não aconteceu/i), {
      target: { value: 'O mentor não compareceu.' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }))

    await waitFor(() => {
      expect(sessionService.completeSessionWithFeedback).toHaveBeenCalledWith(
        mockSessionResponse.id,
        expect.objectContaining({
          meeting_status: 'not_happened',
          no_meeting_reason: 'O mentor não compareceu.',
        })
      )
    })
  })

  it("requires a rating for 'Aconteceu' and sends rating 5", async () => {
    sessionService.completeSessionWithFeedback.mockResolvedValueOnce(mockSessionResponse)

    renderModal()

    fireEvent.click(screen.getByRole('radio', { name: 'Aconteceu' }))

    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => {
      expect(screen.getByText('Por favor, selecione uma avaliação.')).toBeInTheDocument()
    })
    expect(sessionService.completeSessionWithFeedback).not.toHaveBeenCalled()

    selectStar(5)

    fireEvent.click(screen.getByRole('button', { name: 'Concluir Sessão' }))

    await waitFor(() => {
      expect(sessionService.completeSessionWithFeedback).toHaveBeenCalledWith(
        mockSessionResponse.id,
        expect.objectContaining({
          meeting_status: 'happened',
          rating: 5,
          comments: expect.any(String),
        })
      )
    })
  })
})
