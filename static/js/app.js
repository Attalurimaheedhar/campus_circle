function showHome() {
  document.getElementById("home").scrollIntoView({ behavior: "smooth" });
}

function showBuy() {
  document.getElementById("buy").scrollIntoView({ behavior: "smooth" });
}

function showSell() {
  document.getElementById("sell").scrollIntoView({ behavior: "smooth" });
}

function showPayments() {
  document.getElementById("payments").scrollIntoView({ behavior: "smooth" });
}

function logout() {
  window.location.href = "/logout";
}
