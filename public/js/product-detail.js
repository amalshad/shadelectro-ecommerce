 // Global variables
      let currentImageIndex = 0;
      let currentImages = [];
      let relatedProductsSlideIndex = 0;
      let maxAvailableQuantity = <%= product.variants[0].quantity || 10 %>;
      let selectedVariantIndex = 0;
      let variants = <%- JSON.stringify(product.variants) %>;



      // Loading screen
      window.addEventListener('load', function () {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      });

      // Intersection Observer for animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      }, observerOptions);

      // Observe all animated elements
      document.addEventListener('DOMContentLoaded', function () {
        const animatedElements = document.querySelectorAll('[class*="animate-"]');
        animatedElements.forEach(el => observer.observe(el));

        // Initialize current images array
        const thumbnails = document.querySelectorAll('.thumbnail-wrapper img');
        currentImages = Array.from(thumbnails).map(img => img.src);
      });

      // Image zoom functionality
      const imageZoom = document.getElementById('imageZoom');

      imageZoom?.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = imageZoom.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;

        imageZoom.style.setProperty('--zoom-x', `${x}%`);
        imageZoom.style.setProperty('--zoom-y', `${y}%`);
        imageZoom.style.setProperty('--display', 'block');

        // Show zoom indicator
        const zoomIndicator = imageZoom.querySelector('.zoom-indicator');
        if (zoomIndicator) {
          zoomIndicator.style.opacity = '0';
        }
      });

      imageZoom?.addEventListener('mouseleave', () => {
        imageZoom.style.setProperty('--display', 'none');

        // Hide zoom indicator
        const zoomIndicator = imageZoom.querySelector('.zoom-indicator');
        if (zoomIndicator) {
          zoomIndicator.style.opacity = '1';
        }
      });

      // Click to open lightbox
      imageZoom?.addEventListener('click', () => {
        openLightbox(currentImageIndex);
      });


      function updateMainImage(src, index) {
        const mainImage = document.getElementById('mainProductImage');
        const imageZoom = document.getElementById('imageZoom');

        // Add loading effect
        mainImage.style.opacity = '0.5';

        setTimeout(() => {
          mainImage.src = src;
          imageZoom.style.setProperty('--url', `url(${src})`);
          currentImageIndex = index;

          // Update active thumbnail
          document.querySelectorAll('.thumbnail-wrapper').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
          });

          mainImage.style.opacity = '1';
        }, 150);
      }

      function navigateImage(direction) {
        const newIndex = currentImageIndex + direction;
        if (newIndex >= 0 && newIndex < currentImages.length) {
          const newSrc = currentImages[newIndex];
          updateMainImage(newSrc, newIndex);
        }
      }

      // let maxAvailableQuantity = <%= product.variants[0].quantity %>;

      function updateQuantity(change) {
        const quantityInput = document.getElementById('quantity');
        let currentQty = parseInt(quantityInput.value);

        const maxQty = Math.min(variants[selectedVariantIndex].quantity, 10);


        if (change === 1 && currentQty >= maxQty) {
          showToast(`Only ${maxQty} item(s) left in stock`);
          return;
        }

        currentQty += change;

        if (currentQty < 1) currentQty = 1;
        quantityInput.value = currentQty;
      }




      function toggleAccordion(id) {
        const content = document.getElementById(id);
        const iconId = id.replace('-content', '-icon');
        const icon = document.getElementById(iconId);
        const accordionItem = content.closest('.accordion-item');

        if (content.classList.contains('active')) {
          content.classList.remove('active');
          icon.className = 'fas fa-plus accordion-icon';
          accordionItem.classList.remove('active');
        } else {
          content.classList.add('active');
          icon.className = 'fas fa-minus accordion-icon';
          accordionItem.classList.add('active');
        }
      }

      // Related products slider
      function slideRelatedProducts(direction) {
        const grid = document.getElementById('relatedProductsGrid');
        const cardWidth = 280; // Card width + gap
        const maxSlide = Math.max(0, (grid.children.length * cardWidth) - grid.parentElement.offsetWidth);

        relatedProductsSlideIndex += direction * cardWidth;
        relatedProductsSlideIndex = Math.max(0, Math.min(relatedProductsSlideIndex, maxSlide));

        grid.style.transform = `translateX(-${relatedProductsSlideIndex}px)`;
      }

      // Lightbox functionality
      function openLightbox(index) {
        const modal = document.getElementById('lightboxModal');
        const lightboxImage = document.getElementById('lightboxImage');

        lightboxImage.src = currentImages[index];
        currentImageIndex = index;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function closeLightbox() {
        const modal = document.getElementById('lightboxModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }

      function lightboxNavigate(direction) {
        const newIndex = currentImageIndex + direction;
        if (newIndex >= 0 && newIndex < currentImages.length) {
          const lightboxImage = document.getElementById('lightboxImage');
          lightboxImage.style.opacity = '0';

          setTimeout(() => {
            lightboxImage.src = currentImages[newIndex];
            currentImageIndex = newIndex;
            lightboxImage.style.opacity = '1';
          }, 150);
        }
      }



      // Add to wishlist functionality
      async function addToWishlist(productId, button) {
        try {
          const res = await fetch('/addwishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
          });

          const data = await res.json();

          if (data.success) {
            button.classList.add('success');
            const icon = button.querySelector('i');
            icon.className = 'fas fa-check';
            showToast("Added to wishlist!");

            setTimeout(() => {
              button.classList.remove('success');
              icon.className = 'fas fa-heart';
            }, 2000);
          } else {
            showToast(data.message || "Already in wishlist");
          }
        } catch (error) {
          console.error("Error adding to wishlist:", error);
          showToast("Failed to add to wishlist");
        }
      }


      // Back to top functionality
      window.addEventListener('scroll', function () {
        const backToTop = document.getElementById('backToTop');
        if (window.pageYOffset > 300) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      });

      function scrollToTop() {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }

      // Variant change handler
      maxAvailableQuantity = 10;

      document.addEventListener('DOMContentLoaded', function () {
        const variantSelect = document.getElementById('variant');
        // const variants = <%- JSON.stringify(product.variants) %>;

        if (!variantSelect) return;

        variantSelect.addEventListener('change', function () {
          selectedVariantIndex = this.selectedIndex;
          const selected = variants[selectedVariantIndex];
          if (!selected) return;

          // ✅ Update stock status

          const quantity = selected.quantity || 0;
          maxAvailableQuantity = Math.min(quantity, 10);

          // Update Stock Status
          const stockStatus = document.getElementById("stockStatus");
          if (selected.quantity === 0) {
            stockStatus.innerHTML = '<span class="text-red-600 font-semibold">Out of Stock</span>';
            document.getElementById('addToCartBtn').disabled = true;
          } else if (selected.quantity <= 5) {
            stockStatus.innerHTML = `<span class="text-yellow-600 font-semibold">Only ${selected.quantity} left in stock!</span>`;
            document.getElementById('addToCartBtn').disabled = false;
          } else {
            stockStatus.innerHTML = '<span class="text-green-600 font-semibold">In Stock</span>';
            document.getElementById('addToCartBtn').disabled = false;
          }

          const quantityInput = document.getElementById('quantity');
          if (quantityInput) {
            quantityInput.value = 1;
            quantityInput.max = maxAvailableQuantity;
          }



          // maxAvailableQuantity = Math.min(selected.quantity || 1, 10);


          // Update price
          const priceContainer = document.querySelector('.product-price');
          priceContainer.style.opacity = '0.5';

          setTimeout(() => {
            if (selected.salesPrice) {
              priceContainer.innerHTML = `
          <span class="sale-price">₹${selected.salesPrice.toFixed(2)}</span>
          <span class="regular-price">₹${selected.regularPrice.toFixed(2)}</span>
          <span class="discount-badge">
            ${Math.round(((selected.regularPrice - selected.salesPrice) / selected.regularPrice) * 100)}% OFF
          </span>`;
            } else {
              priceContainer.innerHTML = `
          <span class="sale-price">₹${selected.regularPrice.toFixed(2)}</span>`;
            }

            priceContainer.style.opacity = '1';
          }, 200);

          // Update images
          const thumbnails = document.querySelector('.thumbnail-images');
          if (selected.productImage?.length) {
            updateMainImage('/uploads/productImages/' + selected.productImage[0], 0);

            thumbnails.innerHTML = selected.productImage.map((img, i) => `
        <div class="thumbnail-wrapper ${i === 0 ? 'active' : ''}" 
             onclick="updateMainImage('/uploads/productImages/${img}', ${i})">
          <img src="/uploads/productImages/${img}" alt="Thumbnail ${i + 1}" loading="lazy">
          <div class="thumbnail-overlay"></div>
        </div>`).join('');

            currentImages = selected.productImage.map(img => '/uploads/productImages/' + img);
          }
        });
        if (variantSelect) {
  variantSelect.dispatchEvent(new Event('change'));
} else {
  // Initialize for single variant
  selectedVariantIndex = 0;
  const selected = variants[0];
  currentImages = selected.productImage.map(img => '/uploads/productImages/' + img);
}


      });


      // Button ripple effects
      document.querySelectorAll('.btn-primary, .btn-dark').forEach(button => {
        button.addEventListener('click', function (e) {
          const ripple = this.querySelector('.btn-ripple');
          if (ripple) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('active');

            setTimeout(() => {
              ripple.classList.remove('active');
            }, 600);
          }
        });
      });

      // Close lightbox on escape key
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeLightbox();
        }
      });

      // Close lightbox on background click
      document.getElementById('lightboxModal')?.addEventListener('click', function (e) {
        if (e.target === this) {
          closeLightbox();
        }
      });

      // ✅ Move this to the top
      function showToast(message) {
        const toast = document.getElementById('successToast');
        const messageElement = toast.querySelector('.toast-message');

        messageElement.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }

      // ✅ Then define addToCart after
