# Categories Bar Guide

## ✅ Sea Green Categories Bar Added!

Navbar ke neeche **teal/sea green color ka categories bar** ab ready hai!

## Features:

1. **Dynamic Categories** - Database se automatically load hote hain
2. **Sea Green Background** - `bg-teal-600` with white text
3. **Hover Effects** - White underline animation on hover
4. **Responsive** - Desktop pe dikhta hai, mobile pe sidebar me

## How to Add/Edit Categories:

### Step 1: Login as Admin
- Email: `user@gmail.com`
- Password: `areesha12345`

### Step 2: Go to Categories Management
- Click **Dashboard** in navbar
- Click **Categories** in sidebar
- Or go to: `http://localhost:3000/dashboard/categories`

### Step 3: Add New Category
1. Click **"+ Add Category"** button
2. Fill in:
   - **Name**: Category name (e.g., "PICKLES", "CHUTNEYS")
   - **Slug**: URL-friendly name (auto-generated)
   - **Description**: Category description
   - **Image**: Category image URL (optional)
   - **Active**: Toggle to show/hide in navbar
3. Click **"Create Category"**

### Step 4: Categories Automatically Appear
- New category will **automatically appear** in the sea green bar
- No page refresh needed!
- Categories are fetched from API on page load

## Current Categories Bar Styling:

```tsx
<div className="bg-teal-600">  {/* Sea green background */}
  <Link className="text-white hover:text-teal-100 font-bold uppercase">
    CATEGORY NAME
  </Link>
</div>
```

## API Endpoints:

- **GET** `/api/categories` - Get all categories (public)
- **POST** `/api/categories` - Create category (admin only)
- **PUT** `/api/categories/:id` - Update category (admin only)
- **DELETE** `/api/categories/:id` - Delete category (admin only)

## Example Categories to Add:

1. **PICKLES**
   - Slug: `pickles`
   - Link: `/collections/pickles`

2. **CHUTNEYS**
   - Slug: `chutneys`
   - Link: `/collections/chutneys`

3. **MURABBAS**
   - Slug: `murabbas`
   - Link: `/collections/murabbas`

4. **HEALTH BOOSTERS**
   - Slug: `health-boosters`
   - Link: `/collections/health-boosters`

## Color Customization:

Want different colors? Update in `Navbar.tsx`:

```tsx
// Current: Teal/Sea Green
bg-teal-600  // Background
text-white   // Text color

// Alternative: Emerald Green
bg-emerald-600
text-white

// Alternative: Custom Green
bg-[#00A896]  // Your custom hex color
text-white
```

## Testing:

1. Start servers:
   ```bash
   cd apps/api && npm run dev
   cd apps/web && npm run dev
   ```

2. Login to dashboard
3. Add a test category
4. Go to homepage
5. See category in sea green bar!

**Categories bar is fully dynamic and ready to use!** 🎉
