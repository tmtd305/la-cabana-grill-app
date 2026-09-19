// Customer profile, persisted in localStorage (device-local, no server account needed).
const ACCOUNT_KEY = "lacabana_account";

function getAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY)) || null;
  } catch {
    return null;
  }
}

function saveAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function clearAccount() {
  localStorage.removeItem(ACCOUNT_KEY);
}

function hasAccount() {
  return !!getAccount();
}

// Used by the header/nav account icon on every page.
function goToAccount() {
  window.location.href = "account.html";
}
