# Portfolio With Firebase CRUD

This portfolio now supports dynamic content backed by Firebase Firestore.
Public pages load content from Firestore, and the `/admin` page provides CRUD editing.

## 1. Install and run

```bash
npm install
npm run dev
```

## 2. Configure Firebase

Create a `.env` file in project root:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

If env vars are missing, the app still runs with fallback local defaults.

## 3. Firestore structure

Use these collections/documents:

- `content/home` document (JSON object for home page text/labels)
- `content/about` document (JSON object for about page text/stats/details)
- `content/contact` document (JSON object for contact page text/actions; use one primary email CTA plus secondary social links such as WhatsApp, GitHub, LinkedIn, and Instagram)
- `skills` collection (documents with at least `name`, `pct`, optional `order`)
- `projects` collection (documents with `num`, `title`, `desc`, `tech[]`, `link`, optional `order`)
- `experience` collection (documents with `role`, `company`, `period`, `desc`, optional `order`)

## 4. Editing content

- Open `/admin` and sign in with Google (only `VITE_ADMIN_EMAIL` is allowed)
- Each tab (Home, About, Skills, Projects, Experience, Contact) is a form; click **Save** to publish
- Project screenshots: drop images in `public/projects/` and enter `/projects/<file>.png` in the project's Screenshot field
- CV: paste a link in Home → "CV / résumé link" to show a Download CV button

## 5. Admin sign-in and security (one-time setup)

1. Firebase Console → **Authentication** → Sign-in method → enable **Google**
2. Authentication → Settings → **Authorized domains** → add your live domain
3. Firestore Database → **Rules** → paste `firestore.rules` → Publish

Reads are public; writes are only allowed for the admin Google account.

## 6. Link previews

Set `VITE_SITE_URL` in `.env` (and in your hosting provider's env vars) to your live URL, e.g. `https://samuelkevin.dev`.
This makes the `og:image` absolute so LinkedIn/WhatsApp show the preview card in `public/og-image.png`.
