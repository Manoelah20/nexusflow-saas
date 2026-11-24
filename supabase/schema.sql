-- Habilitar extensão UUID caso necessário
create extension if not exists "uuid-ossp";

-- 1. Tabela de Chaves de API (para autenticar webhooks externos)
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  key_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Regras de Automação
create table public.automations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  trigger_type text not null check (trigger_type in ('webhook', 'cron', 'db_event')),
  filter_condition jsonb default '{}'::jsonb,
  action_type text not null check (action_type in ('send_email', 'http_post', 'critical_alert')),
  action_config jsonb default '{}'::jsonb,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Logs de Execução (Conectada ao Realtime)
create table public.execution_logs (
  id uuid default uuid_generate_v4() primary key,
  automation_id uuid references public.automations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('success', 'failed', 'ignored')),
  payload_summary jsonb default '{}'::jsonb,
  latency_ms integer not null,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Realtime para logs ao vivo
alter publication supabase_realtime add table public.execution_logs;

-- Habilitar Row Level Security (RLS)
alter table public.api_keys enable row level security;
alter table public.automations enable row level security;
alter table public.execution_logs enable row level security;

-- Políticas de RLS (Isolamento por user_id)
create policy "Usuários gerenciam suas próprias api_keys" 
  on public.api_keys for all using (auth.uid() = user_id);

create policy "Usuários gerenciam suas próprias automations" 
  on public.automations for all using (auth.uid() = user_id);

create policy "Usuários leem seus próprios execution_logs" 
  on public.execution_logs for select using (auth.uid() = user_id);
