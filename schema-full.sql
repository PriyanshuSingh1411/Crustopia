-- =====================================================================
-- Crustopia — full database schema (Postgres / Supabase)
-- Run this once against a fresh, empty database. It creates every base
-- table plus all the columns/tables added for the dynamic admin panel.
-- Safe to re-run: every statement uses IF NOT EXISTS / ON CONFLICT, so
-- running it again on a database that already has some of this won't
-- error or duplicate data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin: block/unblock a customer account
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Real profile fields (the Profile page used to show fake hardcoded data —
-- these back the real, editable profile)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin: feature on homepage / curate ordering / hide without deleting
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Placed',
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- What checkout actually collects: delivery address, payment method,
-- coupon/discount applied, and the Razorpay reference — previously
-- collected on the client and silently discarded by the API.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'COD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

-- ---------------------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- ---------------------------------------------------------------------
-- COUPONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('percent', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  expiry DATE,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- SITE SETTINGS
-- Key/value store the admin Settings page reads and writes — hero text,
-- banners, contact info, delivery fee, tax %, opening hours, which
-- homepage sections show, all editable with no code changes.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO site_settings (key, value) VALUES
  ('site_name', 'Crustopia'),
  ('hero_badge', 'Fast • Fresh • Delicious'),
  ('hero_title', 'Fresh Pizza'),
  ('hero_title_highlight', 'Delivered Hot'),
  ('hero_subtitle', 'Handcrafted pizzas made with premium ingredients, baked to perfection and delivered straight to your door.'),
  ('hero_cta_text', 'Order Now'),
  ('hero_video_url', '/pizza-bg.mp4'),
  ('contact_phone', ''),
  ('contact_email', ''),
  ('contact_address', ''),
  ('opening_hours', '10:00 AM - 11:00 PM, every day'),
  ('delivery_fee', '0'),
  ('free_delivery_above', '0'),
  ('min_order_amount', '0'),
  ('tax_percent', '0'),
  ('currency_symbol', '₹'),
  ('show_features_section', 'true'),
  ('show_bestsellers_section', 'true'),
  ('show_offer_banner', 'false'),
  ('offer_banner_text', ''),
  ('social_instagram', ''),
  ('social_facebook', ''),
  ('social_twitter', '')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users (is_blocked);

-- =====================================================================
-- Done. Next step: deploy the app, then visit /admin/register once to
-- create your first admin account (that page only works before any
-- admin account exists).
-- =====================================================================
