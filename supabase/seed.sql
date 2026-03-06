-- ============================================================
-- SEED DATA - TelecomOps Demo
-- Ejecutar DESPUÉS de crear los usuarios en Supabase Auth
-- y de correr schema.sql
-- ============================================================

-- IMPORTANTE: Reemplazar los UUIDs con los IDs reales de los
-- usuarios creados en Supabase Auth → Authentication → Users

-- Ejemplo de inserción de perfiles (reemplazar UUIDs):
/*
INSERT INTO public.users (id, email, name, role) VALUES
  ('UUID-DEL-PMO',       'pmo@empresa.com',      'PMO Admin',    'admin'),
  ('UUID-DE-ALEXIS',     'alexis@empresa.com',   'Alexis García','controller'),
  ('UUID-DE-MARCELO',    'marcelo@empresa.com',  'Marcelo López','im_swap'),
  ('UUID-DE-EDUARDO',    'eduardo@empresa.com',  'Eduardo Ruiz', 'im_tss'),
  ('UUID-DE-LEANDRO',    'leandro@empresa.com',  'Leandro Sosa', 'backoffice'),
  ('UUID-DEL-JEFE',      'jefe@empresa.com',     'Jefe Viewer',  'viewer');
*/

-- ============================================================
-- DESPLIEGUES DE MUESTRA (ajustar im_assigned a UUIDs reales)
-- ============================================================

-- Para probar sin usuarios reales, usá este bloque con UUIDs ficticios
-- Solo funciona si ya insertaste los users arriba

DO $$
DECLARE
  v_im_swap UUID;
  v_im_tss  UUID;
BEGIN
  SELECT id INTO v_im_swap FROM public.users WHERE role = 'im_swap' LIMIT 1;
  SELECT id INTO v_im_tss  FROM public.users WHERE role = 'im_tss'  LIMIT 1;

  -- Despliegues SWAP
  INSERT INTO public.deployments (site_code, site_name, region, province, technology, type, status, im_assigned, planned_date, priority, progress_pct, notes) VALUES
    ('BUE-0142', 'Palermo Central',      'GBA Norte',  'Buenos Aires', '4G',  'SWAP',      'DONE',        v_im_swap, '2026-02-15', 'HIGH',   100, 'Completado sin novedades'),
    ('BUE-0287', 'Caballito Este',       'AMBA',       'CABA',         '5G',  'SWAP',      'IN_PROGRESS', v_im_swap, '2026-03-10', 'HIGH',    60, 'En progreso, falta integración de radio'),
    ('BUE-0391', 'Lomas del Mirador',    'GBA Sur',    'Buenos Aires', '4G',  'SWAP',      'PENDING',     v_im_swap, '2026-03-20', 'MEDIUM',   0, 'Pendiente acceso al sitio'),
    ('BUE-0512', 'Quilmes Centro',       'GBA Sur',    'Buenos Aires', '4G',  'SWAP',      'BLOCKED',     v_im_swap, '2026-03-08', 'CRITICAL', 30, 'Bloqueado por falta de material RRU'),
    ('BUE-0634', 'San Isidro Norte',     'GBA Norte',  'Buenos Aires', '5G',  'SWAP',      'PENDING',     v_im_swap, '2026-03-25', 'MEDIUM',   0, NULL),

  -- Despliegues TSS
    ('COR-0088', 'Córdoba Centro',       'Centro',     'Córdoba',      '4G',  'TSS',       'DONE',        v_im_tss,  '2026-02-20', 'HIGH',   100, 'Finalizado exitosamente'),
    ('COR-0112', 'Villa Carlos Paz',     'Centro',     'Córdoba',      '4G',  'TSS',       'IN_PROGRESS', v_im_tss,  '2026-03-05', 'HIGH',    75, 'Falta prueba de aceptación'),
    ('ROS-0045', 'Rosario Puerto',       'Litoral',    'Santa Fe',     '5G',  'TSS',       'PENDING',     v_im_tss,  '2026-03-18', 'MEDIUM',   0, NULL),
    ('ROS-0078', 'Rosario Oeste',        'Litoral',    'Santa Fe',     '4G',  'TSS',       'IN_PROGRESS', v_im_tss,  '2026-03-12', 'MEDIUM',  45, NULL),
    ('MDZ-0033', 'Mendoza Godoy Cruz',   'Cuyo',       'Mendoza',      '4G',  'TSS',       'BLOCKED',     v_im_tss,  '2026-03-01', 'HIGH',    20, 'Problema de acceso municipal'),

  -- Cleanups y otros
    ('BUE-0155', 'Once Sur',             'AMBA',       'CABA',         '3G',  'CLEANUP',   'DONE',        v_im_swap, '2026-02-10', 'LOW',    100, NULL),
    ('BUE-0299', 'La Matanza Norte',     'GBA Oeste',  'Buenos Aires', '4G',  'CLEANUP',   'IN_PROGRESS', v_im_swap, '2026-03-14', 'MEDIUM',  50, NULL),
    ('TUC-0021', 'Tucumán Centro',       'NOA',        'Tucumán',      '4G',  'INTEGRACION','PENDING',    v_im_tss,  '2026-03-28', 'LOW',      0, 'Integración nueva antena'),
    ('MDP-0067', 'Mar del Plata Centro', 'Costa',      'Buenos Aires', '5G',  'SWAP',      'PENDING',     v_im_swap, '2026-04-02', 'MEDIUM',   0, NULL),
    ('BUE-0744', 'Tigre Centro',         'GBA Norte',  'Buenos Aires', '4G',  'TSS',       'DONE',        v_im_tss,  '2026-02-28', 'LOW',    100, NULL);

  RAISE NOTICE 'Despliegues insertados OK';
