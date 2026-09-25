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

// Profile photo: cropped square, small JPEG (so it can be shown to staff instantly when you talk to order).
function shrinkPhoto(file) {
  return new Promise(function (res, rej) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var S = 160, c = document.createElement("canvas"); c.width = c.height = S;
      var m = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("That photo couldn't be read")); };
    img.src = url;
  });
}
