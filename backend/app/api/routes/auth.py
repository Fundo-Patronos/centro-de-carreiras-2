from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.airtable import AirtableService, Tables
from app.services.email import EmailService

router = APIRouter()

@router.post("/registro", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(user: UserCreate):
    """Registra novo estudante"""
    # Verificar se email já existe
    existing_user = await AirtableService.find_by_email(Tables.STUDENTS, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )

    # Criar hash da senha
    hashed_password = get_password_hash(user.password)

    # Criar registro no Airtable
    student_data = {
        "Nome": user.nome,
        "Email": user.email,
        "Telefone": user.telefone,
        "Curso": user.curso,
        "Ano de Graduação": user.ano_graduacao,
        "Senha": hashed_password,
        "Role": "student"
    }

    created_user = await AirtableService.create_record(Tables.STUDENTS, student_data)

    # Enviar email de boas-vindas
    try:
        await EmailService.send_welcome_email(user.email, user.nome)
    except Exception as e:
        print(f"Erro ao enviar email de boas-vindas: {e}")

    return UserResponse(
        id=created_user["id"],
        email=created_user["Email"],
        nome=created_user["Nome"],
        telefone=created_user["Telefone"],
        curso=created_user["Curso"],
        ano_graduacao=created_user["Ano de Graduação"],
        role="student"
    )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login de usuário"""
    # Buscar usuário por email
    user = await AirtableService.find_by_email(Tables.STUDENTS, credentials.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    # Verificar senha
    if not verify_password(credentials.password, user.get("Senha", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )

    # Criar token JWT
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "email": user["Email"],
            "nome": user["Nome"],
            "role": user.get("Role", "student")
        }
    )

    return Token(access_token=access_token)

@router.post("/esqueci-senha")
async def esqueci_senha(email: str):
    """Envia email para recuperação de senha"""
    user = await AirtableService.find_by_email(Tables.STUDENTS, email)

    if not user:
        # Por segurança, não informar se o email existe ou não
        return {"message": "Se o email existir, você receberá instruções para recuperação"}

    # TODO: Implementar lógica de recuperação de senha
    # Gerar token temporário, salvar no Airtable, enviar email

    return {"message": "Se o email existir, você receberá instruções para recuperação"}
