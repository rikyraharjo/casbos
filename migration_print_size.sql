-- Tambah kolom print_size ke tenants
alter table tenants add column if not exists print_size text default '80mm' check (print_size in ('58mm', '80mm'));
