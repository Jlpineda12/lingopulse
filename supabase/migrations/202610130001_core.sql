-- Diseño inicial para una instancia nueva de Supabase/PostgreSQL.
-- Ejecutar como propietario de migraciones. No se ha desplegado.
-- Todas las escrituras de producto pasan por backend autenticado.
-- auth.users, auth.uid(), anon/authenticated/service_role son de Supabase.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  preferred_locale text not null default 'en-US' check (preferred_locale in ('en-US', 'en-GB')),
  time_zone text not null default 'America/Bogota', -- validar contra pg_timezone_names en API
  approximate_level text check (approximate_level in ('A1','A2','B1','B2','C1','C2')),
  voice_consent_version text,
  voice_consent_at timestamptz,
  retain_audio boolean not null default false,
  created_at timestamptz not null default now(),
  check ((voice_consent_version is null) = (voice_consent_at is null))
);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  track text not null check (track in ('progression','fluency_gym')),
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  position integer not null check (position > 0),
  unique (track, cefr_level, position)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id),
  slug text not null,
  version integer not null check (version > 0),
  locale text not null check (locale in ('en-US','en-GB')),
  title text not null,
  real_life_topic text not null,
  communicative_goal text not null,
  grammar_focus text not null,
  position integer not null check (position > 0),
  is_checkpoint boolean not null default false,
  published_at timestamptz,
  public_content jsonb not null check (jsonb_typeof(public_content) = 'object'),
  -- Solo textos/audio modelo/consignas; respuestas y rúbricas van en private.
  created_at timestamptz not null default now(),
  unique (slug, version, locale),
  unique (unit_id, position, version, locale)
);

create table public.lexical_targets (
  id uuid primary key default gen_random_uuid(),
  canonical_form text not null,
  sense_key text not null,
  meaning_en text not null,
  usage_notes text,
  unique (canonical_form, sense_key)
);

create table public.lesson_targets (
  lesson_id uuid not null references public.lessons(id),
  target_id uuid not null references public.lexical_targets(id),
  target_role text not null check (target_role in ('primary','support','review')),
  primary key (lesson_id, target_id)
);
create unique index lesson_one_primary_target on public.lesson_targets(lesson_id)
  where target_role = 'primary'; -- API de publicación exige exactamente uno.
create index lesson_targets_target_idx on public.lesson_targets(target_id);

create table private.arena_configs (
  lesson_id uuid primary key references public.lessons(id),
  prompt_version text not null,
  rubric_version text not null,
  lesson_config jsonb not null check (jsonb_typeof(lesson_config) = 'object'),
  rubric jsonb not null check (jsonb_typeof(rubric) = 'object')
);
-- Este schema no debe exponerse en PostgREST. Acceso desde SQL de servidor
-- o una función estrecha y autorizada, nunca por consultas libres del cliente.

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  lesson_id uuid not null references public.lessons(id),
  request_id uuid not null,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed','abandoned')),
  completed_phases text[] not null default '{}'
    check (completed_phases <@ array['anatomy','input','writing','voice']::text[]),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, request_id),
  unique (id, user_id),
  unique (id, user_id, lesson_id),
  check ((status = 'completed') = (completed_at is not null)),
  check (completed_at is null or completed_at >= started_at)
);
create index lesson_attempts_user_lesson_idx on public.lesson_attempts(user_id, lesson_id, started_at desc);

create table public.writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  attempt_id uuid not null,
  request_id uuid not null,
  original_text text not null check (char_length(original_text) between 1 and 10000),
  evaluation_status text not null default 'pending'
    check (evaluation_status in ('pending','ready','failed')),
  feedback jsonb,
  evaluator_version text,
  submitted_at timestamptz not null default now(),
  foreign key (attempt_id, user_id) references public.lesson_attempts(id, user_id) on delete cascade,
  unique (id, user_id),
  unique (user_id, request_id),
  check (evaluation_status <> 'ready' or (feedback is not null and evaluator_version is not null))
);
create index writing_attempt_idx on public.writing_submissions(attempt_id, user_id);

