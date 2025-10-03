# Guia de Configuração - Centro de Carreiras

## Pré-requisitos

- Node.js 18+ instalado
- Conta no Airtable
- Conta de email (Gmail recomendado para desenvolvimento)
- Conta no Google Cloud Platform (para deploy)

## Configuração do Ambiente de Desenvolvimento

### 1. Instalação das Dependências

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
npm install
```

### 2. Configuração do Airtable

1. Acesse [Airtable](https://airtable.com)
2. Crie uma nova base ou use a existente
3. Crie as seguintes tabelas:

#### Tabela: Mentores
- Nome (Single line text)
- Email (Email)
- Área de Expertise (Multiple select)
- Biografia (Long text)
- LinkedIn (URL)
- Foto (Attachment)

#### Tabela: Estudantes
- Nome (Single line text)
- Email (Email)
- Curso (Single line text)
- Ano de Graduação (Number)
- Telefone (Phone number)

#### Tabela: Vagas
- Título (Single line text)
- Empresa (Single line text)
- Tipo (Single select: Estágio, Trainee, Júnior, etc.)
- Área (Single select)
- Localização (Single line text)
- Descrição (Long text)
- Link de Candidatura (URL)
- Data de Publicação (Date)

#### Tabela: Agendamentos
- Estudante (Link to Estudantes)
- Mentor (Link to Mentores)
- Data (Date)
- Horário (Single line text)
- Status (Single select: Pendente, Confirmado, Cancelado)
- Assunto (Long text)

3. Obtenha sua API Key: Account → API → Generate API Key
4. Obtenha o Base ID: Help → API documentation → The ID of this base is...

### 3. Configuração das Variáveis de Ambiente

#### Backend
Copie o arquivo `.env.example` para `.env`:
```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=gere-uma-chave-secreta-aleatoria-aqui
AIRTABLE_API_KEY=sua-chave-api-airtable
AIRTABLE_BASE_ID=seu-base-id-airtable
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FRONTEND_URL=http://localhost:3000
```

**Nota sobre Gmail:** Para usar Gmail, você precisará gerar uma "App Password":
1. Ative a verificação em duas etapas na sua conta Google
2. Acesse: Conta Google → Segurança → Senhas de app
3. Gere uma senha de app e use no `.env`

### 4. Executar o Projeto

#### Desenvolvimento (Frontend)
```bash
cd frontend
npm run dev
```
Acesse: http://localhost:3000

#### Desenvolvimento (Backend)
```bash
cd backend
npm run dev
```
API rodando em: http://localhost:5000

## Deploy no Google Cloud Run

### 1. Preparação

```bash
# Instalar Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Configurar projeto
gcloud config set project SEU-PROJECT-ID
```

### 2. Build e Deploy

```bash
# Build da imagem Docker
gcloud builds submit --tag gcr.io/SEU-PROJECT-ID/centro-carreiras

# Deploy no Cloud Run
gcloud run deploy centro-carreiras \
  --image gcr.io/SEU-PROJECT-ID/centro-carreiras \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=sua-chave-secreta" \
  --set-secrets="AIRTABLE_API_KEY=airtable-key:latest,SMTP_PASS=smtp-pass:latest"
```

### 3. Configurar Secrets no GCP

```bash
# Criar secrets
echo -n "sua-api-key-airtable" | gcloud secrets create airtable-key --data-file=-
echo -n "sua-senha-smtp" | gcloud secrets create smtp-pass --data-file=-
```

## Estrutura de Diretórios

```
centro-carreiras-v2/
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── styles/       # Arquivos CSS
│   │   ├── utils/        # Funções utilitárias
│   │   └── hooks/        # Custom React hooks
│   └── package.json
├── backend/              # API Node.js
│   ├── src/
│   │   ├── controllers/  # Lógica de negócio
│   │   ├── routes/       # Definição de rotas
│   │   ├── services/     # Serviços (Airtable, Email)
│   │   ├── middleware/   # Middlewares (Auth, etc)
│   │   └── config/       # Configurações
│   └── package.json
└── docs/                 # Documentação
```

## Próximos Passos

1. Implementar autenticação JWT completa
2. Conectar frontend com backend
3. Implementar lógica de agendamento
4. Integrar Airtable completamente
5. Adicionar analytics e métricas
6. Testes automatizados

## Suporte

Em caso de dúvidas, entre em contato com a equipe do Fundo Patronos:
- Email: carreiras@fundopatronos.org.br
