-- Read-only installation checks. Run in Supabase SQL Editor after all migrations.
-- Expected: every row has ok = true. Does NOT prove cross-user RLS isolation.
with expected_tables(name) as (
  values ('profiles'), ('player_stats'), ('runs'), ('saved_runs')
), expected_functions(signature) as (
  values ('public.player_grade(bigint,integer)'),
         ('public.leaderboard(text,integer)'),
         ('public.set_profile_name(text)'),
         ('public.record_run(text,integer,integer,integer,integer,integer,integer,real,real,boolean,jsonb)')
)
select 'table: ' || t.name as check_name,
       to_regclass('public.' || t.name) is not null as ok
from expected_tables t
union all
select 'RLS: ' || t.name,
       coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = t.name), false)
from expected_tables t
union all
select 'policies: ' || t.name,
       exists(select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.name)
from expected_tables t
union all
select 'function: ' || f.signature, to_regprocedure(f.signature) is not null
from expected_functions f
union all
select 'auth.users profile trigger', exists (
  select 1 from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  join pg_namespace n on n.oid = p.pronamespace
  where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
    and t.tgenabled <> 'D' and n.nspname = 'public' and p.proname = 'handle_new_user'
)
order by check_name;

select public.player_grade(0, 0) as initial_grade; -- RECRUE
select * from public.leaderboard('solo', 8); -- Empty is valid on a fresh database.
