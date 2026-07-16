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

- Open `/admin`
- Use JSON editors for singleton docs: Home, About, Contact
- Use list editors for Skills, Projects, Experience to create/update/delete items

## 5. Important security note

`/admin` is currently UI-only and has no authentication guard yet.
Before production, protect writes with Firebase Auth + Firestore security rules.
