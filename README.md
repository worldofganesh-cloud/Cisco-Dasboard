# Cisco Global Command Center (demo dashboard)

An executive "command center" dashboard for a large enterprise, simulated for Cisco. It is a
single web page: no server, no Python, no installation. Customers open a link, type the
access key, and get a fully interactive dashboard.

> **All figures are simulated** for demonstration. They are not Cisco results, forecasts or
> customer data. Customer, supplier and employee names are fictional.

## What is inside

13 hubs, all driven by one consistent data model (about 127,000 monthly revenue records plus
accounts, deals, workforce, supply chain, service and market data):

| Hub | Highlights |
|---|---|
| Executive Cockpit | 8 KPIs, revenue by portfolio and theater, global map with 56 initiative overlay, auto-detected alerts |
| Strategic Initiatives | 56 transformation initiatives on a world map, investment, status, register |
| Revenue & Bookings | Revenue vs bookings, portfolio sunburst, YoY bridge, product × theater growth heatmap, channel mix, country ledger |
| Sales Pipeline | Funnel, forecast categories, coverage, win rate by competitor, loss reasons, AE leaderboard, 1,500 deals |
| Customers & Subscriptions | ARR, NRR/GRR, health map, renewal calendar, 420 named accounts with drill-down profiles |
| Products & Portfolio | Treemap, AI infrastructure orders vs target, growth vs margin, product scorecard |
| Finance | Non-GAAP P&L, margins, opex, plan variance, cash flow bridge, working capital, balance sheet |
| Supply Chain & Operations | Backlog, lead-time heatmap, on-time delivery, supplier risk matrix, manufacturing sites |
| Workforce | Headcount by function and site, attrition heatmap, hiring funnel, site roster |
| Customer Experience | TAC case volumes by severity, CSAT, MTTR, SLA, case drivers |
| Competitive Intelligence | Market share in 8 markets, head-to-head win/loss, battlecards |
| Investor Relations | Share price vs index, earnings surprise, capital return, consensus table |
| Sustainability & Impact | Emissions vs net-zero path, renewable electricity, takeback, goal tracker |

**Slice and dice:** the filter bar (period, theater, region, country, portfolio, product line,
segment, vertical) applies everywhere it makes sense; each hub shows which filters apply.
Click almost any bar, map country, heatmap cell or table row to filter or drill in.
Every table sorts, searches and downloads to CSV; the toolbar exports the current view to
Excel or PDF (print), toggles light/dark mode, and goes full screen for presenting.

**Animation:** charts animate in when a hub opens (bars grow from the baseline, lines draw on,
areas and heatmaps wipe in, map countries and initiative pins appear in sequence), KPI numbers
count up, and cards rise into place. Changing a filter plays a shorter version and numbers roll
from their previous value. The sparkle icon in the toolbar switches motion off (remembered in
the browser); it is automatically off for anyone whose system asks for reduced motion, and
printing or saving to PDF always shows the finished charts. Charts resize with their cards and
re-lay-out at phone, tablet and desktop widths.

**Co-branding:** the Cisco logo sits top-left; the customer's logo appears top-right. Set it
with the brush icon, or send a pre-branded link:
`https://worldofganesh-cloud.github.io/Cisco-Dasboard/?client=acme.com&clientName=Acme`

## Publishing the link (one-time, about 3 minutes)

GitHub Pages hosts this page for free, but on a free GitHub plan the repository must be
**public**. That is safe here: the dashboard and its source are AES-256 encrypted in the
repository, and nothing opens without the access key.

1. Open the repository on GitHub, then **Settings → General**, scroll to **Danger Zone →
   Change repository visibility → Public**. (With GitHub Pro you can skip this and keep it private.)
2. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to
   *Deploy from a branch*, choose the branch holding this code (`main` once merged,
   or `claude/logo-dev-api-migration-hlu6c1`) and folder **/ (root)**, then **Save**.
3. After a minute or two the page shows your link:
   `https://worldofganesh-cloud.github.io/Cisco-Dasboard/`

Share that link plus the access key with prospects. Without the key the page shows only a
login screen.

## For developers

The plain source lives in `src/` (git-ignored). The repository holds only encrypted output:

- `index.html`: login page plus the encrypted dashboard (PBKDF2-SHA256, 600k iterations, AES-256-GCM)
- `source.enc`: the encrypted `src/` tree
- `tools/build.mjs`, `tools/decrypt.mjs`, `tools/gate.html`: build tooling (Node 18+)

```bash
# restore the editable source
DASHBOARD_PASSWORD='the-access-key' node tools/decrypt.mjs
# edit src/..., preview src/index.html in a browser, then rebuild:
DASHBOARD_PASSWORD='the-access-key' node tools/build.mjs     # or a new key to rotate it
git add index.html source.enc && git commit -m "Update dashboard" && git push
```

To change the access key, run `build.mjs` with a new password and push. Old links keep
working; the old key stops working.

Optional: for high-resolution logos from [Logo.dev](https://www.logo.dev), put a free
publishable key in `CONFIG.LOGO_DEV_TOKEN` in `src/js/core.js` and rebuild. Without one, the
built-in vector Cisco mark is used, and customer logos fall back to their website icon.

Charts use [Plotly.js](https://plotly.com/javascript/) and icons use [Lucide](https://lucide.dev).
Both libraries and the world-map data are **bundled inside the encrypted page** (`src/vendor/`),
so the dashboard makes no third-party requests and keeps working if a CDN is blocked by a
corporate firewall. The only optional outside request is the Inter web font; without it the
page falls back to the system font.
