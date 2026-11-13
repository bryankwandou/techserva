import { CODE_PREFIX } from './brand.mjs';
// 40 categories x 25 services. Price = entry price in thousand IDR for Indonesia.
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
 industry: ['Websites by type of business', 'Ready-planned websites for a specific kind of business, with the pages that business needs.', `
Coffee shop website|1200
Bakery and cake shop website|1200
Catering service website|1500
Beauty salon website with booking|1800
Barbershop website with booking|1500
Dental clinic website|2500
Law firm website|3000
Accounting firm website|2500
Gym and fitness studio website|2000
Yoga studio website with class schedule|2000
Photographer website with gallery|1500
Architect and interior studio website|3000
Travel agent website with tour packages|3500
Car rental website|3500
Laundry service website with price list|1200
Auto repair shop website|1500
Kindergarten website|2000
Private tutoring website|1500
Real estate agent website|3000
Wedding organizer website|2000
Printing shop website with order form|1800
Florist website with order form|1800
Pet shop and grooming website|1800
Coworking space website with room booking|3000
Place of worship website with event calendar|1500`],
 polish: ['Website redesign and visual polish', 'Make an existing website look sharper, read easier and feel finished, page by page.', `
Hero section redesign|600
Navigation and menu redesign|700
Footer redesign|300
Product page redesign|1200
About page redesign|600
Contact page redesign|400
Services page redesign|900
Blog layout redesign|900
Mobile menu redesign|500
Font pairing and type scale|500
Spacing and grid cleanup|700
Button and form style cleanup|500
Image crop and retouch for a site, 20 images|600
Custom illustration set, 5 pictures|1500
Custom icon set, 40 icons|1500
Dark mode design for a site|1200
Consistent card and section styles|800
Before-and-after design report|500
Brand colors applied to a site|600
Trust section with reviews and logos|600
Pricing table design|500
Testimonial section design|400
Photo gallery layout redesign|600
404 and empty page design|300
Full visual refresh, up to 10 pages|6000`],
 seo: ['SEO and search visibility', 'Help people find the site on Google and other search engines, with a written report of what changed.', `
Keyword research, one topic|800
On-page SEO, 10 pages|1500
Local SEO with Google Business Profile|1200
Google Business Profile setup|500
Schema markup for a site|1000
Search Console setup and indexing repair|800
Sitemap and robots file repair|400
Page title and description rewrite, 20 pages|800
Image SEO with alt text, 50 images|600
Internal linking plan|800
Content plan for 3 months|1500
SEO article, 1 article|300
SEO article pack, 10 articles|2500
Category page SEO for a shop|1500
Product page SEO for a shop, 50 products|2000
SEO for a site in several languages|3000
SEO-safe site migration|3000
Broken link and redirect repair|600
Backlink profile check|800
Competitor keyword gap report|1000
Answer engine and AI search readiness|1500
Bing Webmaster setup|300
Monthly SEO care, 1 month|2000
Monthly SEO care, 12 months|20000
Monthly ranking report|500`],
 bizweb: ['Simple business management web apps', 'Small web apps that replace notebooks and spreadsheets for daily business records.', `
Cashier app for a small shop|4000
Stock book app|3000
Order recap app|2500
Customer book app|2000
Expense tracker app|2000
Daily sales report app|2000
Debt and receivable tracker|2500
Supplier purchase order app|3500
Price list manager|1500
Employee attendance with QR code|3000
Simple payroll calculator|3500
Rental management app|4000
Laundry management app|3500
Repair shop service log|3000
Clinic queue app|3000
School fee payment tracker|3500
Boarding house management app|4000
Catering order manager|3000
Delivery route planner|4000
Simple bookkeeping app|4000
Membership card app|3000
Appointment book app|2500
Warranty and service tracker|2500
Equipment loan log|2000
Staff announcement board|1500`],
 bizsys: ['Business software, ERP and CRM', 'Set up and adapt the systems that run sales, finance, stock and staff.', `
Odoo setup, core modules|15000
Odoo custom module|8000
ERPNext setup|12000
SAP Business One integration|20000
Microsoft Dynamics 365 customization|20000
NetSuite script|10000
Salesforce setup|15000
Salesforce custom object and flow|8000
HubSpot CRM setup|5000
Zoho CRM setup|5000
Pipedrive setup|3000
Accounting software setup|3000
Payroll software setup|4000
HR system setup|6000
Warehouse management system setup|15000
Manufacturing planning module|20000
Point-of-sale system setup|4000
Google Workspace setup|2500
Microsoft 365 setup|3000
SharePoint intranet|10000
Jira and Confluence setup|3000
Notion workspace setup|1500
Airtable base design|2500
Business data import into a new system|3000
Business software training and handover|3000`],
 sitecare: ['Hosting plans and website care', 'Keep a website online, updated, backed up and fast, month after month.', `
Website care plan, basic, 1 month|500
Website care plan, basic, 12 months|5000
Website care plan, standard, 1 month|1000
Website care plan, standard, 12 months|10000
Website care plan, business, 1 month|2000
Website care plan, business, 12 months|20000
Managed WordPress hosting, 1 month|300
Managed WordPress hosting, 12 months|3000
Managed VPS, 1 month|1000
Managed VPS, 12 months|10000
Business email hosting setup|800
Domain renewal and DNS care, 12 months|500
CDN and caching setup|1000
Move a site to a faster host|1500
Daily backup with off-site copy|800
Server security care, 1 month|1000
Monthly website health report|400
Uptime alert to WhatsApp|500
Plugin and theme updates, 1 month|400
Hosting control panel setup|800
Website restore from backup|800
Expired domain and hosting rescue|1500
Shared hosting to cloud move|3000
Traffic spike readiness check|1500
Hosting account cleanup|500`],
 agents: ['AI agents for business teams', 'AI agents that take over a repeated task for one team, with limits and a human check where it matters.', `
Sales follow-up agent|6000
Social media reply agent|5000
Recruitment screening agent|7000
Inventory reorder agent|6000
Payment reconciliation agent|8000
Customer onboarding agent|6000
Quote generator agent|5000
Order status agent|4000
Review reply agent|3000
Content repurposing agent|4000
SEO content agent|5000
Competitor monitoring agent|5000
Lead research agent|5000
Appointment reminder agent|3000
Product description writer agent|3000
Translation agent for business documents|4000
Data entry agent|5000
Weekly report agent|4000
Purchase request agent|5000
IT helpdesk agent|6000
Owner assistant agent|6000
Phone receptionist agent|10000
WhatsApp AI sales agent|6000
Multi-agent team for one workflow|15000
AI agent safety limits and review|3000`],
 workflow: ['Business workflows and approvals', 'Requests, approvals and hand-offs that move by themselves and leave a record.', `
Approval workflow|3000
Purchase request flow|3000
Leave request flow|2500
New employee onboarding workflow|3000
Invoice approval flow|3000
Document generation from templates|2500
E-signature flow|3000
Contract renewal reminders|1500
Order-to-cash workflow|6000
Social media cross-posting flow|1500
Lead routing to sales staff|2000
Customer feedback loop|2000
Owner daily summary by WhatsApp|2000
Data sync between two apps|2500
Airtable automation pack|2000
Make scenario pack, 5 flows|4000
n8n AI workflow|4000
Microsoft Power Automate flow|3000
Google Apps Script automation|2500
Email to task list automation|1500
Form to CRM automation|1500
Receipt scan to accounting|3500
Payroll preparation automation|4000
Stock opname reminder and record|2000
Workflow map and automation plan|1500`],
 bots: ['Chatbots by type of business', 'Chatbots that already know the questions a given kind of business gets every day.', `
Restaurant chatbot with menu and orders|3000
Clinic chatbot with appointment request|3500
Hotel chatbot with room questions|3500
School chatbot for parents|3000
Property chatbot for listings|3500
Online shop chatbot with order tracking|3500
Salon chatbot with booking|2500
Travel agent chatbot|3500
Car dealer chatbot|3500
Insurance questions chatbot|5000
Gym chatbot with class schedule|2500
Event chatbot with ticket questions|2500
Law office intake chatbot|4000
Recruitment chatbot|3500
Internal IT helpdesk chatbot|4000
HR questions chatbot|3500
Chatbot in several languages|5000
Phone voice chatbot|8000
Website and WhatsApp chatbot bundle|5000
Chatbot with payment link|3500
Chatbot with booking calendar|3500
Chatbot answer refresh, 1 month|800
Chatbot conversation report|1000
Chatbot persona and tone setup|800
Chatbot move to another platform|3000`],
 features: ['Features for an existing web app', 'One new feature added to an app you already have, tested and merged into your code.', `
Export to Excel and PDF|1500
Notification center|2500
File manager in an app|3000
Comments and mentions|2500
Activity log|2000
Kanban board view|3000
Calendar view|2500
Map view with markers|2500
QR code scanner in the browser|2000
Two-factor login|2000
CSV import with checks|2000
Admin panel for an app|5000
Reports page with filters|3000
In-app chat between users|5000
Subscription plans and billing|5000
Partner API with keys|5000
Multi-step form wizard|1500
Print-ready documents from an app|2000
Bulk edit for records|2000
Saved filters and views|1500
User invitation by email|1500
Approval status on records|2000
Dashboard home page for an app|3000
Dark mode for an app|1500
Mobile-friendly pass for an app|2500`],
 desktop: ['Desktop apps, extensions and plugins', 'Software that runs on a computer or inside the tools your team already uses.', `
Electron desktop app|15000
Tauri desktop app|15000
Windows desktop app in .NET|18000
macOS desktop app|20000
Desktop app with Flutter|16000
Desktop installer with auto-update|3000
Command-line tool|3000
Chrome extension|5000
Firefox extension|5000
Safari extension|7000
Microsoft Edge extension|5000
VS Code extension|6000
JetBrains IDE plugin|8000
Excel add-in|5000
Google Sheets add-on|4000
Microsoft Word add-in|5000
Outlook add-in|6000
Gmail add-on|5000
Figma plugin|5000
Photoshop plugin|8000
Obsidian plugin|3000
Notion integration|4000
Raycast extension|3000
Code signing for a desktop app|1500
Old desktop app modernization|25000`],
 cms: ['CMS and e-commerce platforms', 'Custom work on the platform your site or shop already runs on.', `
WordPress custom theme|6000
WordPress custom plugin|5000
Elementor page build|1500
WooCommerce custom feature|4000
Shopify custom theme|8000
Shopify custom app|15000
Shopify store setup|4000
Magento store customization|15000
PrestaShop module|5000
OpenCart extension|4000
BigCommerce store setup|5000
Drupal site build|12000
Joomla site update|3000
Ghost blog setup|1500
Strapi CMS setup|4000
Sanity CMS setup|4000
Contentful setup|5000
Payload CMS setup|5000
Webflow CMS build|5000
Wix Velo custom code|3000
Squarespace custom code|2000
Moodle setup and theme|6000
Forum software setup|3000
Content move from one CMS to another|4000
Plugin conflict repair|800`],
 nocode: ['No-code and low-code apps', 'Working apps built on no-code tools, faster and cheaper to change.', `
Bubble app MVP|10000
FlutterFlow app|10000
Glide app|3000
AppSheet app|3000
Softr client portal|3000
Retool internal tool|6000
Appsmith internal tool|6000
Budibase app|5000
Power Apps canvas app|8000
Power Pages site|8000
Adalo app|6000
Thunkable app|5000
Framer site with CMS|4000
WeWeb frontend|6000
Xano backend|5000
Airtable interface|2000
Notion-based website|1500
Typeform with logic|1000
Jotform workflow|1500
Google Sheets web app|2500
No-code app repair|1000
No-code to code migration|20000
No-code tool choice review|1500
No-code training for a team|2000
Zapier Interfaces app|2500`],
 payments: ['Payments and industry integrations', 'Connections to the payment, shipping, marketplace and industry systems a business uses.', `
Midtrans payment integration|3000
Xendit payment integration|3000
QRIS payment integration|3000
PayPal integration|2500
Bank transfer auto-check|5000
Virtual account payments|5000
Subscription billing setup|6000
Split payment for marketplaces|10000
Shipping rate and tracking integration|4000
Shopee store API integration|5000
Tokopedia store API integration|5000
Lazada store API integration|5000
Amazon seller API integration|8000
SMS gateway integration|2500
OTP login by SMS and email|3000
E-signature integration|4000
Tax invoice integration|8000
HL7 FHIR health records integration|20000
Open banking API integration|15000
Maps and geocoding integration|3000
Delivery dispatch logic|15000
Loyalty points system|8000
Voucher and promo code engine|5000
E-wallet top-up integration|6000
Hotel channel manager connection|10000`],
 martech: ['Marketing technology and tracking', 'Tracking, email and campaign tools wired up so every sale shows where it came from.', `
Meta Pixel and Conversions API|2500
Google Ads conversion tracking|2000
TikTok Pixel and events API|2500
Server-side tagging|5000
Google Tag Manager cleanup|2000
UTM link system|1000
Email marketing platform setup|2500
Klaviyo flows for a shop|5000
Mailchimp automation|2500
Abandoned cart email flow|2500
Web push notifications|2000
Referral program system|6000
Affiliate tracking system|8000
Customer data platform setup|10000
Heatmap and session recording setup|1500
A/B testing setup for landing pages|3000
Lead scoring setup|4000
HubSpot marketing automation|5000
Popup and lead form setup|1000
Review collection widget|1500
Google Business Profile post automation|2000
Programmatic SEO pages|10000
Marketing attribution report|5000
Campaign landing page tracking check|800
Email list cleanup and segmentation|1500`],
 cloud: ['Cloud architecture and identity', 'Cloud set up to be safe, repeatable and sized to the bill.', `
Google Cloud starter setup|5000
Azure starter setup|5000
Terraform infrastructure as code|10000
Pulumi infrastructure as code|10000
Serverless API on AWS Lambda|8000
Cloudflare Workers app|5000
Microservices split plan|8000
Service mesh setup|15000
Auto-scaling setup|6000
Multi-region failover|20000
Disaster recovery setup|12000
Grafana and Prometheus monitoring|6000
Error tracking with Sentry|2000
Single sign-on setup|6000
Keycloak identity server|8000
Okta setup|6000
Microsoft Entra ID setup|6000
Cloud access rights cleanup|5000
Secrets manager setup|3000
Object storage and CDN setup|3000
Self-hosted Git server|4000
Self-hosted email server|5000
WireGuard VPN server|3000
Cloud migration plan|8000
Cloud migration, full move|25000`],
 ml: ['Machine learning and computer vision', 'Models trained or tuned on your data, delivered with a written accuracy report.', `
Image classification model|12000
Object detection model|18000
OCR for forms and receipts|10000
Barcode and QR reading service|4000
Face blur for photos and video|8000
Product photo background removal|4000
Speech-to-text pipeline|8000
Text-to-speech voice setup|4000
Text classification model|8000
Name and entity extraction|10000
Recommendation engine|18000
Fraud detection model|20000
Demand forecasting model|15000
Time-series anomaly model|12000
LLM fine-tuning on your data|20000
Embedding search setup|8000
Model serving API|8000
MLOps pipeline|20000
Model retraining schedule|6000
Data labeling setup|4000
Model accuracy report|4000
On-device model for mobile|15000
Video analytics pipeline|20000
Product image generation pipeline|10000
Translation model tuning|15000`],
 dbeng: ['Databases and data engineering', 'Databases that stay fast, safe and backed up, and data that arrives on time.', `
PostgreSQL tuning|4000
MySQL tuning|4000
MongoDB schema review|4000
Redis cache setup|3000
Elasticsearch setup|6000
OpenSearch setup|6000
Database replication setup|6000
Database high availability|12000
Point-in-time recovery setup|4000
Database version upgrade|4000
Database sharding plan|8000
BigQuery setup|5000
Snowflake setup|8000
dbt models|8000
Airflow pipeline|8000
Kafka event stream|12000
Change data capture pipeline|10000
Data lake on object storage|12000
Vector database setup|5000
Time-series database setup|5000
Database access control|3000
Data masking for test copies|5000
SQL report queries, 10 queries|2000
Spreadsheet to database move|3000
Database documentation|2500`],
 itsupport: ['Remote IT support', 'Help with computers, accounts and software, done remotely over a screen share. No on-site visits.', `
Remote PC troubleshooting, 1 hour|300
Remote Mac troubleshooting, 1 hour|350
Slow computer cleanup, remote|400
Virus and adware removal, remote|500
Software installation, remote|300
Operating system update, remote|400
Email account setup on devices|300
Microsoft Office setup help|300
Email account recovery help|500
Social media account recovery help|800
File recovery from cloud backup|800
Printer driver setup, remote|250
Router settings check, remote|400
Password manager rollout|3000
Mobile device management setup|8000
Antivirus rollout for an office|4000
Staff onboarding and offboarding checklist|2000
IT helpdesk, 1 month|5000
IT helpdesk, 12 months|50000
Software license inventory|3000
IT asset inventory system|4000
Shared drive permission cleanup|3000
Email move between providers|3000
Google Workspace to Microsoft 365 move|8000
Two-step login for all staff|2000`],
 compliance: ['Compliance and IT governance', 'Written policies, checks and records that auditors, banks and partners ask for.', `
Indonesian personal data law readiness|8000
GDPR readiness review|8000
ISO 27001 document set|20000
ISO 27001 gap assessment|10000
SOC 2 readiness review|15000
PCI DSS self-assessment help|10000
HIPAA technical checklist|8000
IT policy set, 10 policies|8000
Acceptable use policy|1500
Information security risk register|5000
Business continuity plan|8000
Security questionnaire answers for a client|3000
Vendor risk review|5000
Access rights review|3000
Audit log setup|4000
Data retention schedule|3000
Cookie consent banner setup|1500
Privacy notice draft for an app|2000
Data processing agreement checklist|1500
Accessibility statement|1000
Security awareness quiz for staff|2000
Change management procedure|2500
IT governance review|8000
Compliance evidence folder setup|3000
Compliance calendar with reminders|2000`],
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
