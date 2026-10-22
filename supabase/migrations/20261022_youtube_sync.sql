-- Hourly YouTube -> showcases sync: pg_cron calls the sync-youtube edge function, which adds new uploads from
-- youtube.com/@OffLucidgg to public.showcases. Safe to re-run.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('sync-youtube') where exists (select 1 from cron.job where jobname = 'sync-youtube');
select cron.schedule(
  'sync-youtube',
  '7 * * * *',
  $$ select net.http_post(url := 'https://olqvhlfcqbdfwdwoigsp.supabase.co/functions/v1/sync-youtube',
                          headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb) $$
);