END $$;

-- ============================================================
-- TAREAS KANBAN
-- ============================================================
DO $$
DECLARE
  v_swap_dep UUID;
  v_tss_dep  UUID;
  v_blocked  UUID;
  v_im_swap  UUID;
  v_im_tss   UUID;
BEGIN
  SELECT id INTO v_swap_dep FROM public.deployments WHERE site_code = 'BUE-0287' LIMIT 1;
  SELECT id INTO v_tss_dep  FROM public.deployments WHERE site_code = 'COR-0112' LIMIT 1;
  SELECT id INTO v_blocked  FROM public.deployments WHERE site_code = 'BUE-0512' LIMIT 1;
  SELECT id INTO v_im_swap  FROM public.users WHERE role = 'im_swap'  LIMIT 1;
  SELECT id INTO v_im_tss   FROM public.users WHERE role = 'im_tss'   LIMIT 1;

  INSERT INTO public.tasks (deployment_id, title, description, status, assigned_to, priority, due_date, sort_order) VALUES
    (v_swap_dep, 'Verificar potencia de señal post-swap',  'Medir RSRP y RSRQ en todos los sectores',   'IN_PROGRESS', v_im_swap, 'HIGH',     '2026-03-12', 1),
    (v_swap_dep, 'Configurar parámetros de red',            'Aplicar template de parámetros acordado',   'TODO',        v_im_swap, 'HIGH',     '2026-03-14', 2),
    (v_swap_dep, 'Prueba de aceptación con cliente',        'Drive test con representante del cliente',  'TODO',        v_im_swap, 'MEDIUM',   '2026-03-15', 3),
    (v_tss_dep,  'Reemplazar módulo BBU sector 2',          NULL,                                        'DONE',        v_im_tss,  'CRITICAL', '2026-03-05', 1),
    (v_tss_dep,  'Actualizar firmware a v23.4.1',           'Ventana de mantenimiento 2am-4am',          'IN_PROGRESS', v_im_tss,  'HIGH',     '2026-03-11', 2),
    (v_tss_dep,  'Documentar intervención en sistema',      NULL,                                        'TODO',        v_im_tss,  'LOW',      '2026-03-16', 3),
    (v_blocked,  'Solicitar RRU al depósito central',       'Se necesitan 3 unidades RRU B3',            'BLOCKED',     v_im_swap, 'CRITICAL', '2026-03-09', 1),
    (NULL,       'Actualizar planillas de seguimiento',     'Planillas de avance semana 10',             'TODO',        NULL,      'LOW',      '2026-03-14', 4),
    (NULL,       'Coordinar guardia de finde semana',       'Necesitamos IM disponible sábado',          'IN_PROGRESS', v_im_tss,  'MEDIUM',   '2026-03-15', 5),
    (NULL,       'Revisar OT pendientes de facturación',    NULL,                                        'TODO',        NULL,      'MEDIUM',   '2026-03-20', 6);

  RAISE NOTICE 'Tareas insertadas OK';
