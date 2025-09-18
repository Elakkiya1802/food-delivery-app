let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(item, price) {
  cart.push({ item, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(item + " added to cart!");
}

function displayCart() {
  let cartItems = document.getElementById("cart-items");
  let totalEl = document.getElementById("total");
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((c, index) => {
    let li = document.createElement("li");
    li.textContent = `${c.item} - $${c.price.toFixed(2)}`;
    cartItems.appendChild(li);
    total += c.price;
  });

  totalEl.textContent = "Total: $" + total.toFixed(2);
}

displayCart();

