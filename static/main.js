// ---------- Common helpers ----------
function getUserName() {
  return localStorage.getItem("registeredName") || "";
}
function getUserEmail() {
  return localStorage.getItem("registeredEmail") || "";
}
function getUserPassword() {
  return localStorage.getItem("registeredPassword") || "";
}
function setUserPassword(newPassword) {
  localStorage.setItem("registeredPassword", newPassword);
}
function saveUserData(name, email, password) {
  localStorage.setItem("registeredName", name);
  localStorage.setItem("registeredEmail", email);
  localStorage.setItem("registeredPassword", password);
}
const PENDING_SIGNUP_KEY = 'eco_pending_signup';

// ---------- Terms page logic ----------
function initTerms() {
  const btn = document.getElementById('accept-terms-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.setItem('ecoMartTermsAccepted', 'true');
    window.location.href = 'login.html';
  });
  const termsBox = document.querySelector('.terms-box');
  if (termsBox) termsBox.scrollTop = termsBox.scrollHeight;
}

// ---------- Login page ----------
function login() {
  const emailEl = document.getElementById("login-email");
  const passEl = document.getElementById("login-password");
  const error = document.getElementById("login-error");
  if (!emailEl || !passEl || !error) return;

  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!email.endsWith("@bvrit.ac.in")) {
    error.textContent = "Only @bvrit.ac.in emails allowed";
    return;
  }
  if (password.length < 4) {
    error.textContent = "Password too short";
    return;
  }

  const storedEmail = localStorage.getItem("registeredEmail");
  const storedPassword = localStorage.getItem("registeredPassword");
  if (email !== storedEmail || password !== storedPassword) {
    error.textContent = "Invalid email or password";
    return;
  }

  error.textContent = "";
  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("loggedInName", localStorage.getItem("registeredName") || "");
  window.location.href = "home.html";
}
function showSignupPage() {
  window.location.href = "signup.html";
}
function showLoginPage() {
  window.location.href = "login.html";
}

// ---------- Signup + OTP ----------
let resendTimer = null;
let resendSecondsLeft = 30;

function signupSendOTP() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const errorEl = document.getElementById("signup-error");
  if (!errorEl) return;
  errorEl.textContent = "";

  if (!name || name.length < 2) {
    errorEl.textContent = "Please enter your full name (min 2 characters).";
    return;
  }
  if (!email.endsWith("@bvrit.ac.in")) {
    errorEl.textContent = "Only @bvrit.ac.in emails allowed";
    return;
  }
  if (!password || password.length < 4) {
    errorEl.textContent = "Password must be at least 4 characters";
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + (5 * 60 * 1000);
  const pending = { name, email, password, otp, expiry };
  localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
  console.info("Signup OTP (simulate email):", otp);

  window.location.href = "otp.html";
}

function initOTPPage() {
  const pendingRaw = localStorage.getItem(PENDING_SIGNUP_KEY);
  if (!pendingRaw) return;
  const pending = JSON.parse(pendingRaw);
  const email = pending.email;

  const maskedEl = document.getElementById("masked-email");
  if (maskedEl && email) {
    const parts = email.split("@");
    let masked = email;
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      const firstChar = local.charAt(0);
      const stars = local.length > 2 ? '*'.repeat(Math.max(3, local.length - 2)) : '*';
      masked = `${firstChar}${stars}@${domain}`;
    }
    maskedEl.textContent = masked;
  }

  const secondsSpan = document.getElementById("resend-seconds");
  const resendInfo = document.getElementById("resend-timer-info");
  const resendBtn = document.getElementById("otp-resend-btn");
  if (secondsSpan && resendInfo && resendBtn) {
    resendSecondsLeft = 30;
    secondsSpan.textContent = resendSecondsLeft;
    resendInfo.style.display = "block";
    resendBtn.disabled = true;
    startResendCountdown(30);
  }
}

function verifySignupOTP() {
  const input = document.getElementById("otp-input");
  if (!input) return;
  const userOtp = input.value.trim();
  const pendingRaw = localStorage.getItem(PENDING_SIGNUP_KEY);
  if (!pendingRaw) {
    alert("No OTP request found. Please signup again.");
    window.location.href = "signup.html";
    return;
  }
  const pending = JSON.parse(pendingRaw);

  if (Date.now() > pending.expiry) {
    alert("OTP expired. Please resend OTP.");
    return;
  }
  if (!userOtp || userOtp.length !== 6) {
    alert("Enter the 6-digit OTP.");
    return;
  }
  if (userOtp === pending.otp) {
    saveUserData(pending.name, pending.email, pending.password);
    localStorage.removeItem(PENDING_SIGNUP_KEY);
    alert("Signup complete — account created successfully! Please login.");
    window.location.href = "login.html";
  } else {
    alert("Incorrect OTP. Please try again.");
  }
}

