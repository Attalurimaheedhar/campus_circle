  // Ensure T&C is shown first (force show regardless of previous localStorage)
  const termsPage = document.getElementById('terms-page');
  const acceptBtn = document.getElementById('accept-terms-btn');

  function showLoginAfterAccept() {
    // hide terms
    termsPage.style.display = 'none';
    termsPage.setAttribute('aria-hidden', 'true');
    // store acceptance
    localStorage.setItem('ecoMartTermsAccepted', 'true');
    // show login section
    document.getElementById("login-section").style.display = "flex";
    document.getElementById("login-section").setAttribute('aria-hidden', 'false');
    // ensure main UI hidden
    document.getElementById("main-page").style.display = "none";
    document.getElementById("main-page").setAttribute('aria-hidden','true');
    // focus first input for UX
    const emailInput = document.getElementById('login-email');
    if (emailInput) emailInput.focus();
  }

  acceptBtn.addEventListener('click', showLoginAfterAccept);

  // On load, force T&C visible first
  document.addEventListener('DOMContentLoaded', function () {
    // Always show T&C first per your requirement
    termsPage.style.display = 'flex';
    termsPage.setAttribute('aria-hidden','false');

    // hide other pages initially
    document.getElementById("login-section").style.display = "none";
    document.getElementById("signup-section").style.display = "none";
    document.getElementById("otp-page").style.display = "none";
    document.getElementById("main-page").style.display = "none";
    document.getElementById("cart-page").style.display = "none";
    document.getElementById("orders-page").style.display = "none";
    document.getElementById("wishlist-page").style.display = "none";
    document.getElementById("details-page").style.display = "none";
    document.getElementById("buy-page").style.display = "none";
    document.getElementById("sell-page").style.display = "none";
    document.getElementById("sold-items-page").style.display = "none";
    document.getElementById("payment-history-page").style.display = "none";

    // auto-scroll terms to bottom (keeps original behavior)
    const termsBox = document.querySelector('.terms-box');
    if (termsBox) termsBox.scrollTop = termsBox.scrollHeight;
  });

  // Sample hardcoded items data
  const itemsData = {
    'Books': [],
    'Clothes': [],
    'Gadgets': [],
    'Stationery': [],
    'Free Items': []
  };
  // Sold items data
  const soldItems = [];

  // OTP / signup temp storage keys
  const PENDING_SIGNUP_KEY = 'eco_pending_signup'; // will store JSON { name, email, password, otp, otpExpiry }

  // Resend timer
  let resendTimer = null;
  let resendSecondsLeft = 30;

  // Sell Items variables
  let selectedCategory = '';
  let currentImageInput = null;
  let accessToken = null;
  let pickerInited = false;

  function saveUserData(name, email, password) {
    localStorage.setItem("registeredName", name);
    localStorage.setItem("registeredEmail", email);
    localStorage.setItem("registeredPassword", password);
  }
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
  function showSignup() {
    hideAllPages();
    document.getElementById("signup-section").style.display = "flex";
    document.getElementById("signup-section").setAttribute('aria-hidden','false');
  }
  function showLogin() {
    hideAllPages();
    document.getElementById("login-section").style.display = "flex";
    document.getElementById("login-section").setAttribute('aria-hidden','false');
  }
  function showMain() {
    hideAllPages();
    document.getElementById("main-page").style.display = "block";
    document.getElementById("main-page").setAttribute('aria-hidden','false');
  }
  function showHome() {
    showMain();
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showCart() {
    hideAllPages();
    document.getElementById("cart-page").style.display = "block";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showOrders() {
    hideAllPages();
    document.getElementById("orders-page").style.display = "block";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showWishlist() {
    hideAllPages();
    document.getElementById("wishlist-page").style.display = "block";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showDetails() {
    document.getElementById("detail-username").textContent = getUserName();
    document.getElementById("detail-email").textContent = getUserEmail();
    hideAllPages();
    document.getElementById("details-page").style.display = "block";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showBuyPage() {
    hideAllPages();
    document.getElementById("buy-page").style.display = "block";
    document.getElementById("buy-categories").style.display = "block";
    document.getElementById("buy-items-list").style.display = "none";
    document.getElementById("buy-item-details").style.display = "none";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
  }
  function showSellPage() {
    hideAllPages();
    document.getElementById("sell-page").style.display = "block";
    hideSellForm();
    closeUserMenu();
    hideChangePasswordForm();
  }
  function showSoldItems() {
    hideAllPages();
    document.getElementById("sold-items-page").style.display = "block";
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
    const soldItemsContainer = document.getElementById("sold-items-container");
    const noSoldItems = document.getElementById("no-sold-items");
    soldItemsContainer.innerHTML = "";
    noSoldItems.style.display = "none";
    const userSoldItems = soldItems.filter(item => item.seller === getUserName());
    if (userSoldItems.length === 0) {
      noSoldItems.style.display = "block";
    } else {
      userSoldItems.forEach((item, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "category-card";
        itemCard.innerHTML = `
          <img src="${item.image}" alt="${item.name}" />
          <h3>${item.name}</h3>
          <p>Price: ${item.price}</p>
          <p>${item.description.substring(0, 50)}...</p>
        `;
        soldItemsContainer.appendChild(itemCard);
      });
    }
  }

  // NEW: Payment History page
  function showPaymentHistory() {
    hideAllPages();
    document.getElementById("payment-history-page").style.display = "block";
    closeUserMenu();
  }

  function hideAllPages() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("signup-section").style.display = "none";
    document.getElementById("otp-page").style.display = "none";
    document.getElementById("main-page").style.display = "none";
    document.getElementById("cart-page").style.display = "none";
    document.getElementById("orders-page").style.display = "none";
    document.getElementById("wishlist-page").style.display = "none";
    document.getElementById("details-page").style.display = "none";
    document.getElementById("buy-page").style.display = "none";
    document.getElementById("sell-page").style.display = "none";
    document.getElementById("sold-items-page").style.display = "none";
    document.getElementById("payment-history-page").style.display = "none";
  }
  function login() {
    let email = document.getElementById("login-email").value.trim();
    let password = document.getElementById("login-password").value.trim();
    let error = document.getElementById("login-error");
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
    localStorage.setItem("loggedInName", localStorage.getItem("registeredName"));
    showMain();
  }

  // SIGNUP + OTP flow (frontend simulated)
  function signupSendOTP() {
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const errorEl = document.getElementById("signup-error");
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

    // Generate 6-digit OTP and expiry (5 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes from now

    // Store pending signup in localStorage (simulated)
    const pending = { name, email, password, otp, expiry };
    localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));

    // For development/testing: log OTP in console so you can test
    console.info("Signup OTP (simulate email):", otp);

    // Navigate to OTP page and display masked email
    showOTPPage(email);
    startResendCountdown(30);
  }

  function showOTPPage(email) {
    hideAllPages();
    document.getElementById("otp-page").style.display = "block";
    document.getElementById("otp-page").setAttribute('aria-hidden','false');

    // Masked email display: show first char, stars, and domain
    const parts = email.split("@");
    let masked = email;
    if (parts.length === 2) {
      const local = parts[0];
      const domain = parts[1];
      const firstChar = local.charAt(0);
      const stars = local.length > 2 ? '*'.repeat(Math.max(3, local.length - 2)) : '*';
      masked = `${firstChar}${stars}@${domain}`;
    }
    document.getElementById("masked-email").textContent = masked;

    // Reset OTP input UI
    document.getElementById("otp-input").value = "";
    document.getElementById("resend-seconds").textContent = resendSecondsLeft = 30;
    document.getElementById("resend-timer-info").style.display = "block";
    document.getElementById("otp-resend-btn").disabled = true;
  }

  function verifySignupOTP() {
    const userOtp = document.getElementById("otp-input").value.trim();
    const pendingRaw = localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!pendingRaw) {
      alert("No OTP request found. Please signup again.");
      showSignup();
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
      // Create account
      saveUserData(pending.name, pending.email, pending.password);
      localStorage.removeItem(PENDING_SIGNUP_KEY);
      alert("Signup complete — account created successfully! Please login.");
      showLogin();
    } else {
      alert("Incorrect OTP. Please try again.");
    }
  }

  function resendSignupOTP() {
    const pendingRaw = localStorage.getItem(PENDING_SIGNUP_KEY);
    if (!pendingRaw) {
      alert("No signup request found. Please fill signup form first.");
      showSignup();
      return;
    }
    const pending = JSON.parse(pendingRaw);

    // Generate new OTP & update expiry
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = newOtp;
    pending.expiry = Date.now() + (5 * 60 * 1000); // 5 minutes
    localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(pending));

    console.info("Resent signup OTP (simulate email):", newOtp);

    // Reset UI and countdown
    document.getElementById("otp-input").value = "";
    startResendCountdown(30);
    alert("OTP resent to your email (simulated).");
  }

  function cancelOTP() {
    // Clear pending signup and return to signup form (keeps filled values)
    // We intentionally keep signup fields intact to let user modify if needed.
    localStorage.removeItem(PENDING_SIGNUP_KEY);
    hideAllPages();
    document.getElementById("signup-section").style.display = "flex";
  }

  function startResendCountdown(seconds) {
    clearInterval(resendTimer);
    resendSecondsLeft = seconds;
    document.getElementById("resend-seconds").textContent = resendSecondsLeft;
    document.getElementById("otp-resend-btn").disabled = true;
    resendTimer = setInterval(() => {
      resendSecondsLeft -= 1;
      if (resendSecondsLeft <= 0) {
        clearInterval(resendTimer);
        document.getElementById("resend-seconds").textContent = 0;
        document.getElementById("resend-timer-info").style.display = "none";
        document.getElementById("otp-resend-btn").disabled = false;
      } else {
        document.getElementById("resend-seconds").textContent = resendSecondsLeft;
      }
    }, 1000);
  }

  function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("loggedInName");
    closeUserMenu();
    hideChangePasswordForm();
    hideSellForm();
    showLogin();
  }
  function toggleUserMenu() {
    const menu = document.getElementById("user-menu");
    if (menu.style.display === "flex") {
      menu.style.display = "none";
    } else {
      menu.style.display = "flex";
    }
  }
  function closeUserMenu() {
    document.getElementById("user-menu").style.display = "none";
  }
  window.addEventListener('click', function(event) {
    const menu = document.getElementById("user-menu");
    const userIcon = document.getElementById("user-icon");
    const imageOptions = document.getElementById("imageOptions");
    const addImageBtn = document.querySelector(".add-image-btn");
    if (menu.style.display === "flex" && !menu.contains(event.target) && event.target !== userIcon) {
      menu.style.display = "none";
    }
    if (imageOptions && addImageBtn && !addImageBtn.contains(event.target) && !imageOptions.contains(event.target)) {
      imageOptions.style.display = "none";
    }
  });
  function toggleChangePasswordForm() {
    const form = document.getElementById("change-password-form");
    form.style.display = (form.style.display === "block") ? "none" : "block";
    document.getElementById("password-error").textContent = "";
  }
  function hideChangePasswordForm() {
    const form = document.getElementById("change-password-form");
    form.style.display = "none";
    document.getElementById("password-error").textContent = "";
    document.getElementById("current-password").value = "";
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
  }
  function changePassword(event) {
    event.preventDefault();
    let current = document.getElementById("current-password").value.trim();
    let newPass = document.getElementById("new-password").value.trim();
    let confirmPass = document.getElementById("confirm-password").value.trim();
    let error = document.getElementById("password-error");
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
    hideChangePasswordForm();
    return true;
  }

  // Buy Items functionality
  function showItems(category) {
    hideAllPages();
    document.getElementById("buy-page").style.display = "block";
    document.getElementById("buy-categories").style.display = "none";
    document.getElementById("buy-items-list").style.display = "block";
    document.getElementById("category-title").textContent = category + " Items";
    const itemsContainer = document.getElementById("items-container");
    itemsContainer.innerHTML = "";
    const noItems = document.getElementById("no-items");
    noItems.style.display = "none";
    const items = itemsData[category] || [];
    if (items.length === 0) {
      noItems.style.display = "block";
    } else {
      items.forEach((item, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "category-card";
        itemCard.innerHTML = `
          <img src="${item.image}" alt="${item.name}" />
          <h3>${item.name}</h3>
          <p>Price: ${item.price}</p>
          <p>${item.description.substring(0, 50)}...</p>
        `;
        itemCard.setAttribute("data-index", index);
        itemCard.onclick = () => showItemDetails(category, index);
        itemsContainer.appendChild(itemCard);
      });
    }
  }
  function showItemDetails(category, index) {
    document.getElementById("buy-items-list").style.display = "none";
    document.getElementById("buy-item-details").style.display = "block";
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
    document.getElementById("wishlist-button").onclick = () => alert(`Added ${item.name} to wishlist!`);
  }
  function mailSeller() {
    const seller = document.getElementById("seller-username").textContent;
    alert(`Sending mail to ${seller}...`);
  }
  function contactSeller() {
    alert('Direct chat has been removed. Please use "Mail" to contact the seller.');
    mailSeller();
  }
  function backToCategories() {
    document.getElementById("buy-items-list").style.display = "none";
    document.getElementById("buy-item-details").style.display = "none";
    document.getElementById("buy-categories").style.display = "block";
  }
  function backToItems() {
    document.getElementById("buy-item-details").style.display = "none";
    document.getElementById("buy-items-list").style.display = "block";
  }
  // Sell Items functionality
  function showSellForm(category) {
    selectedCategory = category;
    document.getElementById('selectedCategory').textContent = `Selling in ${category}`;
    document.getElementById('sell-form').style.display = 'block';
    initializeGapi();
  }
  function hideSellForm() {
    document.getElementById('sell-form').style.display = 'none';
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('imageOptions').style.display = 'none';
  }
  function toggleImageOptions() {
    const options = document.getElementById('imageOptions');
    options.style.display = options.style.display === 'block' ? 'none' : 'block';
  }
  function selectImageSource(source) {
    const imageInput = document.getElementById('itemImage');
    imageInput.style.display = 'block';
    switch (source) {
      case 'camera':
        imageInput.setAttribute('capture', 'camera');
        imageInput.removeAttribute('required');
        imageInput.click();
        break;
      case 'gallery':
        imageInput.removeAttribute('capture');
        imageInput.click();
        break;
      case 'drive':
        if (pickerInited && accessToken) {
          createPicker();
        } else {
          alert('Please authorize Google Drive access first.');
          initializeGapi();
        }
        break;
    }
    document.getElementById('imageOptions').style.display = 'none';
  }
  function initializeGapi() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:picker', () => {
        gapi.client.init({
          apiKey: 'YOUR_API_KEY', // Replace with your API Key
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        }).then(() => {
          pickerInited = true;
          gapi.load('picker', onPickerApiLoad);
        });
      });
    };
    document.head.appendChild(script);
  }
  function onPickerApiLoad() {
    gapi.auth.authorize({
      client_id: 'YOUR_CLIENT_ID', // Replace with your Client ID
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      immediate: false
    }, (response) => {
      if (response.error) {
        console.error('Auth error:', response.error);
      } else {
        accessToken = response.access_token;
        if (document.getElementById('sell-form').style.display === 'block') {
          createPicker();
        }
      }
    });
  }
  function createPicker() {
    const view = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setMimeTypes('image/png,image/jpeg,image/jpg');
    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey('YOUR_API_KEY') // Replace with your API Key
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  }
  function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
      const file = data.docs[0];
      document.getElementById('itemImage').files = new DataTransfer().files;
      const dt = new DataTransfer();
      const fileBlob = new Blob([JSON.stringify({ url: file.url })], { type: 'application/json' });
      dt.items.add(new File([fileBlob], file.name, { type: 'image/jpeg' }));
      document.getElementById('itemImage').files = dt.files;
      console.log('Selected file:', file.name, file.url);
    }
  }
  function submitSellForm() {
    const itemName = document.getElementById('itemName').value;
    const itemPrice = document.getElementById('itemPrice').value;
    const itemDescription = document.getElementById('itemDescription').value;
    const itemImage = document.getElementById('itemImage').files[0];
    if (itemName && itemPrice && itemDescription && itemImage) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imageData = e.target.result;
        itemsData[selectedCategory].push({
          name: itemName,
          price: `Rs${itemPrice}`,
          description: itemDescription,
          image: imageData,
          seller: getUserName()
        });
        alert(`Item "${itemName}" in ${selectedCategory} submitted!\nPrice: Rs${itemPrice}\nDescription: ${itemDescription}\nImage: Uploaded`);
        hideSellForm();
      };
      reader.readAsDataURL(itemImage);
    } else {
      alert('Please fill all fields and select an image.');
    }
  }
