# 🍕 Crustopia

A Next.js pizza ordering app with a fully dynamic admin panel — site content,
business rules (delivery fee, tax, min order), products, coupons, orders,
and user accounts are all editable from `/admin` with no code changes.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up your database**

   This app uses **Postgres**. Create a database, then run the schema and
   migration:
   ```bash
   psql <your-database-url> -f migration.sql
   ```
   `migration.sql` creates the `site_settings` table, adds the new columns
   used by the admin panel (`is_blocked`, `is_featured`, `is_available`,
   delivery/coupon fields on orders), and seeds sensible default settings.
   It's safe to re-run.

   If you're starting from a completely empty database, you'll also need the
   base tables (`users`, `products`, `orders`, `order_items`, `coupons`) —
   see `DATABASE_QUERIES.md` for the full schema.

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in real values:
   ```bash
   cp .env.example .env.local
   ```

4. **Create your first admin account**

   Run the app (`npm run dev`) and visit `/admin/register`. This bootstrap
   page only works once — before any admin account exists. After that,
   new staff accounts are created from **Admin → Users → Add Admin** by an
   already-logged-in admin.

5. **Run it**
   ```bash
   npm run dev
   ```

## What admins can control from `/admin`

- **Settings** — homepage hero text, promotional banner, which homepage
  sections show, delivery fee, free-delivery threshold, minimum order,
  tax %, opening hours, contact info, social links
- **Products** — add/edit/delete, feature on homepage, mark unavailable
  without deleting
- **Orders** — view, update status, delete
- **Coupons** — create, activate/deactivate, delete
- **Users** — search customers, block/unblock accounts, add admin/staff
  accounts

## Notes on the security pass

This codebase went through a security review — see the comments in
`lib/adminAuth.js`, `middleware.js`, `app/admin/(protected)/layout.js`, and
`app/api/orders/route.js` for specifics on what was fixed and why. The
short version: admin-account creation and the admin dashboard itself used
to have no real auth check, and order totals/prices were trusted from the
browser instead of being verified server-side. Both are fixed now.
