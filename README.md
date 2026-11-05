# Techserva

IT services on one public price list: 500 services in 20 categories, each with a written scope, a starting price in local currency and its own terms page. The site reads in more than 200 languages.

- Site: https://techserva.vercel.app
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
| `ADMIN_USER`, `ADMIN_PASS` | Dashboard login |
| `ADMIN_SECRET` | Signs the session cookie and encrypts stored requests |
| `BLOB_READ_WRITE_TOKEN` | Stores encrypted requests in Vercel Blob |

## How the assistant works

It runs in the browser and calls no AI model. It ranks the catalog, terms and FAQ with BM25 and answers with the matching text and a link to the source. It uses the translated text for the visitor's language plus the English text, so a question in either can match.
