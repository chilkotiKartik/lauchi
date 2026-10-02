-- Grant execute on quiz functions to authenticated users as well as service_role
grant execute on function public.start_quiz_session(uuid, text, integer, integer, text, text, integer) to authenticated;
grant execute on function public.record_answer(uuid, uuid, integer, jsonb, boolean) to authenticated;
grant execute on function public.record_answer_tagged(uuid, uuid, integer, jsonb, boolean, integer, integer, integer) to authenticated;
grant execute on function public.finish_quiz_session(uuid, uuid) to authenticated;