create table public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  attempt_id uuid not null,
  lesson_id uuid not null,
  request_id uuid not null,
  locale text not null check (locale in ('en-US','en-GB')),
  status text not null default 'created'
    check (status in ('created','active','processing','completed','failed','cancelled')),
  interaction_budget_ms integer not null check (interaction_budget_ms between 60000 and 90000),
  active_interaction_ms integer not null default 0 check (active_interaction_ms >= 0),
  prompt_version text not null,
  rubric_version text not null,
  processing_consent_version text not null,
  processing_consented_at timestamptz not null,
  retain_audio boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (attempt_id, user_id, lesson_id)
    references public.lesson_attempts(id, user_id, lesson_id) on delete cascade,
  unique (user_id, request_id),
  unique (id, user_id),
  unique (id, user_id, lesson_id),
  check (ended_at is null or (started_at is not null and ended_at >= started_at))
);
create index voice_sessions_attempt_idx on public.voice_sessions(attempt_id, user_id, lesson_id);

create table public.voice_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null,
  request_id uuid not null,
  turn_index integer not null check (turn_index >= 0),
  speaker text not null check (speaker in ('learner','agent')),
  transcript text,
  words jsonb check (words is null or jsonb_typeof(words) = 'array'),
  -- words: [{word,start_ms,end_ms,confidence}]; nunca hipótesis STT parciales.
  audio_status text not null default 'pending'
    check (audio_status in ('pending','usable','uncertain','unusable')),
  response_window_ms integer check (response_window_ms > 0),
  voiced_ms integer check (voiced_ms >= 0),
  word_count integer check (word_count >= 0),
  stt_provider text,
  stt_model_version text,
  stt_confidence numeric(5,4) check (stt_confidence between 0 and 1),
  audio_object_path text,
  audio_expires_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.voice_sessions(id, user_id) on delete cascade,
  unique (session_id, turn_index),
  unique (user_id, request_id),
  unique (id, user_id, speaker),
  unique (id, session_id, user_id, speaker),
  check ((audio_object_path is null) = (audio_expires_at is null)),
  check (voiced_ms is null or response_window_ms is null or voiced_ms <= response_window_ms)
);
create index voice_turns_session_idx on public.voice_turns(session_id, user_id);

create table public.voice_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid not null,
  lesson_id uuid not null,
  evaluation_key text not null, -- estable para reintentos del mismo job
  is_current boolean not null default true,
  status text not null check (status in ('pending','ready','insufficient_audio','failed')),
  evaluator_version text not null,
  model_version text not null,
  rubric_version text not null,
  acoustic_algorithm_version text,
  learner_word_count integer check (learner_word_count >= 0),
  learner_response_ms bigint check (learner_response_ms > 0),
  learner_voiced_ms bigint check (learner_voiced_ms >= 0),
  wpm numeric generated always as
    (60000.0 * learner_word_count / nullif(learner_response_ms, 0)) stored,
  filler_count integer check (filler_count >= 0),
  pause_count integer check (pause_count >= 0),
  communicative_score smallint check (communicative_score between 0 and 4),
  target_score smallint check (target_score between 0 and 4),
  grammar_score smallint check (grammar_score between 0 and 4),
  -- Extensión acústica: NULL en el MVP hasta su calibración.
  pronunciation_score numeric(5,2) check (pronunciation_score between 0 and 100),
  pronunciation_provider text,
  pronunciation_locale text check (pronunciation_locale in ('en-US','en-GB')),
  feedback jsonb,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id, lesson_id)
    references public.voice_sessions(id, user_id, lesson_id) on delete cascade,
  unique (session_id, evaluation_key),
  unique (id, session_id, user_id, lesson_id),
  check (learner_voiced_ms is null or learner_response_ms is null or learner_voiced_ms <= learner_response_ms),
  check (pronunciation_score is null or (pronunciation_provider is not null and pronunciation_locale is not null))
);
create unique index voice_evaluations_current_idx on public.voice_evaluations(session_id) where is_current;
create index voice_evaluations_session_owner_idx on public.voice_evaluations(session_id, user_id, lesson_id);

