// lib/db.js
//
// Postgres connection pool with a thin compatibility layer so the rest of
// the codebase (which was written for mysql2's `db.query(sql, params)`
// convention using `?` placeholders) keeps working unchanged.
//
// What this shim does:
//   1. Converts `?` placeholders to Postgres `$1, $2, ...` placeholders.
//   2. Expands array params automatically:
//        - a flat array (e.g. for `IN (?)`)          -> `$1,$2,$3`
//        - an array of arrays (bulk `VALUES ?`)       -> `($1,$2),($3,$4)`
//      (mirrors mysql2's own behaviour for these two cases)
//   3. Rewrites the MySQL-only `CURDATE()` call to Postgres `CURRENT_DATE`.
//   4. Returns `[rows, fields]` for SELECTs (so `const [rows] = await db.query(...)`
//      keeps working), and `[{ insertId, affectedRows }, undefined]` for
//      INSERT/UPDATE/DELETE (so `.insertId` / `.affectedRows` keep working).
//      INSERT statements automatically get `RETURNING id` appended so
//      `insertId` can be populated (every table here has an `id` PK).
//
// Env vars (see .env.example):
//   DATABASE_URL   e.g. postgres://user:pass@host:5432/dbname
//   or individually: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
//   DB_SSL         set to "true" to enable SSL (needed by most hosted
//                  Postgres providers like Supabase/Neon/Railway/Render)

import { Pool } from "pg";

const useSsl = process.env.DB_SSL === "true";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
    });

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

/**
 * Convert a mysql2-style `?` query + params array into a Postgres
 * `$1, $2, ...` query + flattened values array.
 */
function toPgQuery(sql, params = []) {
  let paramCursor = 0;
  const values = [];
  let text = "";

  for (const ch of sql) {
    if (ch !== "?") {
      text += ch;
      continue;
    }

    const val = params[paramCursor++];

    if (Array.isArray(val)) {
      if (val.length > 0 && Array.isArray(val[0])) {
        // Bulk insert: VALUES ? with an array of row-arrays
        const groups = val.map((row) => {
          const placeholders = row.map((v) => {
            values.push(v);
            return `$${values.length}`;
          });
          return `(${placeholders.join(",")})`;
        });
        text += groups.join(",");
      } else {
        // Flat array: e.g. WHERE id IN (?)
        const placeholders = val.map((v) => {
          values.push(v);
          return `$${values.length}`;
        });
        text += placeholders.join(",") || "NULL";
      }
    } else {
      values.push(val);
      text += `$${values.length}`;
    }
  }

  return { text, values };
}

async function query(sql, params = []) {
  let { text, values } = toPgQuery(sql, params);

  // MySQL -> Postgres function differences
  text = text.replace(/CURDATE\(\)/gi, "CURRENT_DATE");

  const trimmed = text.trim();
  const isSelect = /^(SELECT|WITH)\b/i.test(trimmed);
  const isInsert = /^INSERT\b/i.test(trimmed);

  if (isInsert && !/RETURNING/i.test(trimmed)) {
    text = `${text} RETURNING id`;
  }

  const result = await pool.query(text, values);

  if (isSelect) {
    return [result.rows, result.fields];
  }

  // INSERT / UPDATE / DELETE: mimic mysql2's ResultSetHeader
  const header = {
    insertId: result.rows?.[0]?.id,
    affectedRows: result.rowCount,
    ...result.rows?.[0],
  };
  return [header, undefined];
}

export default { query };
