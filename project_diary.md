# Centro de Carreiras - Project Diary

## Visão Geral do Projeto

**Nome:** Centro de Carreiras da Unicamp
**Organização:** Fundo Patronos (fundo patrimonial da Unicamp)
**Objetivo:** Plataforma digital para apoiar a trajetória profissional dos estudantes da Unicamp

## Descrição

O Centro de Carreiras é uma plataforma que conecta estudantes da Unicamp com mentores profissionais experientes de diversas áreas. A plataforma oferece:

- **Mentoria**: Acesso a mentores residentes (profissionais experientes) para discussões sobre carreiras, processos seletivos e estratégias de networking
- **Agendamento**: Sistema de agendamento de reuniões ilimitadas com mentores
- **Vagas**: Visualização de oportunidades de trabalho abertas
- **Conexões**: Expansão de rede de contatos entre alunos e ex-alunos
- **Disponibilidade**: 24/7/365

## Arquitetura Técnica

### Stack Tecnológico
- **Frontend:** React + Tailwind CSS
- **Backend:** Python/FastAPI (escolhido pelo usuário)
- **Database/CMS:** Airtable (para gerenciar dados de mentores, estudantes e vagas)
- **Deployment:** Google Cloud Platform (Cloud Run)
- **Idioma:** PT-BR (português brasileiro)
- **Tipografia:** Inter (Google Fonts)

### Design System - Cores da Marca

**Gradiente Primary (tema ativo):**
- `linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)`
- Progressão: Laranja → Coral → Rosa → Roxo
- Uso: Botões primários, títulos importantes, elementos de destaque

**Cores Individuais do Gradiente:**
- Laranja: `#ff9700`
- Coral: `#ff6253`
- Rosa: `#fc4696`
- Roxo: `#c964e2`

