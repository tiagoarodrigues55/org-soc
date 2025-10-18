# Sistema de Avaliações de Jogadores

Site simples para jogadores avaliarem uns aos outros através de mensagens.

## Funcionalidades

- Entrada via formulário com nome do jogador
- Seleção de jogadores para avaliar
- Postagem de avaliações em tempo real
- Visualização de avaliações por jogador
- **Geração de relatórios com IA** - Análise de perfil e recomendação vocacional usando GPT
- Histórico de relatórios salvos no banco de dados
- Interface responsiva e moderna

## Configuração

### 1. Instalar dependências

```bash
cd avaliacoes-jogadores
npm install
```

### 2. Configurar Supabase

Siga as instruções completas no arquivo `SETUP_SUPABASE.md` para:
- Criar conta no Supabase
- Criar as tabelas necessárias
- Obter as credenciais

### 3. Configurar variáveis de ambiente

Edite o arquivo `.env.local` e adicione suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
OPENAI_API_KEY=sua_chave_openai_aqui
```

Para obter a chave da OpenAI:
1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova chave de API
3. Cole no arquivo `.env.local`

### 4. Executar o projeto

```bash
npm run dev
```

Acesse http://localhost:3000

## Como usar

1. **Entrada**: Ao acessar o site, digite seu nome e clique em "Entrar"

2. **Avaliar jogadores**:
   - Selecione um jogador no menu dropdown no topo
   - Digite sua avaliação no campo de texto
   - Clique em "Enviar Avaliação"

3. **Ver avaliações**:
   - As avaliações do jogador selecionado aparecem automaticamente abaixo
   - Ao trocar o jogador selecionado, as avaliações são atualizadas

4. **Gerar Relatórios**:
   - Na tela inicial, clique em "Gerar Relatório"
   - Selecione um jogador para analisar
   - Clique em "Gerar Relatório"
   - O sistema analisa todas as avaliações usando IA (GPT)
   - Receba uma análise de perfil e recomendação vocacional
   - Visualize relatórios anteriores salvos

5. **Sair**: Clique no botão "Sair" no canto superior direito para voltar à tela inicial

## QR Code

Para gerar um QR code que aponte para seu site:

1. Deploy o site em um serviço como Vercel:
   ```bash
   npm install -g vercel
   vercel
   ```

2. Use um gerador de QR code online (como qr-code-generator.com) para criar um QR code com a URL do seu site

## Estrutura do Projeto

```
avaliacoes-jogadores/
├── app/
│   ├── page.tsx                    # Página inicial (formulário de nome)
│   ├── avaliacoes/
│   │   └── page.tsx                # Página de avaliações
│   ├── relatorios/
│   │   └── page.tsx                # Página de relatórios com IA
│   └── api/
│       └── generate-report/
│           └── route.ts            # API para gerar relatórios com GPT
├── lib/
│   └── supabase.ts                 # Configuração do cliente Supabase
├── .env.local                      # Variáveis de ambiente
└── SETUP_SUPABASE.md               # Instruções de configuração do banco
```

## Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Banco de dados e backend
- **OpenAI GPT-4** - IA para análise de perfil e recomendação vocacional
