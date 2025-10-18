# Configuração do Supabase

## 1. Criar conta e projeto no Supabase
1. Acesse https://supabase.com
2. Crie uma conta ou faça login
3. Crie um novo projeto

## 2. Criar as tabelas no banco de dados

Execute o seguinte SQL no SQL Editor do Supabase:

```sql
-- Tabela de jogadores
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de avaliações
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  target_player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de relatórios
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  analysis TEXT NOT NULL,
  vocational_recommendation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_reviews_target_player ON reviews(target_player_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reports_player ON reports(player_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir leitura e escrita para todos)
CREATE POLICY "Permitir leitura de jogadores" ON players FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de jogadores" ON players FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de avaliações" ON reviews FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de avaliações" ON reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de relatórios" ON reports FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de relatórios" ON reports FOR INSERT WITH CHECK (true);
```

## 3. Configurar variáveis de ambiente

1. No seu projeto Supabase, vá em Settings > API
2. Copie a `URL` do projeto
3. Copie a `anon/public` key
4. Obtenha sua chave da API do OpenAI em https://platform.openai.com/api-keys
5. Cole essas informações no arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
OPENAI_API_KEY=sua_chave_openai_aqui
```

## 4. Executar o projeto

```bash
npm run dev
```

Acesse http://localhost:3000
