# Lean Visitor Analytics

This site can measure basic effectiveness without advertising trackers or invasive profiles.

## What the lean version tracks

- request path, timestamp, status, referrer, and user agent
- Cloudflare country, ASN, and network organization when available
- broad crawler family from user-agent strings
- hits to `/`, `/privacy.html`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`
- JavaScript-enabled page views and tracked clicks on key calls to action

It does not use cookies or cross-site advertising identifiers.

## Cloudflare setup

1. Put `fieldnoteciviclabs.com` behind Cloudflare and proxy the DNS record.
2. Enable Cloudflare Web Analytics and AI Crawl Control in the dashboard.
3. Create a D1 database named `fieldnote_visitor_log`.
4. Apply `cloudflare/visitor-logger/schema.sql` to the D1 database.
5. Copy `cloudflare/visitor-logger/wrangler.toml.example` to `wrangler.toml`.
6. Replace the D1 `database_id`.
7. Deploy from `cloudflare/visitor-logger/`.
8. Change the `fieldnote-analytics` meta tag in `index.html` from `disabled` to `enabled`
   after the Worker route is live. Server-side request logging works through the Worker;
   the page script only adds JavaScript-enabled page views and CTA click events.

## Useful queries

Daily totals:

```sql
SELECT substr(observed_at, 1, 10) AS day, kind, count(*) AS hits
FROM request_log
GROUP BY day, kind
ORDER BY day DESC, kind;
```

Crawler hits:

```sql
SELECT observed_at, path, crawler_family, user_agent
FROM request_log
WHERE crawler_family != ''
ORDER BY observed_at DESC
LIMIT 50;
```

Top organizations:

```sql
SELECT as_organization, country, count(*) AS hits
FROM request_log
WHERE as_organization != ''
GROUP BY as_organization, country
ORDER BY hits DESC
LIMIT 25;
```

Contact and CTA clicks:

```sql
SELECT observed_at, event_name, event_label, path, referrer
FROM request_log
WHERE kind = 'client_event'
ORDER BY observed_at DESC
LIMIT 50;
```

## Reading the data

Treat ASN and organization as network-level evidence, not person-level identity. A visitor may appear as a home ISP, mobile carrier, cloud provider, university, company network, or crawler operator.
