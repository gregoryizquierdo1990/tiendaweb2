-- Script SQL Completo de Base de Datos para Supabase (Estructura Unificada)
-- Ejecuta este script en el SQL Editor de tu consola de Supabase (https://supabase.com)

-- 1. Crear tabla de Categorías de Servicios
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Cuentas Madre (Proveedores de streaming)
CREATE TABLE IF NOT EXISTS public.parent_accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    platform TEXT,
    email TEXT,
    password TEXT,
    expiration_date TEXT,
    max_slots INTEGER DEFAULT 5,
    active_slots INTEGER DEFAULT 0,
    purchase_price NUMERIC,
    provider TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de Perfiles de Streaming vinculados a la Cuenta Madre
CREATE TABLE IF NOT EXISTS public.account_profiles (
    id TEXT PRIMARY KEY,
    parent_account_id TEXT REFERENCES public.parent_accounts(id) ON DELETE CASCADE,
    profile_name TEXT,
    pin TEXT,
    assigned_customer TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla de Historial de Reversos y Devoluciones
CREATE TABLE IF NOT EXISTS public.refunds (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT,
    customer_email TEXT,
    amount NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Crear tabla de Facturas (Invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    payment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Crear tabla de Contratos (Contracts)
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Crear tabla de Clientes (Customers) con saldo de Billetera Zeny
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT DEFAULT 'cliente',
    zeny_balance NUMERIC DEFAULT 0.00,
    is_suspended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Crear tabla de Catálogo de Productos y Servicios (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price_usd NUMERIC DEFAULT 0.00,
    price_bs NUMERIC DEFAULT 0.00,
    duration TEXT,
    account_type TEXT,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 10,
    is_stock_manual BOOLEAN DEFAULT false,
    manual_stock INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Crear tabla de Métodos de Pago
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bank_name TEXT,
    doc_id TEXT,
    phone TEXT,
    payment_instructions TEXT,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Crear tabla de Preguntas Frecuentes (FAQ Items)
CREATE TABLE IF NOT EXISTS public.faq_items (
    id TEXT PRIMARY KEY,
    category TEXT,
    question TEXT,
    answer TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Crear tabla de Abonos / Cargas a la Billetera Zeny
CREATE TABLE IF NOT EXISTS public.wallet_topups (
    id TEXT PRIMARY KEY,
    customer_email TEXT,
    amount_usd NUMERIC DEFAULT 0.00,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11b. Crear tabla de Franquiciados (Franchises)
CREATE TABLE IF NOT EXISTS public.franchises (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT,
    telegram_user TEXT,
    email TEXT UNIQUE,
    custom_domain TEXT,
    wallet_custom_name TEXT DEFAULT 'ZenyPay',
    monthly_fee_usd NUMERIC DEFAULT 0.00,
    subscription_status TEXT DEFAULT 'active',
    status TEXT DEFAULT 'active',
    credit_due_date TEXT,
    last_payment_date TEXT,
    available_master_balance_usd NUMERIC DEFAULT 0.00,
    notes TEXT,
    extra_addons_monthly_usd NUMERIC DEFAULT 0.00,
    is_reseller_network_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11c. Crear tabla de Abonos de Franquicias (Franchise Topups)
CREATE TABLE IF NOT EXISTS public.franchise_topups (
    id TEXT PRIMARY KEY,
    franchise_id TEXT REFERENCES public.franchises(id) ON DELETE CASCADE,
    franchise_name TEXT,
    franchise_phone TEXT,
    franchise_telegram TEXT,
    target_customer_name TEXT,
    target_customer_id TEXT,
    amount_usd NUMERIC DEFAULT 0.00,
    amount_bs NUMERIC DEFAULT 0.00,
    payment_method TEXT,
    reference_number TEXT,
    screenshot_image TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT,
    rejection_reason TEXT
);

-- 12. Deshabilitar RLS (Row Level Security) para permitir lecturas/escrituras directas desde la app
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_topups DISABLE ROW LEVEL SECURITY;

-- 13. Cargar semilla de datos iniciales reales para pruebas rápidas
INSERT INTO public.categories (id, name, icon, description) VALUES
('cat-netflix', 'Netflix 4K', 'Tv', 'Cuentas completas y pantallas premium de Netflix Ultra HD.'),
('cat-disney', 'Disney+ Premium', 'Tv', 'Perfiles y cuentas completas de Disney Plus con Star incluido.'),
('cat-max', 'Max (HBO)', 'Tv', 'Acceso a las mejores películas y series de Warner Bros y HBO.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, name, email, phone, role, zeny_balance) VALUES
('cust-gregory', 'Gregory Izquierdo', 'emprendimientogregoryizquierdo@gmail.com', '584241983648', 'admin', 150.00),
('cust-cliente-1', 'Juan Pérez', 'juan.perez@example.com', '584121234567', 'cliente', 25.50),
('cust-cliente-2', 'María Gómez', 'maria.gomez@example.com', '584249876543', 'cliente', 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, category, price_usd, duration, account_type, description, stock, is_stock_manual, manual_stock) VALUES
('prod-netflix-1', 'Netflix Ultra HD', 'cat-netflix', 3.50, '30 Días', 'Pantalla Privada', 'Perfil privado con PIN de acceso personalizado en calidad 4K Ultra HD.', 15, false, 15),
('prod-disney-1', 'Disney+ Premium', 'cat-disney', 2.50, '30 Días', 'Pantalla Privada', 'Acceso premium con perfil independiente para toda la familia.', 12, false, 12),
('prod-max-1', 'Max (HBO) Premium', 'cat-max', 3.00, '30 Días', 'Pantalla Privada', 'Películas de estreno y series exclusivas en calidad máxima.', 8, false, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (id, name, bank_name, doc_id, phone, payment_instructions, currency) VALUES
('pm-pago-movil', 'Pago Móvil BCV', 'Banco de Venezuela (0102)', 'V-18999000', '04241983648', 'Realiza el pago al celular registrado y reporta el capture con referencia.', 'VES'),
('pm-binance', 'Binance Pay', 'Binance', 'gregory.binance', 'N/A', 'Envía mediante Binance Pay ID y reporta tu ID de transacción.', 'USD'),
('pm-zeny', 'Billetera Zeny', 'Saldo Interno', 'N/A', 'N/A', 'Descuento directo e instantáneo de tu saldo de billetera virtual Zeny.', 'USD')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.faq_items (id, category, question, answer, sort_order) VALUES
('faq-1', 'Garantía', '¿Qué pasa si mi cuenta deja de funcionar?', 'Todas nuestras cuentas cuentan con garantía total por el tiempo contratado. Si tienes algún inconveniente, puedes abrir un reporte técnico en el Portal de Soporte y te lo solventaremos de inmediato.', 1),
('faq-2', 'Pagos', '¿Cómo reportar un pago móvil o transferencia?', 'Realiza tu pago a nuestros datos oficiales, guarda el comprobante y sube la captura con el número de referencia en el formulario de pago del producto o sección de confirmación.', 2),
('faq-3', 'Zeny', '¿Qué es el saldo ZenyPoints?', 'Es el saldo digital en dólares (USD) recargable para comprar al instante en nuestra plataforma sin esperar validación bancaria.', 3),
('faq-4', 'Renovaciones', '¿Pierdo mi perfil si renuevo?', 'No, al renovar sobre tu mismo perfil conservas intactas tus configuraciones, historial y listas guardadas.', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallet_topups (id, customer_email, amount_usd, reference, notes) VALUES
('top-1', 'juan.perez@example.com', 25.50, 'REF-998877', 'Recarga de saldo vía Pago Móvil para compra rápida.'),
('top-2', 'emprendimientogregoryizquierdo@gmail.com', 150.00, 'REF-ZENY-START', 'Saldo inicial de administrador.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.franchises (id, business_name, owner_name, email, phone, monthly_fee_usd, available_master_balance_usd) VALUES
('franq-caracas', 'StreamPlus Caracas', 'Carlos Mendoza', 'carlos.mendoza@test.com', '+584141234567', 25.00, 150.00),
('franq-maracaibo', 'ZenyStream Zulia', 'Génesis Rivas', 'genesis.rivas@test.com', '+584129876543', 25.00, 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.franchise_topups (id, franchise_id, franchise_name, amount_usd, payment_method, reference_number, status) VALUES
('top-fran-1', 'franq-caracas', 'StreamPlus Caracas', 150.00, 'Binance Pay', '998877665', 'approved'),
('top-fran-2', 'franq-maracaibo', 'ZenyStream Zulia', 50.00, 'Pago Móvil BCV', '554433221', 'pending')
ON CONFLICT (id) DO NOTHING;