function resendSignupOTP() {
  const pendingRaw = localStorage.getItem(PENDING_SIGNUP_KEY);
  if (!pendingRaw) {
    alert("No signup request found. Please fill signup form first.");
    window.location.href = "signup.html";
    return;
  }
  const pending = JSON.parse(pendingRaw);
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  pending.otp = newOtp;
  pending.expiry = Date.now() + (5 * 60 * 1000);
  localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));
  console.info("Resent signup OTP (simulate email):", newOtp);

  const input = document.getElementById("otp-input");
  if (input) input.value = "";
  startResendCountdown(30);
  alert("OTP resent to your email (simulated).");
}

function cancelOTP() {
  localStorage.removeItem(PENDING_SIGNUP_KEY);
  window.location.href = "signup.html";
}

function startResendCountdown(seconds) {
  clearInterval(resendTimer);
  resendSecondsLeft = seconds;
  const secondsSpan = document.getElementById("resend-seconds");
  const resendInfo = document.getElementById("resend-timer-info");
  const resendBtn = document.getElementById("otp-resend-btn");
  if (!secondsSpan || !resendInfo || !resendBtn) return;

  secondsSpan.textContent = resendSecondsLeft;
  resendBtn.disabled = true;
  resendTimer = setInterval(() => {
    resendSecondsLeft -= 1;
    if (resendSecondsLeft <= 0) {
      clearInterval(resendTimer);
      secondsSpan.textContent = 0;
      resendInfo.style.display = "none";
      resendBtn.disabled = false;
    } else {
      secondsSpan.textContent = resendSecondsLeft;
    }
  }, 1000);
}

// ---------- Home/header common ----------
function ensureLoggedIn() {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
  }
}
function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("loggedInName");
  window.location.href = "login.html";
}
function initUserMenu() {
  const userIcon = document.getElementById("user-icon");
  const menu = document.getElementById("user-menu");
  if (!userIcon || !menu) return;

  userIcon.addEventListener("click", () => {
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  });

  window.addEventListener("click", (event) => {
    if (menu.style.display === "flex" && !menu.contains(event.target) && event.target !== userIcon) {
      menu.style.display = "none";
    }
  });
}

// ---------- Details page ----------
function initDetailsPage() {
  ensureLoggedIn();
  const nameSpan = document.getElementById("detail-username");
  const emailSpan = document.getElementById("detail-email");
  if (nameSpan) nameSpan.textContent = getUserName();
  if (emailSpan) emailSpan.textContent = getUserEmail();
}
function toggleChangePasswordForm() {
  const form = document.getElementById("change-password-form");
  const err = document.getElementById("password-error");
  if (!form || !err) return;
  form.style.display = form.style.display === "block" ? "none" : "block";
  err.textContent = "";
}
function changePassword(event) {
  event.preventDefault();
  const current = document.getElementById("current-password").value.trim();
  const newPass = document.getElementById("new-password").value.trim();
  const confirmPass = document.getElementById("confirm-password").value.trim();
  const error = document.getElementById("password-error");
  if (!error) return false;
  if (current !== getUserPassword()) {
    error.textContent = "Current password is incorrect";
    return false;
  }
  if (newPass.length < 4) {
    error.textContent = "New password must be at least 4 characters";
    return false;
  }
  if (newPass !== confirmPass) {
    error.textContent = "New passwords do not match";
    return false;
  }
  setUserPassword(newPass);
  error.textContent = "";
  alert("Password changed successfully!");
  document.getElementById("change-password-form").style.display = "none";
  return true;
}

// ---------- Items / Sell (local only, same as original but per page) ----------
const itemsData = {
  'Books': [],
  'Clothes': [],
  'Gadgets': [],
  'Stationery': [],
  'Free Items': []
};
const soldItems = [];
let selectedCategory = '';
let accessToken = null;
let pickerInited = false;

