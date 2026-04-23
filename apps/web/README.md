# Admin Panel

This is an admin-only application for managing the e-commerce store.

## Features

- **Dashboard**: Overview of store statistics
- **Users Management**: Manage user accounts
- **Categories Management**: Create and organize product categories
- **Products Management**: Add, edit, and manage products
- **Orders Management**: View and process customer orders
- **Reviews Management**: Moderate product reviews
- **Settings**: Configure store settings

## Access

- Only users with `ADMIN` role can access the dashboard
- Login at `/auth/login`
- All routes redirect to `/dashboard` after authentication

## Getting Started

1. Make sure the API is running (see `apps/api`)
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)
5. Login with admin credentials

## Default Admin

Create an admin user using the seed script in the API:

```bash
cd apps/api
npm run seed:admin
```

Default credentials:
- Email: admin@example.com
- Password: admin123

**Important**: Change these credentials after first login!
