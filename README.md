# Pharmistry World — Website Structure

## Current structure

- `index.html` — Home
- `pages/notes.html` — B.Pharm notes
- `pages/industry.html` — Pharma industry
- `pages/career.html` — Career
- `admin/index.html` — Admin panel UI placeholder
- `assets/style.css` — Main design
- `assets/script.js` — Search/filter/mobile menu
- `data/notes.json` — Future notes database structure

## Final architecture

Frontend: GitHub Pages
Storage/database: Supabase
Admin: Supabase Auth + Storage
PDFs: Supabase Storage

## Important

The admin page in this starter package is only a UI placeholder. Do not put a real password in frontend HTML/JavaScript. Authentication and PDF upload should be connected through Supabase Auth and Storage.

## Next implementation

1. Create Supabase project.
2. Create `notes` table.
3. Create `notes` storage bucket.
4. Add admin authentication.
5. Connect upload form.
6. Fetch published notes dynamically on `notes.html`.
7. Add PDF View/Download buttons.
