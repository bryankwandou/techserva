# Techserva

IT services on one public price list: 500 services in 20 categories, each with a written scope, a starting price in local currency and its own terms page. The site reads in more than 200 languages.

- Site: https://techserva.web.id (techserva.my.id and techserva.vercel.app redirect here)
- Report with screenshots: [docs/REPORT.md](docs/REPORT.md)
- Idea audit: [docs/IDEA-AUDIT.md](docs/IDEA-AUDIT.md)
- Name and domain research: [docs/NAME-RESEARCH.md](docs/NAME-RESEARCH.md)
- Design research: [docs/DESIGN-RESEARCH.md](docs/DESIGN-RESEARCH.md)

## What is here

| Path | Purpose |
|---|---|
| `data/` | Services, copy, terms, languages, cached translations, exchange rates |
| `lib/` | Pricing, the 50,000 template generator, encrypted storage helpers |
| `src/` | Browser code: site, 3D scene, motion, assistant, admin dashboard |
| `api/` | Serverless functions: `lead` for requests, `admin` for the dashboard |
| `scripts/` | Translate, build, PDF catalog, browser checks, walkthrough recording |
| `test/` | Unit tests |

## Commands

```
npm install
node scripts/translate.mjs          # fills missing translations only
node scripts/build.mjs              # writes public/
node scripts/catalog-pdf.mjs        # writes one PDF per language
node --test test/*.test.mjs
node scripts/serve.mjs 4173
python scripts/browser_check.py http://localhost:4173 docs/proof
```

`public/` is generated and not committed. Deploy it with the Vercel CLI; the project is not connected to Git.

## Environment variables

Set these on Vercel. None are stored in this repository.

| Name | Used for |
|---|---|
| `DATABASE_URL` | Neon Postgres: admin accounts, sessions, password resets, client requests |
| `ADMIN_SECRET` | Encrypts stored client requests |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional. Turns on "Sign in with Google". Redirect URI: `https://<domain>/api/auth?action=google-cb` |
| `BLOB_READ_WRITE_TOKEN` | Optional. Reads requests saved before the move to Neon |

## Admin accounts

Accounts live in Neon (`lib/db.mjs`, `api/auth.js`, `api/admin.js`). Passwords are stored as scrypt hashes and sessions as hashed random tokens. There is one master account. Anyone can ask for an account on `/admin/#register`; it stays pending until the master approves it. The master can also create, disable and delete accounts and make one-time reset links for anyone who used "Forgot password". Create the tables and the master account once with:

```
MASTER_USER=... MASTER_PASS=... node --env-file=.env.neon scripts/seed-master.mjs
```

`scripts/check_auth.mjs` runs the whole flow against the database with a throwaway account.

## WhatsApp contact

Every WhatsApp button writes a message in the visitor's language that names where it was pressed (home hero, service page, terms page, assistant, PDF catalog card...) and which service. `/contact/` lists the ready messages. The number is set in `src/site.js`, `scripts/build.mjs` and `scripts/catalog-pdf.mjs`.

## How the assistant works

It runs in the browser and calls no AI model. It ranks the catalog, terms and FAQ with BM25 and answers with the matching text and a link to the source. It uses the translated text for the visitor's language plus the English text, so a question in either can match.
