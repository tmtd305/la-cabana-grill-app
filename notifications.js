// Marketing push notifications via OneSignal (free tier, no custom backend needed).
// Setup: create a free account at onesignal.com, add a "Web Push" app pointed at
// your deployed domain, then paste the App ID below. Campaigns are sent from the
// OneSignal dashboard (or their API) - no server code required on your end.
const ONESIGNAL_APP_ID = "b6d40ede-00ae-4278-93cf-42de4bdcf70b";

window.OneSignalDeferred = window.OneSignalDeferred || [];

function initNotifications() {
  if (ONESIGNAL_APP_ID === "REPLACE_WITH_YOUR_ONESIGNAL_APP_ID") return;
  const script = document.createElement("script");
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  script.defer = true;
  document.head.appendChild(script);
  OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
    refreshNotifButton(await OneSignal.Notifications.permission);
    OneSignal.Notifications.addEventListener("permissionChange", refreshNotifButton);
  });
}

function refreshNotifButton(granted) {
  document.querySelectorAll("[data-notif-toggle]").forEach((btn) => {
    btn.textContent = granted ? "Notifications On" : "Enable Deals & Updates";
    btn.classList.toggle("opacity-60", granted);
  });
}

function requestNotifications() {
  if (ONESIGNAL_APP_ID === "REPLACE_WITH_YOUR_ONESIGNAL_APP_ID") {
    showToast("Add your OneSignal App ID in notifications.js to enable this");
    return;
  }
  OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.Notifications.requestPermission();
  });
}

document.addEventListener("DOMContentLoaded", initNotifications);
