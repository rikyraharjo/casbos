-- ============================================
-- CASBOS POS - Database Schema (Multi-Tenant)
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. TENANTS (data toko/bisnis)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (user/kasir, extend dari auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'kasir')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES (kategori produk per tenant)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS (produk per tenant)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  emoji TEXT DEFAULT '📦',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS (transaksi penjualan)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES profiles(id),
  cashier_name TEXT,
  total INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'qris')),
  cash_received INTEGER DEFAULT 0,
  change INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTION ITEMS (detail item per transaksi)
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat data tenant sendiri
CREATE POLICY "profiles_own_tenant" ON profiles
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Categories: hanya bisa akses kategori tenant sendiri
CREATE POLICY "categories_own_tenant" ON categories
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Products: hanya bisa akses produk tenant sendiri
CREATE POLICY "products_own_tenant" ON products
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Transactions: hanya bisa akses transaksi tenant sendiri
CREATE POLICY "transactions_own_tenant" ON transactions
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Transaction Items: akses via transaksi tenant sendiri
CREATE POLICY "transaction_items_own_tenant" ON transaction_items
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM transactions
      WHERE tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Tenants: owner bisa lihat dan edit tenant sendiri
CREATE POLICY "tenants_own" ON tenants
  FOR ALL USING (
    id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- FUNCTION: Auto-create profile after register
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Buat tenant baru otomatis saat user pertama register
  INSERT INTO tenants (name) VALUES ('Toko Saya')
  RETURNING id INTO new_tenant_id;

  -- Buat profile sebagai owner
  INSERT INTO profiles (id, tenant_id, full_name, role)
  VALUES (NEW.id, new_tenant_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pemilik'), 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: jalankan function saat user baru register
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