**Cores Adicionais:**
- **Accent Color (patronos-accent):** `#c964e2` (Purple) - Centralized in tailwind.config.js
  - CRITICAL: This is the single source of truth for platform accent color
  - Used for: links ativos, ícones de navegação, bordas de foco, hover states, active states
  - Changed from red (#C00000) to purple (#c964e2) on 2025-10-04
- Amarelo: `#ff9700`

**Aplicação das Cores:**
- Botões primários: Gradiente completo com hover opacity
- Elementos ativos (sidebar): patronos-accent (purple #c964e2)
- Texto da marca: Gradiente com text clip
- Focus states: patronos-accent
- Hover states: patronos-accent
- Tags de expertise: Color mapping system (see Session 2 notes)

### Razão para Airtable
A equipe que atualiza informações de mentores, estudantes e vagas não sabe programar. Airtable permite que eles gerenciem dados facilmente através de uma interface visual, enquanto a plataforma consome esses dados via API ou embeds.

### Funcionalidades Principais

1. **Autenticação**
   - Sign-in/Sign-up de usuários
   - Gerenciamento de sessões

2. **Visualização de Mentores**
   - Embedded views do Airtable mostrando mentores disponíveis
   - Informações sobre áreas de expertise, indústrias, carreiras globais, pós-graduação, empreendedorismo

3. **Agendamento de Mentorias**
   - Sistema de agendamento de sessões com mentores
   - Número ilimitado de reuniões por estudante

4. **Vagas Abertas**
   - Página para visualizar oportunidades de trabalho
   - Dados sincronizados com Airtable

5. **Envio de Emails**
   - Confirmações de agendamento
   - Notificações para mentores e estudantes

6. **Métricas e Analytics**
   - Tracking de uso da plataforma
   - Métricas de engajamento

## Estrutura de Páginas

1. **Sign-in/Sign-up** - Autenticação de usuários
2. **Home** - Página inicial da plataforma
3. **Agendar Mentorias** - Página para agendar sessões com mentores
4. **Vagas Abertas** - Visualização de oportunidades de trabalho

## Airtable Integration

### Credenciais API
- **Personal Access Token:** Stored in backend `.env` file (see `.env.example` for format)
- **Base ID:** `app4uSEqO2S03EO5X`
- **Tabela de Mentores:** `Mentores Residentes - Produção`

### Embedded View
Exemplo de embedded view do Airtable:
```html
<iframe
  class="airtable-embed"
  src="https://airtable.com/embed/app4uSEqO2S03EO5X/shr9ZDEboM5pT8Kpc?viewControls=on"
  frameborder="0"
  width="100%"
  height="533"
  style="background: transparent; border: 1px solid #ccc;">
</iframe>
```

## Repositório

GitHub: https://github.com/Fundo-Patronos/centro-de-carreiras-2.git

## Histórico de Desenvolvimento

### Session 1 - 2025-10-03

**Setup Inicial:**
- Definição da arquitetura inicial
- Recomendação de stack tecnológico (Node.js/Express e Python/FastAPI apresentados)
- Usuário escolheu Python/FastAPI como backend
- Criação completa da estrutura do projeto:
  - Frontend React com Tailwind CSS (Home, Sign-in/up, Mentorias, Vagas)
  - Backend Python/FastAPI com:
    - Sistema de autenticação JWT
    - Integração com Airtable (pyairtable)
    - Serviço de email (aiosmtplib)
    - Rotas para auth, mentors, jobs, bookings
    - Schemas Pydantic para validação
- Configuração do repositório Git e push inicial
- Documentação criada (README.md, SETUP.md, project_diary.md)

**Refatoração do Frontend:**
- Removidas todas as páginas antigas e reconstruído do zero
- Criado componente Sidebar com navegação (Home, Mentorias, Vagas)
- Criado componente Navbar horizontal com logo e perfil do usuário
- Instalação de dependências: @heroicons/react, @headlessui/react
- Layout implementado: Navbar no topo, Sidebar à esquerda, conteúdo principal à direita

**Página de Mentorias:**
- Título: "Encontre seu Mentor"
- Subtítulo explicativo sobre a plataforma
- Integração do Airtable embed para visualização de mentores
- Layout responsivo e centrado

**Implementação do Design System:**
- Configuração das cores da marca Fundo Patronos no Tailwind:
  - Gradiente primary: `linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)`
  - Cores individuais: orange, coral, pink, purple
  - Vermelho accent (#C00000) para elementos ativos
- Tipografia: Fonte Inter importada via Google Fonts
- Aplicação das cores:
  - Logo "Centro de Carreiras": Gradiente com bg-clip-text
  - Botões primários: Gradiente completo
  - Sidebar: Items ativos com vermelho accent e background gradient sutil
  - Focus states: Vermelho accent
- Atualização de todos os componentes (Navbar, Sidebar) com as novas cores

### Session 2 - 2025-10-04

**Mentorias Page - Complete Rebuild:**
- Completely rebuilt Mentorias page with custom mentor cards instead of Airtable embed
- Created grid layout (3 columns on desktop) for mentor display
- Each mentor card includes:
  - Profile photo (placeholder with initials if no photo)
  - Name and professional title
  - Brief bio/description
  - Tags for areas of expertise (Consultoria, Indústria, Tecnologia, etc.)
  - "Agendar Mentoria" button with gradient styling
- Improved typography and spacing throughout the page

**Backend Airtable Integration:**
- Implemented `/api/mentors/` endpoint in FastAPI
- Fetches mentor data from Airtable "Mentores Residentes - Produção" table
- Maps Airtable fields to frontend-friendly format:
  - Name, Title, Bio, Photo URL
  - Tags array from "Tags (from Área de Expertise)" field
- CORS configuration updated to allow frontend access
- Backend port changed from 5000 to 8000 (to avoid macOS AirPlay conflict)

**Mentor Detail Modal:**
- Created MentorModal component with Headless UI Dialog
- Fixed modal dimensions: `max-w-6xl` width, 800px height
- Two-column layout:
  - Left: Mentor photo (400x400px), name, title, tags
  - Right: Scrollable content area for bio and additional information
- Smooth scroll behavior for long bios
- Consistent tag styling with main page

**Centralized Color System - Critical Protocol:**
- Created `patronos-accent` color variable in `tailwind.config.js`
- This is THE SINGLE SOURCE OF TRUTH for the platform's accent color
- Currently set to purple: `#c964e2`
- To change platform accent color, ONLY modify this one variable
- Used throughout the platform for:
  - Active navigation items
  - Hover states
  - Tag backgrounds
  - Interactive elements

**Tag Color Mapping System - Critical Protocol:**
- Established consistent color mapping for expertise tags
- Tag colors are defined in BOTH `Mentorias.jsx` and `MentorModal.jsx`
- Must remain synchronized across both files
- Current mapping:
  - Consultoria: blue-500
  - Indústria: green-500
  - Tecnologia: patronos-accent (purple)
  - Finanças: yellow-500
  - Empreendedorismo: red-500
  - Default: gray-500
- WHY: Ensures users can visually identify expertise areas consistently across the entire platform

**Design Decisions - Rationale:**
- Modal size (max-w-6xl, 800px height): Provides enough space for detailed mentor information without overwhelming the screen
- Two-column modal layout: Separates visual identity (photo, name) from content (bio), improving scannability
- Scrollable content area: Allows mentors to have extensive bios without breaking layout
- Tag color mapping: Creates visual consistency and helps users quickly identify expertise areas
- Centralized accent color: Enables easy rebranding - changing one variable updates entire platform

**Technical Configuration:**
- Backend running on port 8000 (changed from 5000)
- Frontend fetches from `http://localhost:8000/api/mentors/`
- Environment: Development mode with hot reload
- CORS enabled for localhost:5173 (Vite dev server)

**Files Modified:**
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/pages/Mentorias.jsx`
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/components/MentorModal.jsx` (new)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/tailwind.config.js`
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/backend/main.py`
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/backend/routers/mentors.py`

**Pending Items for Next Session:**
- ~~Consider implementing mentor filtering by tags~~ ✅ DONE in Session 3
- Add real booking functionality to "Agendar Mentoria" buttons
- Implement mentor search functionality
- Add loading states and error handling for API calls
- Consider pagination or lazy loading if mentor list grows large
- Test responsive layout on mobile devices

### Session 3 - 2025-10-05

**Mentor Filtering System:**
- Created `FilterBox` component with dropdown and checkbox functionality
- Implemented using Headless UI Combobox for clean dropdown behavior
- Features:
  - Multi-select with checkboxes for Tags and "Pode Ajudar Com"
  - "Todos" option to select/deselect all items
  - Search functionality within dropdown
  - Smart display: shows count or selected items
  - Purple accent color (patronos-accent) for consistency
- Added two filter boxes to Mentorias page (side by side layout)
- Implemented filtering logic:
  - Shows mentors matching ANY selected tag AND ANY selected expertise
  - Handles mentors with empty arrays (shows when all filters selected)
  - Shows 0 mentors when no filters are selected
  - Displays "Mostrando X de Y mentores" counter

**Text Formatting:**
- Created `toTitleCase()` utility function for proper capitalization
- Applied to mentor cards and modal:
  - Name, Title, Company fields
  - Handles Portuguese small words (de, da, do, dos, das, e, etc.)
  - Converts ALL CAPS to proper Title Case
  - Examples: "VP DE OPERAÇÕES" → "VP de Operações"
- Applied in both `Mentorias.jsx` and `MentorModal.jsx`

**Perfil (Profile) Page:**
- Created complete mentor profile page (`/frontend/src/pages/Perfil.jsx`)
- Features:
  - All editable fields: Nome, Email, Título, Companhia, Curso, LinkedIn, Biografia
  - Profile photo display (with avatar fallback)
  - FilterBox components for "Áreas de Atuação" and "Pode Ajudar Com"
  - Save/Cancel buttons with loading states
  - Fetches current mentor data from API on load
  - Fetches all mentors to populate filter dropdowns
- Added `/perfil` route to App.jsx
- Updated Navbar with dropdown menu:
  - Click avatar to open menu
  - "Meu Perfil" → navigates to /perfil
  - "Sair" → placeholder for logout
  - Uses react-router-dom Link for navigation
  - Changed user display to "Mentor"

**Backend - Airtable Update Integration:**
- Created `MentorUpdate` schema (`app/schemas/mentor.py`)
  - All fields optional for flexible updates
  - Includes: nome, email, titulo, companhia, curso, biografia, linkedin, tags, area_expertise
- Implemented `PUT /api/mentors/{mentor_id}` endpoint
  - Maps frontend fields to Airtable field names:
    - `tags` → `Tags`
    - `area_expertise` → `Pode ajudar com`
    - `nome` → `Name`
    - `titulo` → `Título`
  - Uses existing `AirtableService.update_record()` method
  - Returns updated mentor data
  - Error handling with detailed messages
- Full integration with Airtable credentials from project_diary
- Updates persist immediately to Airtable "Mentores Residentes - Produção" table

**Technical Implementation:**
- Backend successfully updates Airtable using pyairtable
- Frontend form submission connected to PUT endpoint
- Success/error alerts for user feedback
- Disabled state during save operations
- Proper field mapping between app and Airtable schema

**Files Created:**
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/components/FilterBox.jsx`
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/pages/Perfil.jsx`

**Files Modified:**
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/pages/Mentorias.jsx` (added FilterBox, filtering logic, toTitleCase)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/components/MentorModal.jsx` (added toTitleCase)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/App.jsx` (added Perfil route)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/frontend/src/components/Navbar.jsx` (added dropdown menu, Link navigation)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/backend/app/api/routes/mentors.py` (added PUT endpoint)
- `/Users/G.Beltrami/Documents/Projects/8.centro-carreiras-v2/backend/app/schemas/mentor.py` (added MentorUpdate schema)

**Pending Items for Next Session:**
- Add real booking functionality to "Agendar Mentoria" buttons
- Implement authentication system (students vs mentors)
- Add loading states and error handling for API calls
- Consider pagination or lazy loading if mentor list grows large
- Test responsive layout on mobile devices
- Implement photo upload functionality for profile pictures
