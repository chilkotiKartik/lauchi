-- lockin. trigger functions are only ever run by their triggers; nobody needs to call them through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.limit_lab_setups() from public, anon, authenticated;
