# Pharmistry World

Learn. Explore. Grow in Pharma.

This package replaces the current root HTML/CSS/JS files with a professional responsive site. Keep your existing `logo.png` in the repository.

## Supabase
The Notes page reads from `public.notes`. The existing public bucket `B. Pharm Notes` is used for PDFs. `supabase_setup.sql` adds the required read/insert policies for the notes table and authenticated uploads.

For the admin page, create your admin user in Supabase Authentication and open `/admin.html`. Do not put a service-role/secret key in the website.
