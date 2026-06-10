const EVENT_PATH = "/__event";
const PUBLIC_HOST = "fieldnoteciviclabs.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === EVENT_PATH && request.method === "POST") {
      const response = new Response(null, {
        headers: {
          "access-control-allow-origin": "https://" + PUBLIC_HOST,
          "cache-control": "no-store"
        },
        status: 204
      });

      ctx.waitUntil(logRequest(request, env, "client_event"));
      return response;
    }

    const response = await env.ASSETS.fetch(request);

    if (shouldLog(url.pathname)) {
      ctx.waitUntil(logRequest(request, env, "request", response.status));
    }

    return response;
  }
};

function shouldLog(pathname) {
  return (
    pathname === "/" ||
    pathname === "/index.html" ||
    pathname === "/privacy.html" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/site-index.json" ||
    pathname === EVENT_PATH
  );
}

async function logRequest(request, env, kind, status) {
  if (!env.DB) {
    return;
  }

  const url = new URL(request.url);
  const cf = request.cf || {};
  const userAgent = request.headers.get("user-agent") || "";
  const eventBody = kind === "client_event" ? await readEventBody(request) : {};

  await env.DB.prepare(
    `INSERT INTO request_log (
      id,
      observed_at,
      kind,
      method,
      path,
      query,
      status,
      referrer,
      user_agent,
      crawler_family,
      country,
      asn,
      as_organization,
      cf_ray,
      event_name,
      event_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      kind,
      request.method,
      url.pathname,
      url.search.slice(0, 500),
      status || null,
      request.headers.get("referer") || eventBody.referrer || "",
      userAgent,
      classifyCrawler(userAgent),
      cf.country || "",
      cf.asn || null,
      cf.asOrganization || "",
      request.headers.get("cf-ray") || "",
      eventBody.name || "",
      eventBody.detail && eventBody.detail.label ? eventBody.detail.label : ""
    )
    .run();
}

async function readEventBody(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return {};
    }

    return body;
  } catch (_error) {
    return {};
  }
}

function classifyCrawler(userAgent) {
  const ua = userAgent.toLowerCase();

  if (!ua) {
    return "";
  }

  if (ua.includes("gptbot") || ua.includes("oai-searchbot") || ua.includes("chatgpt-user")) {
    return "openai";
  }

  if (ua.includes("claudebot") || ua.includes("anthropic-ai")) {
    return "anthropic";
  }

  if (ua.includes("perplexitybot")) {
    return "perplexity";
  }

  if (ua.includes("googlebot")) {
    return "google";
  }

  if (ua.includes("bingbot")) {
    return "bing";
  }

  if (ua.includes("applebot")) {
    return "apple";
  }

  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    return "other_crawler";
  }

  return "";
}
