// Cart functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize cart
  initializeCart()

  // Initialize back to top functionality
  initializeBackToTop()

  // Initialize shipping options
  initializeShippingOptions()
})

function initializeCart() {
  // Add staggered animation delays to cart items
  const cartItems = document.querySelectorAll(".cart-item")
  cartItems.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`
  })

  // Update totals
  updateCartTotals()
}

function initializeBackToTop() {
  const backToTop = document.getElementById("backToTop")

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add("visible")
    } else {
      backToTop.classList.remove("visible")
    }
  })
}

function initializeShippingOptions() {
  const shippingOptions = document.querySelectorAll('input[name="shipping"]')
  shippingOptions.forEach((option) => {
    option.addEventListener("change", updateShippingCost)
  })
}

function updateQuantity(button, change) {
  const quantitySpan = button.parentElement.querySelector("span")
  const quantity = Number.parseInt(quantitySpan.textContent)

  // Add loading state
  button.classList.add("loading")

  setTimeout(() => {
    const newQuantity = Math.max(1, quantity + change)
    quantitySpan.textContent = newQuantity

    // Remove loading state
    button.classList.remove("loading")

    // Add success animation
    quantitySpan.classList.add("quantity-success")
    setTimeout(() => {
      quantitySpan.classList.remove("quantity-success")
    }, 600)

    // Update totals
    updateCartTotals()

    // Show notification
    showToast("Quantity updated successfully")
  }, 300)
}

function removeItem(button) {
  const cartItem = button.closest(".cart-item")

  if (confirm("Are you sure you want to remove this item from your cart?")) {
    // Add exit animation
    cartItem.style.opacity = "0"
    cartItem.style.transform = "translateX(-100px)"

    setTimeout(() => {
      cartItem.remove()
      updateCartTotals()
      updateCartCount()
      showToast("Item removed from cart")
    }, 300)
  }
}

function saveForLater(button) {
  const cartItem = button.closest(".cart-item")
  const productName = cartItem.querySelector("h3").textContent

  // Add success animation
  button.classList.add("text-green-500")
  button.innerHTML = '<i class="fas fa-check mr-1"></i>Saved!'

  setTimeout(() => {
    button.classList.remove("text-green-500")
    button.innerHTML = '<i class="fas fa-bookmark mr-1"></i>Save for Later'
  }, 2000)

  showToast(`${productName} saved for later`)
}

function proceedToCheckout() {
  const button = event.target

  // Add loading state
  button.classList.add("loading")
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...'

  // Simulate checkout process
  setTimeout(() => {
    window.location.href = "/checkout"
  }, 2000)
}

function applyPromoCode() {
  const promoInput = document.getElementById("promoCode")
  const promoCode = promoInput.value.trim().toUpperCase()

  // Valid promo codes for demo
  const validCodes = {
    SAVE10: { discount: 0.1, description: "10% off" },
    WELCOME20: { discount: 0.2, description: "20% off" },
    STUDENT15: { discount: 0.15, description: "15% off" },
    FREESHIP: { discount: 0, description: "Free shipping" },
  }

  if (validCodes[promoCode]) {
    const code = validCodes[promoCode]
    showToast(`Promo code applied! ${code.description}`)

    promoInput.value = ""
    promoInput.style.borderColor = "#10b981"
    promoInput.style.backgroundColor = "#f0fdf4"

    // Reset input style after 3 seconds
    setTimeout(() => {
      promoInput.style.borderColor = ""
      promoInput.style.backgroundColor = ""
    }, 3000)

    updateCartTotals()
  } else if (promoCode) {
    showToast("Invalid promo code", "error")
    promoInput.classList.add("error-shake")
    promoInput.style.borderColor = "#ef4444"
    promoInput.style.backgroundColor = "#fef2f2"

    setTimeout(() => {
      promoInput.classList.remove("error-shake")
      promoInput.style.borderColor = ""
      promoInput.style.backgroundColor = ""
    }, 1000)
  }
}

function updateShippingCost() {
  const selectedShipping = document.querySelector('input[name="shipping"]:checked')
  const shippingCosts = {
    standard: 0,
    express: 19.99,
    overnight: 39.99,
  }

  const cost = shippingCosts[selectedShipping.value]

  // Update shipping cost display (you would implement this based on your HTML structure)
  updateCartTotals()
  showToast("Shipping option updated")
}

function updateCartTotals() {
  // This would typically calculate based on actual cart data
  // For demo purposes, we'll use static values
  const subtotal = 4047.0
  const shipping = getShippingCost()
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  // Update displays (you would implement this based on your specific HTML structure)
  console.log(`Updated totals: Subtotal: $${subtotal}, Shipping: $${shipping}, Tax: $${tax}, Total: $${total}`)
}

function getShippingCost() {
  const selectedShipping = document.querySelector('input[name="shipping"]:checked')
  const shippingCosts = {
    standard: 0,
    express: 19.99,
    overnight: 39.99,
  }

  return selectedShipping ? shippingCosts[selectedShipping.value] : 0
}

function updateCartCount() {
  const cartItems = document.querySelectorAll(".cart-item").length
  const cartBadge = document.querySelector(".bg-primary.text-white")

  if (cartBadge) {
    cartBadge.textContent = `${cartItems} items`
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("successToast")
  const messageElement = toast.querySelector(".toast-message")
  const icon = toast.querySelector("i")

  messageElement.textContent = message

  // Update icon and color based on type
  if (type === "error") {
    icon.className = "fas fa-exclamation-circle text-red-500 text-xl"
  } else {
    icon.className = "fas fa-check-circle text-green-500 text-xl"
  }

  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

// Additional utility functions
function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Export functions for global use
window.updateQuantity = updateQuantity
window.removeItem = removeItem
window.saveForLater = saveForLater
window.proceedToCheckout = proceedToCheckout
window.applyPromoCode = applyPromoCode
window.scrollToTop = scrollToTop
