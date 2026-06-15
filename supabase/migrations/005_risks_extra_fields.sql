alter table risks
  add column if not exists owner      text,
  add column if not exists due        date,
  add column if not exists source     text;
