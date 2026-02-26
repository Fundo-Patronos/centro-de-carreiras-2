"""
Email Service Module for Centro de Carreiras API.

Provides email sending functionality using Resend.
"""

import logging
from typing import Literal, Optional
from .config import settings

logger = logging.getLogger(__name__)

# Try to import resend, gracefully handle if not available
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("Resend package not installed. Email sending will be disabled.")


class EmailService:
    """Email service using Resend."""

    def __init__(self):
        self.enabled = False
        if RESEND_AVAILABLE and settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY
            self.enabled = True
            logger.info("Email service initialized successfully")
        else:
            if not settings.RESEND_API_KEY:
                logger.warning("Resend API key not configured. Email sending will be disabled.")

    def send_email(
        self,
        to: list[str],
        subject: str,
        html: str,
        cc: Optional[list[str]] = None,
        bcc: Optional[list[str]] = None,
        reply_to: Optional[str] = None,
    ) -> dict:
        """
        Send an email using Resend.

        Args:
            to: List of recipient email addresses
            subject: Email subject
            html: HTML email content
            cc: Optional list of CC recipients
            bcc: Optional list of BCC recipients
            reply_to: Optional reply-to address

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        if not self.enabled:
            logger.warning("Email service not enabled. Skipping email send.")
            return {"success": False, "error": "Email service not configured"}

        try:
            params = {
                "from": settings.EMAIL_FROM_ADDRESS,
                "to": to,
                "subject": subject,
                "html": html,
            }

            if cc:
                params["cc"] = cc

            if bcc:
                params["bcc"] = bcc

            if reply_to:
                params["reply_to"] = reply_to

            response = resend.Emails.send(params)
            logger.info(f"Email sent successfully to {to}")
            return {"success": True, "id": response.get("id")}
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"success": False, "error": str(e)}

    def send_session_request_to_mentor(
        self,
        mentor_name: str,
        mentor_email: str,
        student_name: str,
        student_email: str,
        message: str,
    ) -> dict:
        """
        Send session request notification to mentor.

        Args:
            mentor_name: Mentor's display name
            mentor_email: Mentor's email address
            student_name: Student's display name
            student_email: Student's email address
            message: Student's message to the mentor

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - Nova solicitacao de mentoria de {student_name}"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {mentor_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Voce recebeu uma nova solicitacao de mentoria de um estudante da Unicamp.
            </p>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Estudante</p>
                <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">{student_name}</p>
                <p style="color: #4a4a4a; margin: 0;">
                    <a href="mailto:{student_email}" style="color: #9B5DE5; text-decoration: none;">{student_email}</a>
                </p>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Mensagem</p>
                <p style="color: #1a1a1a; line-height: 1.7; margin: 0; white-space: pre-line;">{message}</p>
            </div>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 24px 0 0 0;">
                Responda diretamente a este email para entrar em contato com {student_name} e agendar sua sessao de mentoria.
            </p>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[mentor_email],
            subject=subject,
            html=html,
            cc=[settings.EMAIL_ADMIN_CC],
            bcc=[settings.EMAIL_ADMIN_BCC],
            reply_to=student_email,
        )

    def send_session_confirmation_to_student(
        self,
        student_name: str,
        student_email: str,
        mentor_name: str,
        mentor_company: str,
        message: str,
    ) -> dict:
        """
        Send session request confirmation to student.

        Args:
            student_name: Student's display name
            student_email: Student's email address
            mentor_name: Mentor's display name
            mentor_company: Mentor's company
            message: The message that was sent

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - Solicitacao enviada para {mentor_name}"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {student_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Sua solicitacao de mentoria foi enviada com sucesso! O mentor recebera seu email e entrara em contato em breve.
            </p>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Mentor</p>
                <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">{mentor_name}</p>
                <p style="color: #4a4a4a; margin: 0;">{mentor_company}</p>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Sua mensagem</p>
                <p style="color: #1a1a1a; line-height: 1.7; margin: 0; white-space: pre-line;">{message}</p>
            </div>

            <div style="background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(155,93,229,0.1) 100%); border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="color: #4a4a4a; font-size: 14px; margin: 0; line-height: 1.6;">
                    <strong>Dica:</strong> Fique atento ao seu email! O mentor respondera diretamente para <strong>{student_email}</strong>.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[student_email],
            subject=subject,
            html=html,
            bcc=[settings.EMAIL_ADMIN_BCC],
        )


    def send_verification_email(
        self,
        user_name: str,
        user_email: str,
        verification_url: str,
    ) -> dict:
        """
        Send email verification link to user.

        Args:
            user_name: User's display name
            user_email: User's email address
            verification_url: The verification URL with token

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = "Centro de Carreiras - Verifique seu email"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {user_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Obrigado por se cadastrar no Centro de Carreiras. Para ativar sua conta, clique no botao abaixo para verificar seu email.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verificar Email
                </a>
            </div>

            <p style="color: #6a6a6a; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
                Se voce nao conseguir clicar no botao, copie e cole o link abaixo no seu navegador:
            </p>
            <p style="color: #9B5DE5; line-height: 1.6; margin: 8px 0 0 0; font-size: 13px; word-break: break-all;">
                {verification_url}
            </p>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    <strong>Importante:</strong> Este link expira em 24 horas. Se voce nao solicitou esta verificacao, pode ignorar este email com seguranca.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[user_email],
            subject=subject,
            html=html,
        )

    def send_feedback_request_to_student(
        self,
        student_name: str,
        student_email: str,
        mentor_name: str,
        feedback_url: str,
    ) -> dict:
        """
        Send feedback request email to student after a session.

        Args:
            student_name: Student's display name
            student_email: Student's email address
            mentor_name: Mentor's display name
            feedback_url: URL with token to access feedback form

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - Como foi sua mentoria com {mentor_name}?"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {student_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Ha alguns dias voce solicitou uma mentoria com <strong>{mentor_name}</strong>. Gostaríamos de saber como foi sua experiencia!
            </p>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 24px 0;">
                Seu feedback e muito importante para melhorarmos o programa de mentorias do Centro de Carreiras.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{feedback_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Responder Feedback
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    O formulario leva menos de 1 minuto para responder e suas respostas sao confidenciais - apenas a equipe Patronos tera acesso.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[student_email],
            subject=subject,
            html=html,
        )

    def send_welcome_import_email(
        self,
        user_name: str,
        user_email: str,
        password_reset_url: str,
    ) -> dict:
        """
        Send welcome email to imported users with password setup link.

        Args:
            user_name: User's display name
            user_email: User's email address
            password_reset_url: Firebase password reset URL

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = "Centro de Carreiras - Bem-vindo! Configure sua senha"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {user_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                O <strong>Centro de Carreiras</strong> foi atualizado! Estamos com uma nova plataforma, mais moderna e com novos recursos para conectar voce a mentores incriveis.
            </p>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Sua conta foi migrada automaticamente. Para acessar a nova plataforma, voce precisa configurar uma nova senha clicando no botao abaixo:
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{password_reset_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Configurar Senha
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">O que ha de novo?</p>
                <ul style="color: #4a4a4a; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Interface completamente redesenhada</li>
                    <li>Novos perfis de mentores</li>
                    <li>Sistema de agendamento simplificado</li>
                    <li>Melhor experiencia em dispositivos moveis</li>
                </ul>
            </div>

            <p style="color: #6a6a6a; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
                Se voce nao conseguir clicar no botao, copie e cole o link abaixo no seu navegador:
            </p>
            <p style="color: #9B5DE5; line-height: 1.6; margin: 8px 0 0 0; font-size: 13px; word-break: break-all;">
                {password_reset_url}
            </p>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[user_email],
            subject=subject,
            html=html,
        )

    def send_feedback_request_to_mentor(
        self,
        mentor_name: str,
        mentor_email: str,
        student_name: str,
        feedback_url: str,
    ) -> dict:
        """
        Send feedback request email to mentor after a session.

        Args:
            mentor_name: Mentor's display name
            mentor_email: Mentor's email address
            student_name: Student's display name
            feedback_url: URL with token to access feedback form

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - Como foi sua mentoria com {student_name}?"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {mentor_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Ha alguns dias voce recebeu uma solicitacao de mentoria de <strong>{student_name}</strong>. Gostaríamos de saber como foi!
            </p>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 24px 0;">
                Seu feedback e muito importante para acompanharmos o progresso do programa e apoiar nossos estudantes.
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{feedback_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Responder Feedback
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    O formulario leva menos de 1 minuto para responder e suas respostas sao confidenciais - apenas a equipe Patronos tera acesso.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[mentor_email],
            subject=subject,
            html=html,
        )

    def send_password_reset_email(
        self,
        user_name: str,
        user_email: str,
        reset_url: str,
    ) -> dict:
        """
        Send password reset email to user.

        Args:
            user_name: User's display name
            user_email: User's email address
            reset_url: Firebase password reset URL

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = "Fundo Patronos - Redefina sua senha do Centro de Carreiras"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {user_name}!</h2>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Voce solicitou a redefinicao de senha da sua conta no Centro de Carreiras. Clique no botao abaixo para criar uma nova senha:
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Redefinir Senha
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    <strong>Importante:</strong> Este link expira em 1 hora. Se voce nao solicitou esta redefinicao, pode ignorar este email com seguranca - sua senha permanecera inalterada.
                </p>
            </div>

            <p style="color: #6a6a6a; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
                Se voce nao conseguir clicar no botao, copie e cole o link abaixo no seu navegador:
            </p>
            <p style="color: #9B5DE5; line-height: 1.6; margin: 8px 0 0 0; font-size: 13px; word-break: break-all;">
                {reset_url}
            </p>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[user_email],
            subject=subject,
            html=html,
        )

    def send_approval_confirmation_email(
        self,
        user_name: str,
        user_email: str,
        role: Literal["estudante", "mentor"],
        login_url: str,
    ) -> dict:
        """
        Send approval confirmation email to user when their account is approved.

        Args:
            user_name: User's display name
            user_email: User's email address
            role: User's role (estudante or mentor)
            login_url: URL to the login page

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = "Centro de Carreiras - Sua conta foi aprovada!"

        # Role-specific content
        if role == "estudante":
            role_message = "Como estudante, voce agora pode explorar mentores, agendar sessoes de mentoria e acessar recursos de carreira exclusivos."
            features = [
                "Explorar perfis de mentores experientes",
                "Solicitar sessoes de mentoria",
                "Acessar recursos de desenvolvimento de carreira",
            ]
            extra_message = ""
        else:  # mentor
            role_message = "Como mentor, voce agora pode gerenciar seu perfil e receber solicitacoes de mentoria de estudantes da Unicamp."
            features = [
                "Completar seu perfil de mentor",
                "Receber solicitacoes de mentoria de estudantes",
                "Contribuir para o desenvolvimento de futuros profissionais",
            ]
            extra_message = """
            <div style="background: #FFF3E0; border-left: 4px solid #FF6B35; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 8px 0;">Proximo passo importante</p>
                <p style="color: #4a4a4a; font-size: 14px; margin: 0; line-height: 1.6;">
                    Para aparecer na lista de mentores e receber solicitacoes de estudantes, complete seu perfil com sua biografia, areas de expertise e foto. Acesse "Meu Perfil" no menu lateral apos fazer login.
                </p>
            </div>
            """

        features_html = "".join(
            f'<li style="color: #4a4a4a; margin: 8px 0;">{feature}</li>'
            for feature in features
        )

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {user_name}!</h2>

            <div style="background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(155,93,229,0.1) 100%); border-radius: 12px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
                <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0;">
                    🎉 Parabens! Sua conta foi aprovada
                </p>
            </div>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                {role_message}
            </p>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #6a6a6a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">O que voce pode fazer agora</p>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    {features_html}
                </ul>
            </div>

            {extra_message}

            <div style="text-align: center; margin: 32px 0;">
                <a href="{login_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Acessar o Centro de Carreiras
                </a>
            </div>

            <p style="color: #6a6a6a; line-height: 1.6; margin: 24px 0 0 0; font-size: 14px;">
                Se voce nao conseguir clicar no botao, copie e cole o link abaixo no seu navegador:
            </p>
            <p style="color: #9B5DE5; line-height: 1.6; margin: 8px 0 0 0; font-size: 13px; word-break: break-all;">
                {login_url}
            </p>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[user_email],
            subject=subject,
            html=html,
            bcc=[settings.EMAIL_ADMIN_BCC],
        )


def send_completion_feedback_request_to_student(
        self,
        student_name: str,
        student_email: str,
        mentor_name: str,
        feedback_url: str,
    ) -> dict:
        """
        Send feedback request to student when mentor marks session as completed.

        Args:
            student_name: Student's display name
            student_email: Student's email address
            mentor_name: Mentor's display name
            feedback_url: URL to the feedback form in the platform

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - {mentor_name} marcou a sessao como concluida"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {student_name}!</h2>

            <div style="background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(155,93,229,0.1) 100%); border-radius: 12px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0;">
                    ✅ <strong>{mentor_name}</strong> marcou a sessao de mentoria como concluida
                </p>
            </div>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Por favor, avalie sua experiencia com a sessao de mentoria. Seu feedback e muito importante para melhorarmos o programa!
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{feedback_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Avaliar Sessao
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    O formulario leva menos de 1 minuto para responder. Acesse sua conta no Centro de Carreiras para avaliar a sessao.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[student_email],
            subject=subject,
            html=html,
        )

    def send_completion_feedback_request_to_mentor(
        self,
        mentor_name: str,
        mentor_email: str,
        student_name: str,
        feedback_url: str,
    ) -> dict:
        """
        Send feedback request to mentor when student marks session as completed.

        Args:
            mentor_name: Mentor's display name
            mentor_email: Mentor's email address
            student_name: Student's display name
            feedback_url: URL to the feedback form in the platform

        Returns:
            dict with 'success' and 'id' or 'error'
        """
        subject = f"Centro de Carreiras - {student_name} marcou a sessao como concluida"

        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Centro de Carreiras</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Fundo Patronos da Unicamp</p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Ola, {mentor_name}!</h2>

            <div style="background: linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(155,93,229,0.1) 100%); border-radius: 12px; padding: 20px; margin: 0 0 24px 0; text-align: center;">
                <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0;">
                    ✅ O estudante <strong>{student_name}</strong> marcou a sessao de mentoria como concluida
                </p>
            </div>

            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
                Por favor, avalie sua experiencia com a sessao de mentoria. Seu feedback e muito importante para acompanharmos o progresso do programa!
            </p>

            <div style="text-align: center; margin: 32px 0;">
                <a href="{feedback_url}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #9B5DE5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Avaliar Sessao
                </a>
            </div>

            <div style="background: #f8f8f8; border-radius: 12px; padding: 16px; margin: 24px 0 0 0;">
                <p style="color: #6a6a6a; font-size: 13px; margin: 0; line-height: 1.6;">
                    O formulario leva menos de 1 minuto para responder. Acesse sua conta no Centro de Carreiras para avaliar a sessao.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 24px 0;">
            <p style="color: #9a9a9a; font-size: 12px; margin: 0;">
                Este email foi enviado pelo Centro de Carreiras do Fundo Patronos da Unicamp.
            </p>
        </div>
    </div>
</body>
</html>
"""

        return self.send_email(
            to=[mentor_email],
            subject=subject,
            html=html,
        )


# Singleton instance
email_service = EmailService()
