# Centro de Carreiras - Unicamp

Plataforma digital para apoiar a trajetória profissional dos estudantes da Unicamp.

Uma iniciativa do **Fundo Patronos**, o fundo patrimonial da Unicamp.

## Sobre o Projeto

O Centro de Carreiras conecta estudantes da Unicamp com mentores profissionais experientes, oferecendo aconselhamento de carreira, preparação para processos seletivos e expansão de networking.

### Funcionalidades

- 🎯 **Mentoria Profissional**: Acesso a mentores de diversas áreas e indústrias
- 📅 **Agendamento de Sessões**: Sistema para agendar reuniões ilimitadas com mentores
- 💼 **Vagas Abertas**: Visualização de oportunidades de trabalho
- 🌐 **Disponibilidade 24/7**: Plataforma acessível a qualquer momento

## Stack Tecnológico

- **Frontend**: React + Tailwind CSS
- **Backend**: Python/FastAPI
- **Database**: Airtable (CMS para gerenciamento de dados)
- **Deploy**: Google Cloud Platform (Cloud Run)

## Estrutura do Projeto

```
centro-carreiras-v2/
├── frontend/          # Aplicação React + Tailwind CSS
├── backend/           # API Python/FastAPI
│   ├── app/
│   │   ├── api/routes/    # Rotas da API
│   │   ├── core/          # Configuração e segurança
│   │   ├── schemas/       # Modelos Pydantic
│   │   ├── services/      # Airtable, Email
│   │   └── main.py        # Aplicação FastAPI
│   └── requirements.txt
├── docs/              # Documentação
└── project_diary.md   # Diário de desenvolvimento
```

## Desenvolvimento

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Acesse: http://localhost:3000

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configure suas variáveis de ambiente no .env
python run.py
```
API rodando em: http://localhost:5000
Documentação: http://localhost:5000/api/docs

## Licença

© 2025 Fundo Patronos - Unicamp
