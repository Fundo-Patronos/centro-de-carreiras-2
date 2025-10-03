import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

class EmailService:
    """Serviço para envio de emails"""

    @staticmethod
    async def send_email(to: str, subject: str, html_content: str):
        """Envia email"""
        try:
            message = MIMEMultipart("alternative")
            message["From"] = settings.FROM_EMAIL
            message["To"] = to
            message["Subject"] = subject

            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                start_tls=True,
            )

            print(f"✉️ Email enviado para {to}")
        except Exception as e:
            print(f"Erro ao enviar email: {e}")
            raise

    @staticmethod
    async def send_welcome_email(to: str, nome: str):
        """Envia email de boas-vindas"""
        subject = "Bem-vindo ao Centro de Carreiras da Unicamp! 🎓"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, {nome}!</h2>
                <p>Seja muito bem-vindo(a) ao <strong>Centro de Carreiras da Unicamp</strong>!</p>
                <p>Estamos muito felizes em tê-lo(a) conosco. Agora você tem acesso a:</p>
                <ul>
                    <li>🎯 Mentores profissionais experientes</li>
                    <li>📅 Agendamento ilimitado de sessões</li>
                    <li>💼 Vagas exclusivas de empresas parceiras</li>
                    <li>🌐 Rede de networking entre alunos e ex-alunos</li>
                </ul>
                <p>Acesse a plataforma e comece a explorar todas as oportunidades disponíveis!</p>
                <p style="margin-top: 30px;">
                    <a href="{settings.FRONTEND_URL}"
                       style="background-color: #1e40af; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 8px; display: inline-block;">
                        Acessar Plataforma
                    </a>
                </p>
                <br>
                <p>Atenciosamente,<br><strong>Equipe Fundo Patronos</strong></p>
            </body>
        </html>
        """
        await EmailService.send_email(to, subject, html_content)

    @staticmethod
    async def send_booking_confirmation(
        to: str, nome: str, mentor_nome: str, data: str, horario: str
    ):
        """Envia email de confirmação de agendamento"""
        subject = "Confirmação de Agendamento - Centro de Carreiras 📅"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, {nome}!</h2>
                <p>Sua sessão de mentoria foi agendada com sucesso!</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Mentor:</strong> {mentor_nome}</p>
                    <p><strong>Data:</strong> {data}</p>
                    <p><strong>Horário:</strong> {horario}</p>
                </div>
                <p>Você receberá um email com o link da reunião próximo à data agendada.</p>
                <p>Prepare suas perguntas e aproveite ao máximo essa oportunidade!</p>
                <br>
                <p>Atenciosamente,<br><strong>Equipe Centro de Carreiras</strong></p>
            </body>
        </html>
        """
        await EmailService.send_email(to, subject, html_content)

    @staticmethod
    async def send_booking_notification_to_mentor(
        to: str, mentor_nome: str, estudante_nome: str, data: str, horario: str, assunto: str
    ):
        """Envia notificação de agendamento para o mentor"""
        subject = "Nova Sessão de Mentoria Agendada 📅"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Olá, {mentor_nome}!</h2>
                <p>Uma nova sessão de mentoria foi agendada com você!</p>
                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Estudante:</strong> {estudante_nome}</p>
                    <p><strong>Data:</strong> {data}</p>
                    <p><strong>Horário:</strong> {horario}</p>
                    <p><strong>Assunto:</strong> {assunto}</p>
                </div>
                <p>Por favor, confirme sua disponibilidade acessando a plataforma.</p>
                <br>
                <p>Atenciosamente,<br><strong>Equipe Centro de Carreiras</strong></p>
            </body>
        </html>
        """
        await EmailService.send_email(to, subject, html_content)
