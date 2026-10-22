# Security setup

The site has no server-side secrets any more (Junkie, SellAuth and the payment functions are gone), so there is
nothing to put in Vercel or GitHub secrets. The only values in `.env` are the public Supabase URL and anon key.

## 1. Revoke the old keys
`.env` used to be tracked by git, so assume the old SellAuth / Junkie / LuaProt keys leaked. Revoke each one in its
own dashboard. Deleting them from the project is not enough.

Then stop tracking the file (needs git):
```
git rm --cached .env
git commit -m "Stop tracking .env"
git push
```

## 2. Database
The schema, row level security and the `loader` edge function are applied to the Supabase project. SQL is kept in
`supabase/migrations/`. Admin = a normal Supabase account with a row in `user_roles` (role `admin`).

## 3. Loader
Admin panel > LOADER: paste the protected script, tick ENABLED, save. Executors run
`loadstring(game:HttpGet("<SUPABASE_URL>/functions/v1/loader"))()`.
