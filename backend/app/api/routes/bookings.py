from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.core.security import get_current_user, get_current_student, get_current_mentor
from app.services.airtable import AirtableService, Tables
from app.services.email import EmailService

router = APIRouter()

@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def criar_agendamento(
    booking: BookingCreate,
    current_user: dict = Depends(get_current_student)
):
    """Cria novo agendamento de mentoria (apenas estudantes)"""
    # Buscar dados do mentor
    try:
        mentor = await AirtableService.get_record(Tables.MENTORS, booking.mentor_id)
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Mentor não encontrado"
        )

    # Criar agendamento no Airtable
    booking_data = {
        "Estudante": [current_user["sub"]],  # Link para registro do estudante
        "Mentor": [booking.mentor_id],  # Link para registro do mentor
        "Data": str(booking.data),
        "Horário": booking.horario,
        "Assunto": booking.assunto,
        "Status": "Pendente"
    }

    created_booking = await AirtableService.create_record(Tables.BOOKINGS, booking_data)

    # Enviar emails de confirmação
    try:
        # Email para estudante
        await EmailService.send_booking_confirmation(
            to=current_user["email"],
            nome=current_user["nome"],
            mentor_nome=mentor.get("Nome", ""),
            data=str(booking.data),
            horario=booking.horario
        )

        # Email para mentor
        await EmailService.send_booking_notification_to_mentor(
            to=mentor.get("Email", ""),
            mentor_nome=mentor.get("Nome", ""),
            estudante_nome=current_user["nome"],
            data=str(booking.data),
            horario=booking.horario,
            assunto=booking.assunto
        )
    except Exception as e:
        print(f"Erro ao enviar emails: {e}")

    return BookingResponse(
        id=created_booking["id"],
        estudante_id=current_user["sub"],
        estudante_nome=current_user["nome"],
        mentor_id=booking.mentor_id,
        mentor_nome=mentor.get("Nome", ""),
        data=booking.data,
        horario=booking.horario,
        assunto=booking.assunto,
        status="Pendente"
    )

@router.get("/meus-agendamentos", response_model=List[BookingResponse])
async def listar_meus_agendamentos(current_user: dict = Depends(get_current_user)):
    """Lista agendamentos do usuário logado"""
    # Determinar a coluna de busca baseado no role
    if current_user["role"] == "student":
        formula = f"{{Estudante}} = '{current_user['sub']}'"
    else:
        formula = f"{{Mentor}} = '{current_user['sub']}'"

    bookings = await AirtableService.get_all_records(Tables.BOOKINGS, formula)

    return [
        BookingResponse(
            id=booking["id"],
            estudante_id=booking.get("Estudante", [""])[0],
            estudante_nome=booking.get("Estudante Nome", ""),
            mentor_id=booking.get("Mentor", [""])[0],
            mentor_nome=booking.get("Mentor Nome", ""),
            data=booking.get("Data", ""),
            horario=booking.get("Horário", ""),
            assunto=booking.get("Assunto", ""),
            status=booking.get("Status", "Pendente")
        )
        for booking in bookings
    ]

@router.patch("/{booking_id}/confirmar", response_model=BookingResponse)
async def confirmar_agendamento(
    booking_id: str,
    current_user: dict = Depends(get_current_mentor)
):
    """Confirma agendamento (apenas mentores)"""
    try:
        updated_booking = await AirtableService.update_record(
            Tables.BOOKINGS,
            booking_id,
            {"Status": "Confirmado"}
        )

        return BookingResponse(
            id=updated_booking["id"],
            estudante_id=updated_booking.get("Estudante", [""])[0],
            estudante_nome=updated_booking.get("Estudante Nome", ""),
            mentor_id=updated_booking.get("Mentor", [""])[0],
            mentor_nome=updated_booking.get("Mentor Nome", ""),
            data=updated_booking.get("Data", ""),
            horario=updated_booking.get("Horário", ""),
            assunto=updated_booking.get("Assunto", ""),
            status="Confirmado"
        )
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Agendamento não encontrado"
        )

@router.delete("/{booking_id}")
async def cancelar_agendamento(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancela agendamento"""
    try:
        await AirtableService.update_record(
            Tables.BOOKINGS,
            booking_id,
            {"Status": "Cancelado"}
        )
        return {"message": "Agendamento cancelado com sucesso"}
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="Agendamento não encontrado"
        )
