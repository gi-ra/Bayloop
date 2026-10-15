// Minimal service worker: just enough to receive push notifications and
// handle a tap on one. No offline caching — that's a separate concern
// from "can this phone get notified", and skipping it keeps this simple.

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Bayloop", body: "" };

  event.waitUntil(
    self.registration.showNotification(data.title || "Bayloop", {
      body: data.body || "",
      icon: "/icon-512",
      badge: "/icon-512",
      data: { url: data.url || "/tech" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/tech";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
