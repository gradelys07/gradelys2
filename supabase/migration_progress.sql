-- Migration pour la fonctionnalité de Personnalisation (Learning Profile)
alter table profiles add column if not exists learning_profile jsonb default '{}'::jsonb;
