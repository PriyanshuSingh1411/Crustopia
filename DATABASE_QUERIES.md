# Database Schema — Crustopia

## Database

- **Database**: Postgres (this doc previously said MySQL — that was wrong;
  `lib/db.js` uses the `pg` driver, with a small compatibility shim that lets
  the rest of the codebase write MySQL-style `?` placeholders).

## Full schema (fresh database)

```sql
CREATE TABLE users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image VARCHAR(500),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(50),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
  status VARCHAR(50) DEFAULT 'Placed',
  payment_status VARCHAR(50) DEFAULT 'pending',
  delivery_address JSONB,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE coupons (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('percent', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2) DEFAULT 0,
  expiry DATE,
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

If you already have a database from before this update, don't recreate it —
run `migration.sql` instead, which adds the new columns/table without
touching existing data.

**Note:** the `coupons.type` values are `'percent'` / `'fixed'` (not
`'percentage'`, which an earlier version of this doc incorrectly listed —
the code has always used `'percent'`, this was just a documentation bug).

## Where each table is used

- **users** — `app/api/auth/*`, `app/api/admin/login`, `app/api/admin/register`,
  `app/api/admin/users` (block/unblock, role changes)
- **products** — `app/api/products*`, `app/api/admin/products*`. Public reads
  filter `is_available = true`; the admin listing does not.
- **orders** / **order_items** — `app/api/orders`, `app/api/admin/orders*`.
  Order totals and prices are always recalculated server-side from
  `products` at order time — never trust a client-supplied price or total.
- **coupons** — `app/api/coupons*`, `app/api/admin/coupons`
- **site_settings** — `app/api/settings` (public read), `app/api/admin/settings`
  (admin read/write). Key/value pairs; see `lib/settings.js` for the full
  list of keys and their defaults.