END $$;

-- ============================================================
-- STOCK
-- ============================================================
INSERT INTO public.stock_items (code, name, category, unit, quantity_total, quantity_available, quantity_reserved, min_stock, location) VALUES
  ('RRU-B3-4T4R',  'RRU Band 3 4T4R Huawei',     'Radio',      'UN',  24, 8,  4, 10, 'Depósito A - Estante 3'),
  ('RRU-B7-2T2R',  'RRU Band 7 2T2R Ericsson',    'Radio',      'UN',  15, 3,  2, 5,  'Depósito A - Estante 4'),
  ('BBU-3900',     'BBU 3900 Huawei',             'Baseband',   'UN',  10, 6,  1, 3,  'Depósito B - Armario 1'),
  ('BBU-5900',     'BBU 5900 5G Huawei',          'Baseband',   'UN',   6, 2,  2, 4,  'Depósito B - Armario 1'),
  ('ANT-65-18',    'Antena 65° 18dBi 4G',         'Antena',     'UN',  30, 14, 6, 8,  'Depósito A - Zona Antenas'),
  ('CBL-7/8-50',   'Cable coaxial 7/8" x50m',     'Cableado',   'MT', 500, 120,30, 100,'Depósito C - Rollos'),
  ('CON-DIN716',   'Conector DIN 7/16 macho',     'Cableado',   'UN', 200, 45, 10, 50, 'Depósito C - Caja 12'),
  ('UPS-3KVA',     'UPS 3KVA APC',                'Energía',    'UN',   8, 5,  1, 2,  'Depósito B - Zona Energía'),
  ('BAT-12V-100',  'Batería 12V 100Ah GEL',       'Energía',    'UN',  40, 12, 8, 10, 'Depósito B - Zona Batería'),
  ('GPS-ANT-EXT',  'Antena GPS externa',           'Accesorios', 'UN',  20, 18, 0, 5,  'Depósito A - Estante 7'),
  ('SFP-10G',      'Módulo SFP+ 10G',             'Red',        'UN',  50, 8,  4, 15, 'Depósito A - Estante 1'),
  ('FIBRA-SM-50',  'Cable fibra SM x50m',          'Red',        'MT', 300, 75, 20, 50, 'Depósito C - Rollos');

-- Movimientos de stock de ejemplo
DO $$
DECLARE
  v_rru    UUID;
  v_bbu    UUID;
  v_ant    UUID;
  v_user   UUID;
  v_dep    UUID;
BEGIN
  SELECT id INTO v_rru  FROM public.stock_items WHERE code = 'RRU-B3-4T4R' LIMIT 1;
  SELECT id INTO v_bbu  FROM public.stock_items WHERE code = 'BBU-3900' LIMIT 1;
  SELECT id INTO v_ant  FROM public.stock_items WHERE code = 'ANT-65-18' LIMIT 1;
  SELECT id INTO v_user FROM public.users WHERE role IN ('im_swap', 'im_tss') LIMIT 1;
  SELECT id INTO v_dep  FROM public.deployments WHERE site_code = 'BUE-0287' LIMIT 1;

  INSERT INTO public.stock_movements (stock_item_id, type, quantity, deployment_id, reference_number, notes, user_id) VALUES
    (v_rru,  'OUT',    3,    v_dep, 'OT-2026-0312', 'Salida para SWAP BUE-0287',          v_user),
    (v_bbu,  'OUT',    1,    v_dep, 'OT-2026-0313', 'BBU para integración',               v_user),
    (v_ant,  'OUT',    3,    v_dep, 'OT-2026-0314', 'Antenas sector A/B/C',               v_user),
    (v_rru,  'IN',     12,   NULL,  'REM-2026-0089', 'Recepción desde proveedor',         v_user),
    (v_rru,  'RETURN', 2,    NULL,  'DEV-2026-0022', 'Devolución de sitio COR-0088',      v_user),
    (v_bbu,  'IN',     5,    NULL,  'REM-2026-0090', 'Reposición stock BBU',              v_user);

  RAISE NOTICE 'Stock y movimientos insertados OK';
END $$;

-- ============================================================
-- HORAS IMPRODUCTIVAS
-- ============================================================
DO $$
DECLARE
  v_im_swap UUID;
  v_im_tss  UUID;
  v_dep1    UUID;
  v_dep2    UUID;
