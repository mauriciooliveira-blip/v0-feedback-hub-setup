# FeedbackHub API Backend

API completa para sistema de gestão de feedback corporativo desenvolvida com Node.js, Express, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **Backend**: Node.js, Express.js
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL (compatível com Supabase)
- **Autenticação**: JWT (jsonwebtoken)
- **Hash de Senha**: bcrypt.js
- **Validação**: Joi
- **Middleware**: CORS, Helmet, Morgan

## 📋 Funcionalidades

### Autenticação
- ✅ Registro de usuários com primeiro usuário como ADMIN
- ✅ Login com JWT
- ✅ Middleware de proteção de rotas
- ✅ Sistema de roles (USER, MANAGER, ADMIN)

### Gestão de Usuários
- ✅ Listar usuários (ADMIN)
- ✅ Buscar usuário por ID (ADMIN)
- ✅ Atualizar dados do usuário (ADMIN)
- ✅ Desativar usuário (ADMIN)

### Gestão de Equipes
- ✅ Criar equipes (ADMIN, MANAGER)
- ✅ Listar equipes (todos)
- ✅ Adicionar membros à equipe (ADMIN, MANAGER)
- ✅ Remover membros da equipe (ADMIN, MANAGER)

### Sistema de Feedback
- ✅ Criar feedback (todos)
- ✅ Listar feedbacks com permissões por role
- ✅ Atualizar status do feedback (ADMIN, MANAGER)
- ✅ Adicionar comentários (todos)

### Dashboard e Relatórios
- ✅ Dashboard personalizado por role
- ✅ Estatísticas de equipes e feedbacks
- ✅ Métricas por status e prioridade

## 🛠️ Instalação

1. **Clone o repositório**
\`\`\`bash
git clone <repository-url>
cd feedbackhub-api
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm install
\`\`\`

3. **Configure as variáveis de ambiente**
\`\`\`bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
\`\`\`

4. **Configure o banco de dados**
\`\`\`bash
# Gere o Prisma Client
npm run prisma:generate

# Execute as migrações
npm run prisma:migrate
\`\`\`

5. **Inicie o servidor**
\`\`\`bash
# Desenvolvimento
npm run dev

# Produção
npm start
\`\`\`

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### Usuários (ADMIN apenas)
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Desativar usuário

### Equipes
- `POST /api/teams` - Criar equipe (ADMIN, MANAGER)
- `GET /api/teams` - Listar equipes
- `POST /api/teams/:id/members` - Adicionar membro (ADMIN, MANAGER)
- `DELETE /api/teams/:id/members/:memberId` - Remover membro (ADMIN, MANAGER)

### Feedback
- `POST /api/feedback` - Criar feedback
- `GET /api/feedback` - Listar feedbacks
- `PUT /api/feedback/:id/status` - Atualizar status (ADMIN, MANAGER)
- `POST /api/feedback/:id/comments` - Adicionar comentário

### Relatórios
- `GET /api/reports/dashboard` - Dashboard personalizado

## 🔐 Sistema de Permissões

### USER
- Criar feedback
- Ver feedbacks enviados/recebidos
- Adicionar comentários
- Ver equipes que participa

### MANAGER
- Todas as permissões de USER
- Criar e gerenciar equipes
- Ver feedbacks de membros das suas equipes
- Atualizar status de feedbacks

### ADMIN
- Todas as permissões de MANAGER
- Gerenciar todos os usuários
- Ver todos os feedbacks
- Acesso completo ao sistema

## 📊 Estrutura do Banco

### Modelos Principais
- **User**: Usuários do sistema
- **Team**: Equipes/grupos
- **TeamMember**: Relacionamento usuário-equipe
- **Feedback**: Feedbacks entre usuários
- **FeedbackComment**: Comentários nos feedbacks

### Enums
- **Role**: USER, MANAGER, ADMIN
- **UserStatus**: ACTIVE, INACTIVE, SUSPENDED
- **FeedbackStatus**: PENDING, IN_ANALYSIS, APPROVED, REJECTED
- **FeedbackPriority**: LOW, MEDIUM, HIGH, CRITICAL

## 🚀 Deploy

O projeto está pronto para deploy em qualquer plataforma que suporte Node.js:

- **Heroku**
- **Vercel**
- **Railway**
- **DigitalOcean**
- **AWS**

Certifique-se de configurar as variáveis de ambiente na plataforma escolhida.

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.
