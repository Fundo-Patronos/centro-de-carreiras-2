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
- **Backend:** Node.js/Express (recomendado) ou Python/FastAPI
- **Database/CMS:** Airtable (para gerenciar dados de mentores, estudantes e vagas)
- **Deployment:** Google Cloud Platform (Cloud Run)
- **Idioma:** PT-BR (português brasileiro)

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
- Definição da arquitetura inicial
- Recomendação de stack tecnológico
- Criação da estrutura básica do projeto
- Configuração do repositório Git
