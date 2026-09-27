# Pharmistry World — Final Premium Package

**Learn. Explore. Grow in Pharma.**

This package is the coordinated final website set for GitHub Pages. All public pages, shared CSS/JS, the admin panel, Supabase setup, and logo are included together so there are no version-mismatch files.

## Included
- `index.html` — premium responsive homepage
- `notes.html` — searchable, semester-filtered Supabase notes library
- `industry.html` — pharmaceutical industry learning
- `career.html` — pharma career guidance
- `admin.html` + `admin.js` — Supabase Auth protected upload panel
- `style.css` — responsive design system
- `script.js` — navigation and notes functionality
- `logo.png` — Pharmistry World logo
- `supabase_setup.sql` — table/RLS/storage policies
- `README.md` — setup notes

## GitHub upload
Extract this ZIP and upload **all files in the extracted folder** to the repository root. Replace the existing files when GitHub asks. Do not put the files inside another folder.

## Supabase
The site uses the existing Supabase project and the existing public storage bucket named `B. Pharm Notes`. The browser uses only the Supabase publishable key; never add a service-role/secret key to this repository.

For the admin panel, create your admin account in Supabase Authentication and run `supabase_setup.sql` in the SQL Editor. Open `/admin.html` on the deployed site to sign in and publish PDFs. Keep only trusted admin accounts in the Supabase project.

## Existing content
The package does not delete or alter your existing Supabase PDFs or database rows. It only updates the website files that read/display them.
