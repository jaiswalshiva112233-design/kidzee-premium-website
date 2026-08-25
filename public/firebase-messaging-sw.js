/* Firebase Messaging service worker. Public Firebase web identifiers arrive in the registration URL. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
const params = new URL(self.location.href).searchParams;
firebase.initializeApp({ apiKey: params.get("apiKey"), authDomain: params.get("authDomain"), projectId: params.get("projectId"), storageBucket: params.get("storageBucket"), messagingSenderId: params.get("messagingSenderId"), appId: params.get("appId") });
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload && payload.data ? payload.data : {};
  self.registration.showNotification(data.title || "CentreOS notification", { body: data.body || "Open CentreOS to review this update.", icon: "/images/kidzee-logo.png", badge: "/images/kidzee-logo.png", data: { href: data.href || "/admin/notifications", notificationId: data.notificationId || "" }, tag: data.notificationId || undefined, renotify: false });
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); const href = new URL((event.notification.data && event.notification.data.href) || "/admin/notifications", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => { for (const client of windows) { if (client.url.startsWith(self.location.origin) && "focus" in client) { client.navigate(href); return client.focus(); } } return clients.openWindow(href); }));
});