function initBuyPage() {
  ensureLoggedIn();
}
function showItems(category) {
  const buyCategories = document.getElementById("buy-categories");
  const buyItemsList = document.getElementById("buy-items-list");
  const buyItemDetails = document.getElementById("buy-item-details");
  if (!buyCategories || !buyItemsList || !buyItemDetails) return;

  buyCategories.style.display = "none";
  buyItemsList.style.display = "block";
  buyItemDetails.style.display = "none";

  document.getElementById("category-title").textContent = category + " Items";
  const itemsContainer = document.getElementById("items-container");
  const noItems = document.getElementById("no-items");
  itemsContainer.innerHTML = "";
  noItems.style.display = "none";

  const items = itemsData[category] || [];
  if (items.length === 0) {
    noItems.style.display = "block";
  } else {
    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>Price: ${item.price}</p>
        <p>${item.description.substring(0, 50)}...</p>
      `;
      card.onclick = () => showItemDetails(category, index);
      itemsContainer.appendChild(card);
    });
  }
}
function showItemDetails(category, index) {
  const buyCategories = document.getElementById("buy-categories");
  const buyItemsList = document.getElementById("buy-items-list");
  const buyItemDetails = document.getElementById("buy-item-details");
  if (!buyCategories || !buyItemsList || !buyItemDetails) return;
  buyItemsList.style.display = "none";
  buyItemDetails.style.display = "block";

  const item = itemsData[category][index];
  document.getElementById("item-name").textContent = item.name;
  document.getElementById("item-image").src = item.image;
  document.getElementById("item-price").textContent = item.price;
  document.getElementById("item-description").textContent = item.description;
  document.getElementById("seller-username").textContent = item.seller;

  document.getElementById("buy-button").onclick = () => {
    alert(`Purchased ${item.name} for ${item.price}!`);
    soldItems.push({ ...item, seller: item.seller });
  };
  document.getElementById("wishlist-button").onclick = () =>
    alert(`Added ${item.name} to wishlist!`);
}
function backToCategories() {
  const buyCategories = document.getElementById("buy-categories");
  const buyItemsList = document.getElementById("buy-items-list");
  const buyItemDetails = document.getElementById("buy-item-details");
  if (!buyCategories || !buyItemsList || !buyItemDetails) return;
  buyItemsList.style.display = "none";
  buyItemDetails.style.display = "none";
  buyCategories.style.display = "block";
}
function backToItems() {
  const buyItemsList = document.getElementById("buy-items-list");
  const buyItemDetails = document.getElementById("buy-item-details");
  if (!buyItemsList || !buyItemDetails) return;
  buyItemDetails.style.display = "none";
  buyItemsList.style.display = "block";
}

// mail/ contact seller
function mailSeller() {
  const seller = document.getElementById("seller-username")?.textContent || "";
  alert(`Sending mail to ${seller}...`);
}
function contactSeller() {
  alert('Direct chat has been removed. Please use "Mail" to contact the seller.');
  mailSeller();
}

// Sell page
function initSellPage() {
  ensureLoggedIn();
}
function showSellForm(category) {
  selectedCategory = category;
  document.getElementById('selectedCategory').textContent = `Selling in ${category}`;
  document.getElementById('sell-form').style.display = 'block';
}
function hideSellForm() {
  const form = document.getElementById('sell-form');
  if (!form) return;
  form.style.display = 'none';
  const ids = ['itemName', 'itemPrice', 'itemDescription', 'itemImage'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// NOTE: Google Drive picker parts removed for brevity in multipage.
// Keep your original initializeGapi/createPicker if you really need them, unchanged.

function submitSellForm() {
  const itemName = document.getElementById('itemName').value;
  const itemPrice = document.getElementById('itemPrice').value;
  const itemDescription = document.getElementById('itemDescription').value;
  const itemImage = document.getElementById('itemImage').files[0];

  if (itemName && itemPrice && itemDescription && itemImage) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageData = e.target.result;
      itemsData[selectedCategory].push({
        name: itemName,
        price: `Rs${itemPrice}`,
        description: itemDescription,
        image: imageData,
        seller: getUserName()
      });
      alert(`Item "${itemName}" in ${selectedCategory} submitted!
Price: Rs${itemPrice}
Description: ${itemDescription}
Image: Uploaded`);
      hideSellForm();
    };
    reader.readAsDataURL(itemImage);
  } else {
    alert('Please fill all fields and select an image.');
  }
}

// ---------- Sold items ----------
function initSoldPage() {
  ensureLoggedIn();
  const container = document.getElementById("sold-items-container");
  const noSold = document.getElementById("no-sold-items");
  if (!container || !noSold) return;

  container.innerHTML = "";
  noSold.style.display = "none";
  const userSold = soldItems.filter(it => it.seller === getUserName());
  if (userSold.length === 0) {
    noSold.style.display = "block";
  } else {
    userSold.forEach(item => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <h3>${item.name}</h3>
        <p>Price: ${item.price}</p>
        <p>${item.description.substring(0, 50)}...</p>
      `;
      container.appendChild(card);
    });
  }
}

// ---------- Simple page router by body data-page ----------
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  switch (page) {
    case "terms":      initTerms(); break;
    case "login":      break;
    case "signup":     break;
    case "otp":        initOTPPage(); break;
    case "home":       ensureLoggedIn(); initUserMenu(); break;
    case "cart":       ensureLoggedIn(); break;
    case "orders":     ensureLoggedIn(); break;
    case "wishlist":   ensureLoggedIn(); break;
    case "details":    ensureLoggedIn(); initDetailsPage(); break;
    case "buy":        initBuyPage(); break;
    case "sell":       initSellPage(); break;
    case "sold":       initSoldPage(); break;
    case "payments":   ensureLoggedIn(); break;
  }
});
