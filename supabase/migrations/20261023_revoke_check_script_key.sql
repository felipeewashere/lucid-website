-- Key checks go through the check-key edge function (LuaProt) now. The old RPC let anyone test keys against script_keys.
revoke execute on function public.check_script_key(text) from public, anon, authenticated;