async function addToCart() {
  const quantityInput = document.getElementById("quantity");
  const quantity = parseInt(quantityInput.value);
  const productId = "<%= product._id %>";
  const variant = variants[selectedVariantIndex];
  const price = variant.salesPrice || variant.regularPrice;

  // 🔐 PREVENT adding if current variant is out of stock
  if (variant.quantity === 0) {
    showToast("Out of stock", "error");
    return;
  }

  try {
    const res = await fetch("/addCart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity,
        variantIndex: selectedVariantIndex,
        price
      }),
    });

    const data = await res.json();

    if (data.success) {
      showToast("Added to cart", "success");

      // 🧠 Decrease local quantity
      variant.quantity -= quantity;

      // 🛠 Update UI
      quantityInput.value = 1;
      maxAvailableQuantity = Math.min(variant.quantity, 10);

      // 🟢 Update Stock Message
      const stockStatus = document.getElementById("stockStatus");
      const addBtn = document.getElementById("addToCartBtn");

      if (variant.quantity === 0) {
        stockStatus.innerHTML = '<span class="text-red-600 font-semibold">Out of Stock</span>';
        addBtn.disabled = true;
      } else if (variant.quantity <= 5) {
        stockStatus.innerHTML = `<span class="text-yellow-600 font-semibold">Only ${variant.quantity} left in stock!`;
        addBtn.disabled = false;
      } else {
        stockStatus.innerHTML = '<span class="text-green-600 font-semibold">In Stock</span>';
        addBtn.disabled = false;
      }

    } else {
      showToast(data.message || "Something went wrong", "error");
    }

  } catch (err) {
    console.error("Add to cart error:", err);
    showToast("Failed to add to cart", "error");
  }
}



      document.querySelector('.add-to-cart')?.addEventListener('click', function (e) {
        e.preventDefault();
        addToCart('<%= product._id %>', this);
      });