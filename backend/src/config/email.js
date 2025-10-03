import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Configurar transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Verificar conexão
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erro na configuração de email:', error)
  } else {
    console.log('✅ Servidor de email pronto para enviar mensagens')
  }
})

// Template de email de boas-vindas
export const sendWelcomeEmail = async (to, nome) => {
  const mailOptions = {
    from: `"Centro de Carreiras - Unicamp" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Bem-vindo ao Centro de Carreiras da Unicamp! 🎓',
    html: `
      <h2>Olá, ${nome}!</h2>
      <p>Seja muito bem-vindo(a) ao <strong>Centro de Carreiras da Unicamp</strong>!</p>
      <p>Estamos muito felizes em tê-lo(a) conosco. Agora você tem acesso a:</p>
      <ul>
        <li>🎯 Mentores profissionais experientes</li>
        <li>📅 Agendamento ilimitado de sessões</li>
        <li>💼 Vagas exclusivas de empresas parceiras</li>
        <li>🌐 Rede de networking entre alunos e ex-alunos</li>
      </ul>
      <p>Acesse a plataforma e comece a explorar todas as oportunidades disponíveis!</p>
      <p><a href="${process.env.FRONTEND_URL}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Acessar Plataforma</a></p>
      <br>
      <p>Atenciosamente,<br><strong>Equipe Fundo Patronos</strong></p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✉️ Email de boas-vindas enviado para ${to}`)
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error)
    throw error
  }
}

// Template de email de confirmação de agendamento
export const sendBookingConfirmation = async (to, nome, mentorNome, data, horario) => {
  const mailOptions = {
    from: `"Centro de Carreiras - Unicamp" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Confirmação de Agendamento - Centro de Carreiras 📅',
    html: `
      <h2>Olá, ${nome}!</h2>
      <p>Sua sessão de mentoria foi agendada com sucesso!</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Mentor:</strong> ${mentorNome}</p>
        <p><strong>Data:</strong> ${data}</p>
        <p><strong>Horário:</strong> ${horario}</p>
      </div>
      <p>Você receberá um email com o link da reunião próximo à data agendada.</p>
      <p>Prepare suas perguntas e aproveite ao máximo essa oportunidade!</p>
      <br>
      <p>Atenciosamente,<br><strong>Equipe Centro de Carreiras</strong></p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✉️ Email de confirmação enviado para ${to}`)
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error)
    throw error
  }
}

export default transporter