BEGIN
  SELECT id INTO v_im_swap FROM public.users WHERE role = 'im_swap' LIMIT 1;
  SELECT id INTO v_im_tss  FROM public.users WHERE role = 'im_tss'  LIMIT 1;
  SELECT id INTO v_dep1    FROM public.deployments WHERE site_code = 'BUE-0391' LIMIT 1;
  SELECT id INTO v_dep2    FROM public.deployments WHERE site_code = 'MDZ-0033' LIMIT 1;

  INSERT INTO public.unproductive_hours (user_id, date, hours, category, description, deployment_id) VALUES
    (v_im_swap, '2026-02-24', 4,   'ACCESO',          'No se pudo ingresar al sitio, propietario no disponible', v_dep1),
    (v_im_swap, '2026-02-26', 3,   'ESPERA_MATERIAL', 'RRUs no llegaron a tiempo, esperamos en sitio',           v_dep1),
    (v_im_swap, '2026-03-03', 2,   'CLIMA',           'Tormenta eléctrica, trabajo suspendido',                  NULL),
    (v_im_swap, '2026-03-05', 1.5, 'ADMIN',           'Trámites municipales para permiso de acceso en altura',   NULL),
    (v_im_tss,  '2026-03-01', 5,   'ACCESO',          'Permiso municipal vencido, no se pudo ingresar',          v_dep2),
    (v_im_tss,  '2026-03-04', 2,   'FALLA_EQUIPO',    'Equipo de medición fuera de servicio',                    NULL),
    (v_im_tss,  '2026-03-06', 3,   'ESPERA_MATERIAL', 'Aguardando delivery de módulo de reemplazo',              v_dep2),
    (v_im_tss,  '2026-02-28', 1,   'ADMIN',           'Actualización de ATS y documentación previa',             NULL);

  RAISE NOTICE 'Horas improductivas insertadas OK';
END $$;

-- ============================================================
-- ACCESOS A SITIOS
-- ============================================================
DO $$
DECLARE
  v_backoffice UUID;
BEGIN
  SELECT id INTO v_backoffice FROM public.users WHERE role = 'backoffice' LIMIT 1;

  INSERT INTO public.site_accesses (site_code, site_name, access_type, status, contact_name, contact_phone, valid_from, valid_until, managed_by, notes) VALUES
    ('BUE-0142', 'Palermo Central',    'LLAVE',              'VIGENTE',    'Carlos Méndez',  '011-4555-1234', '2025-01-01', '2026-12-31', v_backoffice, 'Llave en portería edificio'),
    ('BUE-0287', 'Caballito Este',     'CODIGO',             'VIGENTE',    'Admin Edificio', '011-4444-5678', '2026-01-01', '2026-06-30', v_backoffice, 'Código: 1234*'),
    ('BUE-0391', 'Lomas del Mirador',  'PERMISO_PROPIETARIO','EN_GESTION', 'Juan Rodríguez', '011-15-6789-0123','2026-01-15', NULL,        v_backoffice, 'Propietario pidió nota oficial'),
    ('BUE-0512', 'Quilmes Centro',     'MUNICIPAL',          'VENCIDO',    'Municipio Quilmes','011-4224-0000', '2025-06-01', '2026-02-28', v_backoffice, 'Renovación en trámite'),
    ('COR-0088', 'Córdoba Centro',     'LLAVE',              'VIGENTE',    'Seguridad Corp',  '0351-555-0001', '2025-03-01', '2027-03-01', v_backoffice, NULL),
    ('COR-0112', 'Villa Carlos Paz',   'PERMISO_PROPIETARIO','VIGENTE',    'Mirta Gómez',     '0354-15-444444', '2026-02-01', '2026-08-01', v_backoffice, 'Acceso solo días hábiles 8-18h'),
    ('MDZ-0033', 'Mendoza Godoy Cruz', 'MUNICIPAL',          'EN_GESTION', 'Muni Godoy Cruz', '0261-555-0010', '2026-01-01', NULL,         v_backoffice, 'Expediente 2026-04521'),
    ('ROS-0045', 'Rosario Puerto',     'CODIGO',             'VIGENTE',    'Puerto Rosario',  '0341-555-2222', '2026-01-01', '2026-12-31', v_backoffice, NULL);

  RAISE NOTICE 'Accesos insertados OK';
