export async function onRequest(context) {
  const request = context.request;

  // Редирект пользователей из России и Беларуси на зеркало Vercel
  const country = request.headers.get("CF-IPCountry");

  if (country === "RU" || country === "BY") {
    const redirectUrl = new URL(request.url);
    redirectUrl.hostname = "regruha.vercel.app";

    return Response.redirect(redirectUrl.toString(), 302);
  }

  const incomingUrl = new URL(request.url);
  const siteUrl = `${incomingUrl.protocol}//${incomingUrl.host}`;

  const image = "https://github.com/Rusmer/regruha/blob/main/functions/favicon.png?raw=true";
  const title = "Regruha — T-Regruha";
  const description = "Regruha / T-Regruha — официальный сайт проекта.";

  if (incomingUrl.pathname === "/google14337db78de6911c.html") {
    return new Response("google-site-verification: google14337db78de6911c.html", {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  if (incomingUrl.pathname === "/robots.txt") {
    const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  if (incomingUrl.pathname === "/sitemap.xml") {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </url>
</urlset>`;

    return new Response(body, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
      },
    });
  }

  if (incomingUrl.pathname.startsWith("/api/")) {
    return fetch(request);
  }

  const url = new URL(request.url);
  url.hostname = "regruha-terminal-core.base44.app";
  url.searchParams.set("v", "2");

  const response = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? null : await request.clone().text(),
    redirect: "follow",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Regruha",
    alternateName: "T-Regruha",
    url: `${siteUrl}/`,
    description,
  };

  const rewritten = new HTMLRewriter()
    .on('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], link[rel="canonical"], meta[name="description"]', {
      element(el) {
        el.remove();
      },
    })
    .on("title", {
      element(el) {
        el.remove();
      },
    })
    .on("textarea", {
      element(el) {
        el.setAttribute("placeholder", "Напишите ответ...");
      },
    })
    .on('span.font-mono.text-\\[10px\\].tracking-widest.text-gold', {
      element(el) {
        if (el.textContent.includes("// ОТВЕТИТЬ (поддерживается Markdown)")) {
          el.setInnerContent("// ОТВЕТИТЬ)");
        }
      },
    })
    .on('div.min-w-0 > div.font-mono.text-\\[9px\\].tracking-widest.text-zinc-data', {
      element(el) {
        if (el.textContent?.trim() === "РЕЙТИНГ") {
          el.setInnerContent("ОЦЕНКА METACRITIC");
        }
      },
    })
    .on('label.font-mono.text-\\[9px\\].tracking-widest.text-zinc-data.block.mb-1', {
      element(el) {
        if (el.textContent?.trim() === "РЕЙТИНГ") {
          el.setInnerContent("ОЦЕНКА METACRITIC");
        }
      },
    })
    .on('input[placeholder="PEGI 18 / 18+"]', {
      element(el) {
        el.setAttribute("placeholder", "7.2/10");
      },
    })
    .on("head", {
      element(el) {
        el.prepend(`
          <script>
            (function() {
              const hideElements = () => {
                document.querySelectorAll('button').forEach(btn => {
                  if (btn.textContent && btn.textContent.includes('Continue with Google')) {
                    btn.style.setProperty('display', 'none', 'important');
                  }
                });

                document.querySelectorAll('div.uppercase span').forEach(span => {
                  if (span.textContent && span.textContent.trim() === 'or') {
                    const parentDiv = span.closest('div.relative');
                    if (parentDiv) parentDiv.style.setProperty('display', 'none', 'important');
                  }
                });

                document.querySelectorAll('div.min-w-0 > div.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data').forEach(el => {
                  if (el.textContent && el.textContent.trim() === 'РЕЙТИНГ') {
                    el.textContent = 'ОЦЕНКА METACRITIC';
                  }
                });

                document.querySelectorAll('label.font-mono.text-\\\\[9px\\\\].tracking-widest.text-zinc-data.block.mb-1').forEach(el => {
                  if (el.textContent && el.textContent.trim() === 'РЕЙТИНГ') {
                    el.textContent = 'ОЦЕНКА METACRITIC';
                  }
                });

                document.querySelectorAll('div.absolute.top-0.right-0.bg-gold.text-\\\\[\\\\#050505\\\\].font-mono.text-\\\\[10px\\\\].font-bold.tracking-widest.px-3.py-1.z-20').forEach(el => {
                  if (el.textContent && el.textContent.trim() === 'ОЖИДАЕМЫЙ РЕЛИЗ') {
                    el.textContent = 'ИЗБРАННОЕ';
                  }
                });

                document.querySelectorAll('textarea').forEach(el => {
                  el.setAttribute('placeholder', 'Напишите ответ...');
                });

                document.querySelectorAll('input[placeholder="PEGI 18 / 18+"]').forEach(el => {
                  el.setAttribute('placeholder', '7.2/10');
                });
              };

              hideElements();
              new MutationObserver(hideElements).observe(document.documentElement, {
                childList: true,
                subtree: true
              });
            })();
          </script>

          <style>
            #base44-badge,
            #base44-edit-badge {
              display: none !important;
            }

            button:has(svg path[fill="#4285F4"]),
            div.uppercase:has(span) {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          </style>

          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="google-site-verification" content="google14337db78de6911c.html">
          <title>${title}</title>
          <meta name="description" content="${description}">
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
          <meta name="googlebot" content="index, follow">
          <link rel="canonical" href="${siteUrl}/">
          <link rel="icon" type="image/png" href="${image}" sizes="32x32">
          <link rel="shortcut icon" href="${image}">
          <link rel="apple-touch-icon" href="${image}">
          <meta property="og:site_name" content="Regruha">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${image}">
          <meta property="og:type" content="website">
          <meta property="og:url" content="${siteUrl}/">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${image}">
          <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
        `, { html: true });
      },
    })
    .transform(response);

  const newHeaders = new Headers(rewritten.headers);
  newHeaders.delete("x-robots-tag");
  newHeaders.delete("x-frame-options");
  newHeaders.delete("content-security-policy");
  newHeaders.set("content-security-policy", "frame-ancestors *;");

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers: newHeaders,
  });
}
