import { CODE_PREFIX } from './brand.mjs';
// 20 categories x 25 services. Price = entry price in thousand IDR for Indonesia.
// Other markets derive from it in lib/pricing.mjs.
const raw = {
 web: ['Websites and landing pages', 'Pages that explain your business and bring in customer enquiries.', `
One-page landing page|500
Company landing page|750
Product launch page|900
Event registration page|600
Waitlist page with email capture|500
Link-in-bio page|300
Personal portfolio site|800
Company profile, 5 pages|2500
Company profile, 8 pages|3500
Restaurant site with menu|1500
Clinic site with booking request|2000
Hotel site with room pages|3000
School or course site|2500
Property listing site|4000
Product catalog site|4000
Simple online store|5000
Multi-vendor store starter|15000
Blog or news site|2000
Documentation site|2500
Non-profit donation site|2500
Wedding or invitation site|400
Website migration to a new platform|2000
Website speed repair|800
Mobile layout repair|300
Technical SEO setup|1500`],
 fullstack: ['Full-stack web applications', 'Database, login, server and interface delivered as one working product.', `
SaaS starter with login and billing page|12000
Internal admin dashboard|15000
Customer portal|12000
Member area with paid content|10000
Booking and scheduling app|12000
Inventory management app|14000
Point-of-sale web app|15000
Invoice and quotation app|9000
Simple CRM|12000
Helpdesk ticket system|11000
Learning management system|18000
Job board|10000
Marketplace MVP|25000
Online exam app|12000
Attendance and shift app|9000
Project tracker|9000
Clinic records app|18000
Delivery tracking app|15000
Survey and form builder|9000
Community forum|9000
Multi-tenant app conversion|20000
Role and permission system|6000
Next.js full-stack MVP|15000
Crypto payment checkout app|12000
Prototype to production rebuild|25000`],
 frontend: ['Frontend development', 'Interface work on top of your backend or API. No server work included.', `
Figma to HTML and CSS|1000
Figma to React|2500
Figma to Next.js|3000
Figma to Vue|2500
Figma to Svelte|2500
Figma to Webflow|2000
Figma to Framer|2000
Dashboard frontend|5000
Component library in React|6000
Design tokens setup|1500
Dark and light theme toggle|500
Language switcher setup|800
Accessibility repair to WCAG AA|2000
Form flow with validation|1000
Data table with filter and sort|1200
Chart pages from an existing API|1500
Checkout interface|2000
Search interface|1200
Frontend bug fix, one issue|200
Core Web Vitals repair|1500
Legacy jQuery to React migration|6000
Tailwind conversion|1500
Progressive web app setup|1500
Email template coding|400
Browser compatibility repair|800`],
 backend: ['Backend and APIs', 'Servers, databases and endpoints with written documentation.', `
REST API, up to 10 endpoints|3000
GraphQL API|5000
Database schema design|2000
Database migration|3000
Query performance repair|1500
Login and session service|2500
OAuth and social login|1500
Payment gateway connection|2500
Webhook receiver service|1200
File upload and storage service|1500
Email sending service|800
Push notification service|1500
Background job queue|2500
Scheduled task service|1000
Search service|3000
Real-time chat backend|5000
Rate limiting and API keys|1200
Multi-language content API|2500
Headless CMS setup|2500
Firebase backend|3000
Supabase backend|3000
Node.js service rebuild|6000
Python FastAPI service|4000
Laravel API|4000
API documentation with OpenAPI|800`],
 i18n: ['Multi-language sites and localization', 'One site that reads properly in the languages your buyers use.', `
Add 2 languages to a site|800
Add 5 languages to a site|1800
Add 20 languages to a site|5000
Add 100 languages to a site|15000
Add 200 languages to a site|25000
Right-to-left layout support|1500
Language routing for SEO|1000
Hreflang and sitemap setup|500
Multi-currency price display|1500
Local date and number formats|500
Translation memory setup|1500
Machine translation pipeline|3000
Human proofreading handoff kit|500
Language switcher redesign|500
Multi-language PDF catalog, 10 languages|2000
Multi-language PDF catalog, 200 languages|12000
App string extraction|1500
Mobile app localization|3000
Indonesian localization|500
English localization|500
Arabic localization|1000
Chinese localization|1000
Japanese localization|1000
Spanish localization|800
Localized legal page set|1500`],
 design: ['Design and polish', 'Interface design, redesigns and finishing work that make a product look professional.', `
Landing page design in Figma|800
Website redesign, up to 5 pages|2000
App interface design, 10 screens|3000
Dashboard interface design|4000
Design system starter|5000
Design polish pass, one page|400
Design polish pass, whole site|2000
Typography cleanup|500
Color system and contrast repair|500
Icon set, 20 icons|800
Mobile-first redesign|2000
Onboarding flow design|1500
Checkout flow redesign|1500
Pricing page redesign|600
UX review with written fixes|1500
User flow mapping|800
Wireframes, 10 screens|800
Clickable prototype|1500
Logo design|800
Brand identity starter|2500
Brand guidelines document|1500
Social media template set|600
Presentation template|800
Email newsletter design|300
Empty and error states design|500`],
 motion: ['3D and web animation', 'Animation that explains your product, built with Three.js, GSAP, Lottie and scroll effects.', `
3D hero scene with Three.js|3000
3D product viewer|4000
3D product configurator|10000
Full-page 3D website|15000
React Three Fiber scene|4000
Blender model for the web|2000
Model optimization for mobile|800
Scroll-driven animation with GSAP|2000
Page transitions|1200
Smooth scroll setup|300
Lottie animation, one file|500
Lottie icon set|1200
Interactive Rive icon|800
Animated logo|500
Animated hero illustration|1000
Micro-interaction pass|800
Animated data chart|800
Interactive map in 3D|6000
WebGL shader background|1500
Virtual showroom|12000
360-degree product tour|3000
AR preview on the web|5000
Reduced-motion and performance repair|500
Product walkthrough video|1500
Motion graphics ad, 30 seconds|1500`],
 mobile: ['Mobile apps', 'Android and iOS apps, from first build through store submission.', `
React Native MVP|15000
Flutter MVP|15000
Android native app|18000
iOS native app|20000
Website-to-app wrapper|3000
Store listing and submission|1000
Push notification setup|800
In-app purchase setup|2500
Offline mode|3500
Maps and location feature|2000
Camera and scan feature|1500
Chat feature|4000
Payment feature|2500
Food ordering app|18000
Courier app|18000
Booking app|15000
Loyalty app|12000
Fitness tracker app|12000
School parent app|12000
Telegram Mini App|5000
Mobile app redesign|5000
Crash and bug repair|1000
App speed repair|1500
Framework upgrade|2000
App analytics setup|600`],
 game: ['Game development', 'Browser, mobile and Telegram games with a playable build at every milestone.', `
HTML5 arcade game|3000
Puzzle game for the browser|3500
Word game|3000
Quiz game|2000
Brand mini game for a campaign|3000
Telegram game|4000
Discord activity game|5000
Unity mobile game prototype|8000
Unity 2D game|15000
Unity 3D game prototype|15000
Godot game prototype|7000
Three.js browser game|7000
Multiplayer lobby and rooms|8000
Leaderboard service|1500
Save and login system|2000
In-game shop|3000
Rewarded ads setup|1000
Level design pack, 20 levels|1500
Game UI design|2000
Game sprites, 20 assets|1500
Sound effects pack|800
Game balance review|800
Game bug repair|1000
Game port to the web|4000
Store page and trailer|1500`],
 ai: ['AI agents and chatbots', 'Assistants that read your documents, answer with sources and hand off to a person.', `
FAQ chatbot for a website|1500
RAG chatbot on your documents|5000
Customer service agent with human handoff|8000
Sales qualification agent|7000
Booking agent|6000
Internal knowledge base assistant|7000
HR policy assistant|5000
Rule-based bot with AI fallback|3000
Agent with tool calling|9000
Multi-step AI workflow agent|12000
MCP server for your product|5000
Voice bot, simple flow|9000
Meeting summary agent|3000
Email triage agent|4000
Document extraction agent|5000
Invoice reading agent|4500
Contract review assistant|6000
Support ticket classifier|2500
AI writing tool for your brand|4000
AI search on your site|4000
Prompt library for a team|1000
Model cost reduction review|1000
Chatbot accuracy test set|1000
AI feature in an existing app|6000
Agent monitoring dashboard|5000`],
 chat: ['Chat automation', 'Natural conversation bots on the channels your customers already use.', `
Web chat widget|1000
WhatsApp bot on your own API account|3000
WhatsApp order bot|5000
WhatsApp booking bot|4500
WhatsApp broadcast with opt-in|2000
WhatsApp and CRM connection|3000
Instagram DM auto reply|2000
Instagram comment to DM flow|2000
Instagram lead capture|2500
Facebook Messenger bot|2000
Telegram bot, basic|1000
Telegram order bot|2500
Telegram group moderator|1500
Telegram paid channel gate|2500
Discord bot, basic|1000
Discord moderation bot|1800
Discord role and verification bot|1500
Discord ticket bot|1500
Slack bot|2000
Microsoft Teams bot|3500
LINE bot|2500
Natural language layer for a menu bot|2500
One inbox for all channels|6000
Chat analytics report|1200
Human handoff setup|1200`],
 auto: ['Automation and integration', 'Connect the tools you already pay for and remove the repeated manual step.', `
Google Sheets automation|800
Lead follow-up automation|2500
Invoice automation|2000
Payment reminder automation|1200
Stock alert automation|1000
Report by email every week|1000
Zapier workflow|800
Make workflow|800
n8n workflow|1200
n8n server setup|1000
CRM integration|2500
Accounting software integration|3000
Marketplace order sync|4000
Shopify integration|2500
WooCommerce integration|2000
Google Calendar integration|800
Stripe integration|1500
Payment link automation|1000
Social post scheduler|1500
PDF generation from data|1200
Web data collection, public pages|1500
Email parsing to spreadsheet|1000
File backup automation|600
Custom script, one task|500
Legacy system bridge|6000`],
 data: ['AI analytics and data', 'Numbers you can act on, built from your own records.', `
Sales dashboard|2500
Marketing dashboard|2500
Looker Studio report|1500
Metabase setup|2000
Power BI report|2500
Google Analytics 4 setup|800
Event tracking plan|1000
Conversion funnel report|1500
Customer segmentation|2500
Churn analysis|3000
Sales forecast model|4000
Price analysis|2500
Text sentiment analysis|2000
Review summary with AI|1200
Chat log analysis with AI|2000
Ask-your-data assistant|6000
Data cleanup, one dataset|800
ETL pipeline|4000
Data warehouse starter|6000
Web scraping dataset, public data|1500
Anomaly alerts|2500
A/B test analysis|1000
Survey analysis|800
Monthly KPI report|1000
Investor metrics sheet|1200`],
 security: ['Cybersecurity', 'Security testing and hardening of your systems, only with your written permission.', `
Website security check|1000
Web app penetration test|8000
API penetration test|7000
Mobile app penetration test|9000
WordPress hardening|800
Server hardening|2000
Cloud configuration review|3500
Secrets and leaked key scan|800
Dependency vulnerability scan|500
Login and session review|1500
Security headers setup|300
Web application firewall setup|800
DDoS protection setup|800
Malware cleanup, one site|1500
Hacked site recovery|2500
Backup and restore drill|800
Phishing awareness kit|600
Incident response plan|2000
Password and MFA rollout plan|800
Smart contract review, small program|8000
Wallet flow review|3000
Bot and abuse protection|1200
Privacy data map|1500
Security monitoring setup|3000
Fix pack after a test|3000`],
 audit: ['Audits', 'A written report with evidence, severity levels and the order in which to fix problems.', `
Code audit, small repo|2000
Code audit, medium repo|5000
Architecture review|3000
Performance audit|1500
SEO audit|800
Accessibility audit|1200
UX audit|1200
Conversion audit|1000
Database audit|1500
Cloud cost audit|1500
AI cost audit|1000
Prompt and chatbot audit|1000
Vendor proposal review|500
Freelancer work review|500
Technical due diligence, light|6000
Open-source license audit|800
Analytics audit|800
Email deliverability audit|500
Mobile app audit|2000
Game build audit|1500
Automation workflow audit|800
Payment flow audit|1500
Privacy policy and cookie review|800
Backup and recovery audit|800
Hosting and domain ownership audit|300`],
 hosting: ['Hosting, servers and DevOps', 'Your site online and kept online. Service starts after full payment.', `
Static site hosting setup|200
Vercel deployment setup|300
Netlify deployment setup|300
Cloudflare setup|300
VPS setup|800
Docker setup|1000
Docker Compose stack|1200
Kubernetes starter|6000
CI/CD pipeline|1500
GitHub Actions workflow|500
Domain and DNS setup|150
Business email DNS setup|250
SSL certificate setup|150
Managed hosting, 1 month|150
Managed hosting, 12 months|1500
Managed database, 12 months|2500
Server migration|1500
WordPress hosting setup|400
Node.js app hosting|600
Uptime monitoring setup|300
Log monitoring setup|1200
Automatic backup setup|500
Cloud cost reduction|1500
Staging environment|800
AWS starter setup|2500`],
 qa: ['QA and testing', 'Bugs found before your customers find them, each one written up so it can be reproduced.', `
Manual test pass, small site|500
Manual test pass, web app|1500
Mobile device test pass|1000
Browser compatibility test|600
Playwright test suite|2500
Cypress test suite|2500
Unit test suite|2000
API test suite|1500
Load test|1500
Stress test, up to 10,000 users|2500
Regression test pack|1500
Payment flow test|600
Form and validation test|300
Accessibility test|800
Language and translation test|800
Right-to-left layout test|500
Visual regression setup|1500
Game test pass|1000
Chatbot test pass|800
AI answer accuracy test|1000
App store readiness test|600
Launch-day checklist run|500
Bug report cleanup|400
Test plan writing|800
QA in CI setup|1000`],
 roast: ['Product reviews and critiques', 'Honest written feedback on your product, website or pitch.', `
Idea roast|150
Startup idea validation|500
Design roast, one page|150
Landing page roast|200
Pricing page roast|200
Pitch deck roast|300
App roast|300
Copywriting roast|150
Logo roast|100
Name roast|100
Business model roast|500
Competitor teardown|800
Market size check|800
Customer interview script|300
Offer and pricing review|500
Portfolio roast|150
CV and LinkedIn roast|150
Onboarding roast|200
Video roast|200
Hackathon submission roast|300
Tech stack roast|400
Roadmap roast|400
Investor email roast|100
GitHub repo roast|300
Roast with a fixed version delivered|1000`],
 pitch: ['Pitch decks and content', 'Decks, demo videos and copy for investors, customers and judges.', `
Pitch deck, 10 slides|1500
Investor deck, 15 slides|3000
Sales deck|2000
Hackathon pitch deck|1000
Deck redesign from your draft|1000
Speaker notes and script|400
Financial model sheet|2000
One-page company summary|400
Demo video, 60 seconds|1500
Pitch video, 3 minutes|2500
Product explainer video|2500
Launch video|2000
Website copywriting|800
Natural-language copy rewrite|300
Case study writing|500
Technical documentation|1000
README and repo cleanup|300
Proposal document|500
Grant application draft|1000
Whitepaper draft|2500
Product requirements document|800
User manual|800
Blog article pack, 5 articles|500
Launch post pack|300
App store text and images|500`],
 care: ['Maintenance, training and consulting', 'Ongoing support after launch, plus training so your team can run things on its own.', `
Website maintenance, 1 month|300
Website maintenance, 12 months|3000
App maintenance, 1 month|1000
App maintenance, 12 months|10000
Bug fix retainer, 10 hours|1500
Developer on call, 1 month|8000
Content update pack, 10 changes|300
Plugin and dependency updates|400
Security patch plan, 12 months|2500
Fractional CTO, 1 month|15000
Technical consulting, 1 hour|300
AI strategy session|1000
Automation discovery session|800
Build or buy advice|500
Vendor selection help|1000
Hiring test for developers|800
Developer interview support|500
AI tools training for a team|2000
Prompt writing workshop|1000
n8n workshop|1500
Git and GitHub workshop|1000
Secure coding workshop|2000
Handover documentation|800
Source code rescue|3000
Take over an abandoned project|5000`],
};

const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const categories = Object.entries(raw).map(([id, [name, blurb]]) => ({ id, name, blurb }));

const seen = new Set();
export const services = Object.entries(raw).flatMap(([cat, [, , list]]) =>
  list.trim().split('\n').map(line => {
    const [name, k] = line.split('|');
    let slug = slugify(name);
    if (seen.has(slug)) slug = slugify(`${cat} ${name}`);
    seen.add(slug);
    return { cat, name, slug, idr: Number(k) * 1000 };
  })
).map((s, i) => ({ ...s, n: i + 1, code: `${CODE_PREFIX}-${String(i + 1).padStart(3, '0')}` }));
