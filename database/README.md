# MySQL Database Scripts

Run these files in this order:

1. `database/01_schema.sql`
2. `database/02_seed_data.sql`
3. `database/03_views_and_login_queries.sql`
4. `database/04_crud_samples.sql`

Default sample login users created by `02_seed_data.sql`:

- `admin / admin123`
- `viewer / viewer123`
- `leader / leader123`

Tables created:

1. `roles`
2. `divisions`
3. `employees`
4. `funding_agencies`
5. `projects`
6. `milestones`
7. `users`
8. `project_import_history`

Notes:

- `roles.landing_page` stores which webpage should open after login for each role.
- `users.password_hash` uses `SHA2(password, 256)` so login can be validated directly inside MySQL queries.
- `vw_user_login_profile` gives login, employee, division, and role details in one query.
- `vw_project_overview` gives joined project, milestone, and funding agency data in one query.
- `project_import_history` stores upload audit information for Excel/CSV import attempts.
