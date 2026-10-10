// Service worker: rende l'app installabile e mostra le notifiche push del laboratorio. Non mette in cache i dati.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (e) => {
  let d = { titolo: "EcuLion", testo: "", link: "/lab/notifiche" };
  try { d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(d.titolo, {
    body: d.testo,
    icon: "/icone/icona-192.png",
    badge: "/icone/icona-192.png",
    data: { link: d.link },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "/lab";
  e.waitUntil((async () => {
    const tutte = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of tutte) {
      if ("focus" in c) { await c.focus(); if ("navigate" in c) return c.navigate(link); return; }
    }
    return self.clients.openWindow(link);
  })());
});