create table public.target_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  evaluation_id uuid not null,
  session_id uuid not null,
  lesson_id uuid not null,
  target_id uuid not null,
  turn_id uuid not null,
  speaker text not null default 'learner' check (speaker = 'learner'),
  quote text not null check (char_length(quote) > 0),
  use_status text not null check (use_status in ('correct','incorrect','not_observed','uncertain')),
  grammar_status text not null check (grammar_status in ('correct','incorrect','not_applicable','uncertain')),
  assistance text not null check (assistance in ('none','contextual','lexical','model_answer')),
  -- API comprueba que quote sea fragmento literal de la transcripción final.
  -- not_observed permite citar una paráfrasis y registrar fallo de recuperación.
  foreign key (evaluation_id, session_id, user_id, lesson_id)
    references public.voice_evaluations(id, session_id, user_id, lesson_id) on delete cascade,
  foreign key (turn_id, session_id, user_id, speaker)
    references public.voice_turns(id, session_id, user_id, speaker) on delete cascade,
  foreign key (lesson_id, target_id) references public.lesson_targets(lesson_id, target_id),
  unique (evaluation_id, target_id, turn_id),
  unique (id, user_id, target_id)
);
create index target_evidence_turn_idx on public.target_evidence(turn_id, session_id, user_id, speaker);
create index target_evidence_target_idx on public.target_evidence(lesson_id, target_id);

create table public.user_target_memory (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  target_id uuid not null references public.lexical_targets(id),
  modality text not null check (modality in ('speaking','writing')),
  scheduler_version text not null,
  scheduler_parameters jsonb not null check (jsonb_typeof(scheduler_parameters) = 'object'),
  state text not null default 'new' check (state in ('new','learning','review','relearning')),
  stability_days double precision check (stability_days > 0),
  difficulty double precision check (difficulty between 1 and 10),
  desired_retention numeric(5,4) not null default 0.90 check (desired_retention > 0 and desired_retention < 1),
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  review_count integer not null default 0 check (review_count >= 0),
  lapse_count integer not null default 0 check (lapse_count between 0 and review_count),
  primary key (user_id, target_id, modality)
);
create index user_target_due_idx on public.user_target_memory(user_id, due_at);

create table public.target_review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_id uuid not null,
  modality text not null,
  request_id uuid not null,
  voice_evidence_id uuid,
  writing_submission_id uuid,
  rating smallint not null check (rating between 1 and 4), -- Again/Hard/Good/Easy
  assistance text not null check (assistance in ('none','contextual','lexical','model_answer')),
  scheduler_version text not null,
  rating_rule_version text not null,
  previous_state jsonb not null,
  next_state jsonb not null,
  reviewed_at timestamptz not null default now(),
  foreign key (user_id, target_id, modality)
    references public.user_target_memory(user_id, target_id, modality) on delete cascade,
  foreign key (voice_evidence_id, user_id, target_id)
    references public.target_evidence(id, user_id, target_id) on delete cascade,
  foreign key (writing_submission_id, user_id)
    references public.writing_submissions(id, user_id) on delete cascade,
  unique (user_id, request_id),
  check ((modality = 'speaking' and voice_evidence_id is not null and writing_submission_id is null)
      or (modality = 'writing' and writing_submission_id is not null and voice_evidence_id is null))
);
create index target_review_evidence_idx on public.target_review_events(voice_evidence_id, user_id, target_id);
create index target_review_writing_idx on public.target_review_events(writing_submission_id, user_id);
create index target_review_history_idx on public.target_review_events(user_id, target_id, modality, reviewed_at desc);

