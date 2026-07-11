-- Run in Supabase SQL editor if datasets table is missing example_count.

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'datasets'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'datasets'
        and column_name = 'examples_count'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'datasets'
        and column_name = 'example_count'
    ) then
      alter table public.datasets rename column examples_count to example_count;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'datasets'
        and column_name = 'count'
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'datasets'
        and column_name = 'example_count'
    ) then
      alter table public.datasets rename column count to example_count;
    end if;

    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'datasets'
        and column_name = 'example_count'
    ) then
      alter table public.datasets
        add column example_count integer not null default 0 check (example_count >= 0);
    end if;
  end if;
end $$;
