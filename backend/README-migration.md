Migration instructions

1) Open Supabase dashboard for your project: https://app.supabase.com
2) Open the SQL editor for your project (left menu → SQL Editor).
3) Create a new query and run an `ALTER TABLE` statement to add the missing columns to the `items` table. Example SQL to run:

```sql
ALTER TABLE public.items
	ADD COLUMN IF NOT EXISTS type text,
	ADD COLUMN IF NOT EXISTS contact text,
	ADD COLUMN IF NOT EXISTS security_question text,
	ADD COLUMN IF NOT EXISTS security_answer text;
```

Notes
- `security_answer` is stored as a bcrypt hash by the backend (`bcryptjs`).
- After running the migration, the backend will be able to persist `type`, `contact`, and the security fields.
- If you'd rather not add these columns, the server already dynamically inserts only columns that exist, so behavior will continue to work without schema changes.

Notes on running the migration

- The easiest and safest way to add the new columns is to use the Supabase SQL editor (Project → SQL Editor). Paste the migration SQL (see below) and run it.
- If you prefer not to modify the database schema, the server will continue to work because it inserts only the columns that exist.

Important: do not paste your DB connection string into chat. Run any local commands in a secure environment on your machine.

Security recommendation
- Do not store plaintext security answers. The backend hashes `security_answer` before storing. When verifying an answer, use `bcrypt.compare` on the server to check the provided answer against the stored hash.
