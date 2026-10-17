-- Extensión futura: fuera del directorio de migraciones activas.
-- Aplicar después de core y solo cuando se implemente el backend social.
begin;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references public.profiles(user_id) on delete cascade,
  user_high uuid not null references public.profiles(user_id) on delete cascade,
  requested_by uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  blocked_by uuid references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (user_low < user_high),
  check (requested_by in (user_low, user_high)),
  check (blocked_by is null or blocked_by in (user_low, user_high)),
  check ((status = 'blocked') = (blocked_by is not null)),
  unique (user_low, user_high),
  unique (id, user_low, user_high)
);

create table public.duo_streaks (
  id uuid primary key default gen_random_uuid(),
  friendship_id uuid not null,
  user_low uuid not null,
  user_high uuid not null,
  shared_time_zone text not null,
  status text not null check (status in ('active','ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key (friendship_id, user_low, user_high)
    references public.friendships(id, user_low, user_high) on delete cascade,
  unique (id, user_low, user_high),
  check ((status = 'ended') = (ended_at is not null)),
  check (ended_at is null or ended_at >= started_at)
);
create unique index duo_one_active_idx on public.duo_streaks(friendship_id) where status = 'active';

create table public.duo_streak_days (
  duo_id uuid not null,
  shared_date date not null,
  user_low uuid not null,
  user_high uuid not null,
  low_attempt_id uuid,
  high_attempt_id uuid,
  low_qualified_at timestamptz,
  high_qualified_at timestamptz,
  completed_at timestamptz,
  rule_version text not null,
  primary key (duo_id, shared_date),
  foreign key (duo_id, user_low, user_high)
    references public.duo_streaks(id, user_low, user_high) on delete cascade,
  foreign key (low_attempt_id, user_low) references public.lesson_attempts(id, user_id) on delete cascade,
  foreign key (high_attempt_id, user_high) references public.lesson_attempts(id, user_id) on delete cascade,
  check ((low_attempt_id is null) = (low_qualified_at is null)),
  check ((high_attempt_id is null) = (high_qualified_at is null)),
  check ((completed_at is not null) = (low_qualified_at is not null and high_qualified_at is not null))
);

do $$
declare social_table text;
begin
  foreach social_table in array array['friendships','duo_streaks','duo_streak_days'] loop
    execute format('alter table public.%I enable row level security', social_table);
    execute format('revoke all on public.%I from public, anon, authenticated', social_table);
    execute format('grant select on public.%I to authenticated', social_table);
    execute format('grant all on public.%I to service_role', social_table);
    execute format('create policy members_read on public.%I for select to authenticated using ((select auth.uid()) in (user_low, user_high))', social_table);
    execute format('create index %I on public.%I(user_low)', social_table || '_low_idx', social_table);
    execute format('create index %I on public.%I(user_high)', social_table || '_high_idx', social_table);
  end loop;
end $$;
create index duo_friendship_members_idx on public.duo_streaks(friendship_id, user_low, user_high);
create index duo_days_low_attempt_idx on public.duo_streak_days(low_attempt_id, user_low);
create index duo_days_high_attempt_idx on public.duo_streak_days(high_attempt_id, user_high);

-- Backend: solo receptor acepta; solo quien bloqueó desbloquea; cerrar duo
-- al bloquear, en la misma transacción. Verificar friendship.status='accepted'
-- antes de crear duo. Registrar aceptación de zona y calcular la fecha en server.
-- Exponer resumen social mínimo: estas policies no autorizan leer las sesiones,
-- audio, perfiles completos ni transcripts del otro miembro.
commit;
