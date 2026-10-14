-- Esquema para guardar los datos en Supabase (compartidos por todo el equipo).
-- Ejecutar en Supabase → SQL Editor. Los nombres de columnas son la versión
-- snake_case de los campos de src/lib/types.ts.

create table if not exists personas (
  id uuid primary key,
  nombre text not null,
  rol text not null default '',
  color text not null default '#6366f1'
);

create table if not exists proyectos (
  id uuid primary key,
  codigo text not null default '',
  nombre text not null,
  cliente text not null default '',
  jefe_id uuid references personas(id) on delete set null,
  consultores_ids uuid[] not null default '{}',
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'planificacion',
  descripcion text not null default ''
);

create table if not exists hitos (
  id uuid primary key,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  nombre text not null,
  fecha_plan date,
  cumplido boolean not null default false,
  fecha_real date,
  notas text not null default '',
  orden int not null default 0
);

create table if not exists entregables (
  id uuid primary key,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  nombre text not null,
  fecha date not null,
  responsable_id uuid references personas(id) on delete set null,
  estado text not null default 'pendiente',
  notas text not null default ''
);

create table if not exists actividades (
  id uuid primary key,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  nombre text not null,
  inicio date not null,
  fin date not null,
  responsable_id uuid references personas(id) on delete set null,
  avance int not null default 0,
  orden int not null default 0
);

create table if not exists tareas (
  id uuid primary key,
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  titulo text not null,
  descripcion text not null default '',
  responsable_id uuid references personas(id) on delete set null,
  fecha_entrega date,
  estado text not null default 'por_hacer',
  prioridad text not null default 'media',
  orden int not null default 0
);

create table if not exists items_semana (
  id uuid primary key,
  semana date not null,
  persona_id uuid references personas(id) on delete set null,
  proyecto_id uuid references proyectos(id) on delete cascade,
  titulo text not null,
  prioridad text not null default 'media',
  hecho boolean not null default false
);

create table if not exists notas (
  id uuid primary key,
  ambito text not null default 'proyecto', -- 'proyecto' o 'cliente'
  proyecto_id uuid references proyectos(id) on delete set null,
  cliente text,
  titulo text not null default '',
  contenido text not null default '',
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);

-- Acceso: todo el equipo ve y edita todo, pero solo usuarios con sesión iniciada.
-- (Para una prueba rápida sin login se puede cambiar "authenticated" por "anon".)
do $$
declare t text;
begin
  foreach t in array array['personas','proyectos','hitos','entregables','actividades','tareas','items_semana','notas'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists equipo on %I', t);
    execute format('create policy equipo on %I for all to authenticated using (true) with check (true)', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
