export async function onRequest(context) {
  const request = context.request;
  const incomingUrl = new URL(request.url);

  incomingUrl.hostname = "regruha-terminal-core.base44.app";

  const response = await fetch(incomingUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? null : await request.clone().text(),
    redirect: "follow",
  });

  return response;
}
