# Wishlight — Premium Birthday Wish Maker

A mobile-first birthday surprise website using plain HTML, CSS and JavaScript, with Supabase Database + Storage for shareable messages and optional media.

## Features in this starter

- Anyone can create a birthday surprise without signing in.
- Generates a unique share link using a UUID.
- Custom recipient name, sender name, relationship, birthday message, blessings and final letter.
- Four visual moods: Romantic & Dreamy, Midnight Gold, Secret Garden, Midnight Galaxy.
- Animated gift opening and confetti.
- Optional photos (up to 6 × 5 MB), video (35 MB) and music (12 MB).
- Responsive design for mobile and desktop.
- Recipient experience loads the wish from Supabase using the unique link.

## Requirements

- A Supabase account/project: https://supabase.com
- VS Code
- A local web server such as the VS Code **Live Server** extension
- Internet access for Supabase, Google Fonts and the Supabase JS CDN

## Beginner setup (step by step)

### 1. Create your Supabase project

1. Open https://supabase.com and sign in.
2. Create a new project and save its database password somewhere safe.
3. Wait for the project to finish provisioning.
4. In the project dashboard, open **SQL Editor**.
5. Choose **New query**, open `supabase-setup.sql` from this project, copy all its contents into the editor, and click **Run**.
6. Open **Project Settings → API** (or the API keys page, depending on the dashboard layout).
7. Copy the **Project URL** and the **anon/public key**. The anon/public key is intended for browser apps when Row Level Security is correctly configured. Never use a `service_role` or secret key in frontend code.

### 2. Add your Supabase settings

1. In VS Code, open the `birthday-wish-maker` folder.
2. Open `config.js`.
3. Replace `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE` with your project URL.
4. Replace `PASTE_YOUR_SUPABASE_ANON_KEY_HERE` with your anon/public key.
5. Save the file.

### 3. Run it in VS Code

1. Install the **Live Server** extension in VS Code if you don't already have it.
2. Open `index.html`.
3. Right-click inside the file and select **Open with Live Server**.
4. The website should open at a local address such as `http://127.0.0.1:5500`.
5. Create a test wish with text first. Then test photos/video/music if needed.
6. Copy the generated URL and open it in another tab or on your phone. For phone testing, deploy the site publicly first; a `127.0.0.1` link only works on your own device.

### 4. Deploy it free with GitHub Pages

1. Create a GitHub repository, for example `wishlight-birthday`.
2. Upload `index.html`, `styles.css`, `app.js`, `config.js`, and the other project files.
3. In repository **Settings → Pages**, select deploy from your main branch and root folder.
4. Wait for the published URL.
5. Test the deployed website and create a new wish. Its share URL uses the published website address.

Important: this is a static site, so the project URL must be public. Never upload passwords or a Supabase service-role key. The anon/public key is visible in browser source by design; database safety comes from Row Level Security policies.

## How the unique link works

The website generates a random UUID for each wish and creates a link such as:

`https://YOUR-SITE.example/?wish=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

The database stores the wish; the link stores only its identifier. Photos, video and audio are uploaded to the `wish-media` storage bucket and their public URLs are stored with the wish.

## Security and cost notes — read before public launch

This is a functional starter, not a hardened production service.

- **Anyone can create wishes and upload files.** Public anonymous write access can be abused, create unwanted content, or consume your Supabase quota. Add CAPTCHA/rate limiting and server-side validation before widely publishing it.
- **Anyone with a wish link can read the message and media.** UUIDs make links hard to guess but do not make them private. Do not put sensitive/personal information in a wish. For real privacy, add access control or expiring signed URLs.
- Media storage is configured as public for easy playback. Anyone who obtains a media URL may access it.
- There is no user authentication, edit/delete dashboard, automatic expiry, content moderation, or admin panel in this version.
- Free-tier limits and product dashboard labels can change. Check your current Supabase plan and usage. Large video uploads can use storage and bandwidth quickly.
- Upload validation in the browser improves usability but is not a security boundary. Server/storage rules remain important.
- The `created_at` value sent from the browser is informational; the database also has a default timestamp.

## Troubleshooting

**“Connect Supabase first”** — check the values in `config.js`, save, and refresh.

**Table not found / relation error** — run all of `supabase-setup.sql` in the correct Supabase project.

**Permission denied / RLS error** — confirm the SQL policies exist and that the anon/public key from the same project is used.

**Upload fails** — confirm the `wish-media` bucket and upload policy exist, the MIME type is allowed, and the file is below its size limit.

**Recipient link does not load locally** — ensure the `?wish=...` parameter is intact and the browser can reach Supabase.

**Background music does not start automatically** — browsers often block autoplay. The recipient must tap “Play music”.

## Project files

- `index.html` — creator form, share result and recipient experience
- `styles.css` — responsive premium styling and animations
- `app.js` — Supabase save/load, uploads, link generation and reveal interactions
- `config.js` — Supabase public project configuration
- `supabase-setup.sql` — table, storage bucket and starter policies
