// Public URL of the loader edge function (supabase/functions/loader). The script behind it is edited in Admin > Loader.
export const LOADER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/loader`;

export const LOADER_LINE = `loadstring(game:HttpGet("${LOADER_URL}"))()`;