create table public.pets (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  pet_name text not null check (char_length(pet_name) between 1 and 50),
  visual_stage text not null default 'starter', -- etapa estética, no nivel certificado
  cosmetic_config jsonb not null default '{}'::jsonb check (jsonb_typeof(cosmetic_config) = 'object'),
  created_at timestamptz not null default now()
);

create table public.speech_fuel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.pets(user_id) on delete cascade,
  turn_id uuid not null unique,
  speaker text not null default 'learner' check (speaker = 'learner'),
  credited_voiced_ms integer not null check (credited_voiced_ms > 0),
  rule_version text not null,
  awarded_at timestamptz not null default now(),
  foreign key (turn_id, user_id, speaker) references public.voice_turns(id, user_id, speaker) on delete cascade
  -- Worker: solo audio usable/final, límite por día y <= duración verificada.
);

create table public.activity_days (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  local_date date not null,
  time_zone_snapshot text not null,
  qualifying_attempt_id uuid not null,
  qualifying_voiced_ms integer not null check (qualifying_voiced_ms >= 30000),
  rule_version text not null,
  qualified_at timestamptz not null default now(),
  primary key (user_id, local_date),
  foreign key (qualifying_attempt_id, user_id) references public.lesson_attempts(id, user_id) on delete cascade
  -- Worker verifica las cuatro fases, actividad real, zona y fecha.
);
create index activity_attempt_idx on public.activity_days(qualifying_attempt_id, user_id);

-- Permisos explícitos y RLS: lectura propia; ninguna escritura directa del móvil.
do $$
declare
  owned_table text;
begin
  foreach owned_table in array array[
    'profiles','lesson_attempts','writing_submissions','voice_sessions',
    'voice_turns','voice_evaluations','target_evidence','user_target_memory',
    'target_review_events','pets','speech_fuel_events','activity_days'
  ] loop
    execute format('alter table public.%I enable row level security', owned_table);
    execute format('revoke all on public.%I from public, anon, authenticated', owned_table);
    execute format('grant select on public.%I to authenticated', owned_table);
    execute format('grant all on public.%I to service_role', owned_table);
    execute format('create policy own_read on public.%I for select to authenticated using (user_id = (select auth.uid()))', owned_table);
    execute format('create index %I on public.%I(user_id)', owned_table || '_owner_idx', owned_table);
  end loop;
end $$;

alter table public.curriculum_units enable row level security;
alter table public.lessons enable row level security;
alter table public.lexical_targets enable row level security;
alter table public.lesson_targets enable row level security;
revoke all on public.curriculum_units, public.lessons, public.lexical_targets, public.lesson_targets from public, anon, authenticated;
grant select on public.curriculum_units, public.lessons, public.lexical_targets, public.lesson_targets to authenticated;
grant all on public.curriculum_units, public.lessons, public.lexical_targets, public.lesson_targets to service_role;
create policy published_lessons_read on public.lessons for select to authenticated
  using (published_at is not null and published_at <= now());
create policy published_units_read on public.curriculum_units for select to authenticated
  using (exists (select 1 from public.lessons l where l.unit_id = curriculum_units.id and l.published_at <= now()));
create policy published_lesson_targets_read on public.lesson_targets for select to authenticated
  using (exists (select 1 from public.lessons l where l.id = lesson_targets.lesson_id and l.published_at <= now()));
create policy published_targets_read on public.lexical_targets for select to authenticated
  using (exists (select 1 from public.lesson_targets lt join public.lessons l on l.id = lt.lesson_id
    where lt.target_id = lexical_targets.id and l.published_at <= now()));
alter table private.arena_configs enable row level security;
revoke all on private.arena_configs from public, anon, authenticated;
grant all on private.arena_configs to service_role;

-- Storage necesita configuración aparte: bucket privado, uploads autorizados,
-- URLs firmadas breves y job de expiración. Este DDL no crea esos endpoints.
-- Publicación curricular, rewards/FSRS/racha y cambios de zona requieren API
-- con validación y transacciones. secret/service_role no se expone al cliente.
commit;
