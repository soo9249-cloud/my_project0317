-- 변경 이유: 초대코드 참여를 teams SELECT RLS에 막히지 않게 서버 함수(SECURITY DEFINER)로 처리
begin;

create or replace function public.join_team_by_invite_code(
  p_invite_code text,
  p_nickname text
)
returns table(status text, team_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_team_id uuid;
  v_team_member_count integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    return query select 'unauthenticated'::text, null::uuid;
    return;
  end if;

  select t.id
  into v_team_id
  from public.teams t
  where t.invite_code = upper(trim(p_invite_code))
  limit 1;

  if v_team_id is null then
    return query select 'invalid_code'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.team_members tm
    where tm.team_id = v_team_id
      and tm.user_id = v_uid
  ) then
    return query select 'already_member'::text, v_team_id;
    return;
  end if;

  select count(*)
  into v_team_member_count
  from public.team_members tm
  where tm.team_id = v_team_id;

  if v_team_member_count >= 10 then
    return query select 'team_full'::text, v_team_id;
    return;
  end if;

  insert into public.team_members (team_id, user_id, nickname)
  values (v_team_id, v_uid, nullif(trim(p_nickname), ''));

  return query select 'ok'::text, v_team_id;
end;
$$;

revoke all on function public.join_team_by_invite_code(text, text) from public;
grant execute on function public.join_team_by_invite_code(text, text) to authenticated;

commit;