END $$;

-- ============================================================
-- PLANIFICACIÓN
-- ============================================================
DO $$
DECLARE
  v_dep_swap1  UUID;
  v_dep_swap2  UUID;
  v_dep_tss1   UUID;
  v_im_swap    UUID;
  v_im_tss     UUID;
BEGIN
  SELECT id INTO v_dep_swap1 FROM public.deployments WHERE site_code = 'BUE-0391' LIMIT 1;
  SELECT id INTO v_dep_swap2 FROM public.deployments WHERE site_code = 'BUE-0634' LIMIT 1;
  SELECT id INTO v_dep_tss1  FROM public.deployments WHERE site_code = 'ROS-0045' LIMIT 1;
  SELECT id INTO v_im_swap   FROM public.users WHERE role = 'im_swap'  LIMIT 1;
  SELECT id INTO v_im_tss    FROM public.users WHERE role = 'im_tss'   LIMIT 1;

  INSERT INTO public.planning_items (deployment_id, title, planned_start, planned_end, responsible, status, resources_needed, notes) VALUES
    (v_dep_swap1, 'SWAP Lomas del Mirador',   '2026-03-17', '2026-03-19', v_im_swap, 'CONFIRMED', '2 técnicos, grúa, RRU x3, BBU x1', 'Esperar resolución de acceso'),
    (v_dep_swap2, 'SWAP San Isidro Norte',    '2026-03-24', '2026-03-26', v_im_swap, 'PENDING',   '2 técnicos, RRU x3',               NULL),
    (v_dep_tss1,  'TSS Rosario Puerto',       '2026-03-18', '2026-03-20', v_im_tss,  'CONFIRMED', '1 técnico, módulos BBU, fibra 50m', NULL),
    (NULL,        'Capacitación Nokia 5G',    '2026-03-13', '2026-03-14', v_im_tss,  'CONFIRMED', 'Todo el equipo técnico',           'Virtual, 2 días'),
    (NULL,        'Auditoría interna Q1',     '2026-03-28', '2026-03-28', NULL,       'PENDING',   NULL,                               'Revisión de KPIs trimestre');

  RAISE NOTICE 'Planificación insertada OK';
END $$;

-- ============================================================
-- FACTURAS (para Leandro)
-- ============================================================
DO $$
DECLARE
  v_dep1  UUID;
  v_dep2  UUID;
  v_back  UUID;
BEGIN
  SELECT id INTO v_dep1 FROM public.deployments WHERE site_code = 'BUE-0142' LIMIT 1;
  SELECT id INTO v_dep2 FROM public.deployments WHERE site_code = 'COR-0088' LIMIT 1;
  SELECT id INTO v_back FROM public.users WHERE role = 'backoffice' LIMIT 1;

  INSERT INTO public.invoices (deployment_id, number, provider, amount, currency, status, issue_date, due_date, paid_date, created_by) VALUES
    (v_dep1, 'FAC-A-00001234', 'Huawei Argentina S.A.',     4850000, 'ARS', 'PAID',     '2026-02-01', '2026-02-28', '2026-02-25', v_back),
    (v_dep1, 'FAC-A-00001235', 'Transportes Norte S.R.L.', 185000,  'ARS', 'PAID',     '2026-02-15', '2026-03-15', '2026-03-10', v_back),
    (v_dep2, 'FAC-B-00005678', 'Ericsson Argentina',        3200000, 'ARS', 'APPROVED', '2026-03-01', '2026-03-31', NULL,         v_back),
    (NULL,   'FAC-A-00001240', 'Proveedor Logístico ABC',   420000,  'ARS', 'PENDING',  '2026-03-05', '2026-04-05', NULL,         v_back),
    (NULL,   'FAC-C-00000089', 'Nokia Solutions ARG',       850000,  'ARS', 'PENDING',  '2026-03-08', '2026-04-08', NULL,         v_back),
    (v_dep2, 'FAC-B-00005699', 'Rentas y Servicios S.A.',   95000,   'ARS', 'REJECTED', '2026-02-20', '2026-03-20', NULL,         v_back);

  RAISE NOTICE 'Facturas insertadas OK';
END $$;

SELECT 'Seed completado exitosamente ✓' AS resultado;
