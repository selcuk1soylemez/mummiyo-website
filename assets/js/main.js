/* =========================================================
   Mummiyo — micro-interactions, cart & checkout flows
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Ürün & kargo sabitleri ---------- */
  var PRODUCT = {
    id: 'MUM-100',
    name: 'Mummiyo Doğal Mumiyo Takviyesi',
    price: 599,
    compareAt: 749,
    unit: 'Kavanoz · 50 g'
  };

  var FREE_SHIPPING_THRESHOLD = 750;
  var SHIPPING_FEE = 49.99;
  var CART_KEY = 'mummiyo_cart';
  var ORDERS_KEY = 'mummiyo_orders';

  /* =========================================================
     1) CART — veri katmanı
     ========================================================= */
  function getCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) { return sum + (item.qty || 0); }, 0);
  }

  function cartSubtotal() {
    return getCart().reduce(function (sum, item) {
      return sum + PRODUCT.price * (item.qty || 0);
    }, 0);
  }

  function addToCart(qty, openDrawer) {
    qty = qty || 1;
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === PRODUCT.id; });
    if (item) {
      item.qty += qty;
    } else {
      cart.push({ id: PRODUCT.id, qty: qty });
    }
    saveCart(cart);
    renderCart();
    if (openDrawer !== false) {
      openCart();
    }
    toast('Ürün sepete eklendi');
  }

  function setQty(id, qty) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item) return;
    if (qty <= 0) {
      cart = cart.filter(function (i) { return i.id !== id; });
    } else {
      item.qty = qty;
    }
    saveCart(cart);
    renderCart();
    updateCartBadge();
  }

  function removeItem(id) {
    saveCart(getCart().filter(function (i) { return i.id !== id; }));
    renderCart();
    updateCartBadge();
  }

  /* =========================================================
     2) CART DRAWER — sağdan açılan sepet çekmecesi
     ========================================================= */
  function buildCartUI() {
    var overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var drawer = document.createElement('aside');
    drawer.className = 'cart-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-label', 'Sepet');
    drawer.innerHTML =
      '<div class="cart-head">' +
        '<h2>Sepetiniz</h2>' +
        '<button class="cart-close" type="button" aria-label="Sepeti kapat">&times;</button>' +
      '</div>' +
      '<div class="cart-progress">' +
        '<p class="cart-progress-text"></p>' +
        '<div class="cart-progress-bar"><span class="cart-progress-fill"></span></div>' +
      '</div>' +
      '<div class="cart-items"></div>' +
      '<div class="cart-foot">' +
        '<div class="cart-totals">' +
          '<div class="cart-row"><span>Ara Toplam</span><span class="cart-subtotal"></span></div>' +
          '<div class="cart-row"><span>Kargo</span><span class="cart-shipping"></span></div>' +
          '<div class="cart-row cart-row--grand"><span>Toplam</span><span class="cart-grand"></span></div>' +
        '</div>' +
        '<button class="btn btn--dark cart-checkout" type="button" data-cart-checkout>Ödemeye Geç</button>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    return { overlay: overlay, drawer: drawer };
  }

  function injectCartButton() {
    var nav = document.querySelector('.nav');
    if (!nav || document.querySelector('.cart-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'cart-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Sepeti aç');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="9" cy="21" r="1.6"></circle><circle cx="19" cy="21" r="1.6"></circle>' +
        '<path d="M2 3h3l2.6 12.5a2 2 0 0 0 2 1.5h8.8a2 2 0 0 0 2-1.6L22 7H6"></path>' +
      '</svg>' +
      '<span class="cart-badge">0</span>';
    btn.addEventListener('click', openCart);

    var toggle = nav.querySelector('.nav-toggle');
    if (toggle) {
      nav.insertBefore(btn, toggle);
    } else {
      nav.appendChild(btn);
    }
  }

  function openCart() {
    var overlay = document.querySelector('.cart-overlay');
    var drawer = document.querySelector('.cart-drawer');
    if (overlay && drawer) {
      document.body.classList.add('cart-open');
      overlay.setAttribute('aria-hidden', 'false');
      drawer.setAttribute('aria-hidden', 'false');
    }
  }

  function closeCart() {
    var overlay = document.querySelector('.cart-overlay');
    var drawer = document.querySelector('.cart-drawer');
    if (overlay && drawer) {
      document.body.classList.remove('cart-open');
      overlay.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  function formatTRY(value) {
    return '₺' + value.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function renderCart() {
    var cart = getCart();
    var subtotal = cartSubtotal();
    var shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
    var grand = subtotal + shipping;
    var remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    var progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    var itemsEl = document.querySelector('.cart-items');
    var progressText = document.querySelector('.cart-progress-text');
    var progressFill = document.querySelector('.cart-progress-fill');
    var subEl = document.querySelector('.cart-subtotal');
    var shipEl = document.querySelector('.cart-shipping');
    var grandEl = document.querySelector('.cart-grand');
    if (!itemsEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = '<p class="cart-empty">Sepetiniz şu an boş.<br>Doğal Mummiyo ile tanışın.</p>';
    } else {
      itemsEl.innerHTML = cart.map(function (item) {
        var lineTotal = PRODUCT.price * item.qty;
        return (
          '<div class="cart-item" data-id="' + item.id + '">' +
            '<div class="cart-item-thumb" aria-hidden="true">M</div>' +
            '<div class="cart-item-info">' +
              '<strong>' + PRODUCT.name + '</strong>' +
              '<span>' + PRODUCT.unit + '</span>' +
              '<div class="cart-qty">' +
                '<button type="button" data-qty-minus aria-label="Azalt">&minus;</button>' +
                '<input type="number" min="1" value="' + item.qty + '" data-qty-input aria-label="Adet">' +
                '<button type="button" data-qty-plus aria-label="Artır">+</button>' +
              '</div>' +
            '</div>' +
            '<div class="cart-item-side">' +
              '<span class="cart-item-price">' + formatTRY(lineTotal) + '</span>' +
              '<button class="cart-item-remove" type="button" data-remove aria-label="Kaldır">Sil</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    if (progressText) {
      progressText.textContent = subtotal === 0
        ? 'Ücretsiz kargo için ' + formatTRY(FREE_SHIPPING_THRESHOLD) + ' tutarında ürün ekleyin.'
        : (remaining > 0
            ? 'Ücretsiz kargoya ' + formatTRY(remaining) + ' kaldı.'
            : '🎉 Ücretsiz kargoyu kazandınız!');
    }
    if (progressFill) progressFill.style.width = progress + '%';
    if (subEl) subEl.textContent = formatTRY(subtotal);
    if (shipEl) shipEl.textContent = shipping === 0 ? 'Ücretsiz' : formatTRY(shipping);
    if (grandEl) grandEl.textContent = formatTRY(grand);

    var checkoutBtn = document.querySelector('[data-cart-checkout]');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    updateCartBadge();
  }

  function updateCartBadge() {
    var badge = document.querySelector('.cart-badge');
    if (!badge) return;
    var count = cartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'grid' : 'none';
  }

  function bindCartEvents() {
    var overlay = document.querySelector('.cart-overlay');
    var closeBtn = document.querySelector('.cart-close');
    if (overlay) overlay.addEventListener('click', closeCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCart();
    });

    document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () { addToCart(1); });
    });

    document.querySelectorAll('[data-buy-now]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (cartCount() === 0) {
          addToCart(1, false);
        }
        // Sepete eklendikten sonra doğrudan ödemeye yönlendir
        setTimeout(function () { window.location.href = 'checkout.html'; }, 350);
      });
    });

    document.querySelectorAll('[data-cart-checkout]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeCart();
        window.location.href = 'checkout.html';
      });
    });

    // Adet ve silme (event delegation)
    document.querySelector('.cart-drawer').addEventListener('click', function (e) {
      var itemEl = e.target.closest('.cart-item');
      if (!itemEl) return;
      var id = itemEl.getAttribute('data-id');
      if (e.target.closest('[data-qty-minus]')) {
        var input = itemEl.querySelector('[data-qty-input]');
        setQty(id, (parseInt(input.value, 10) || 1) - 1);
      } else if (e.target.closest('[data-qty-plus]')) {
        var inputPlus = itemEl.querySelector('[data-qty-input]');
        setQty(id, (parseInt(inputPlus.value, 10) || 1) + 1);
      } else if (e.target.closest('[data-remove]')) {
        removeItem(id);
      }
    });

    document.querySelector('.cart-drawer').addEventListener('change', function (e) {
      if (e.target.matches('[data-qty-input]')) {
        var itemEl = e.target.closest('.cart-item');
        var id = itemEl.getAttribute('data-id');
        var qty = Math.max(1, parseInt(e.target.value, 10) || 1);
        setQty(id, qty);
      }
    });
  }

  /* =========================================================
     3) TOAST — bildirim
     ========================================================= */
  function toast(message) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { el.remove(); }, 300);
    }, 2400);
  }

  /* =========================================================
     4) CHECKOUT — İyzico akışı (demo/sandbox)
     ========================================================= */
  function initCheckout() {
    var form = document.getElementById('checkout-form');
    if (!form) return;

    // Sipariş özetini sepete göre doldur
    renderCheckoutSummary();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var order = readCheckoutForm(form);
      if (!order) return;

      var subtotal = cartSubtotal();
      var shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      order.subtotal = subtotal;
      order.shipping = shipping;
      order.total = subtotal + shipping;
      order.items = getCart();

      // Adım geçişi: adres → ödeme
      document.getElementById('step-address').classList.add('is-hidden');
      document.getElementById('step-payment').classList.remove('is-hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Ödeme alanını başlat
      initIyzicoPayment(order);
    });
  }

  function renderCheckoutSummary() {
    var box = document.querySelector('[data-checkout-summary]');
    if (!box) return;
    var subtotal = cartSubtotal();
    var shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    var total = subtotal + shipping;
    var qty = cartCount();

    box.innerHTML =
      '<div class="checkout-summary-product">' +
        '<div class="checkout-summary-thumb" aria-hidden="true">M</div>' +
        '<div><strong>' + PRODUCT.name + '</strong><span>' + qty + ' adet</span></div>' +
        '<em>' + formatTRY(subtotal) + '</em>' +
      '</div>' +
      '<div class="cart-row"><span>Kargo</span><span>' + (shipping === 0 ? 'Ücretsiz' : formatTRY(shipping)) + '</span></div>' +
      '<div class="cart-row cart-row--grand"><span>Toplam</span><span>' + formatTRY(total) + '</span></div>';
  }

  function readCheckoutForm(form) {
    var get = function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    };
    var ad = get('ad');
    var soyad = get('soyad');
    var email = get('email');
    var phone = get('phone');
    var address = get('address');
    var city = get('city');

    if (!ad || !soyad || !email || !phone || !address || !city) {
      toast('Lütfen tüm zorunlu alanları doldurun.');
      return null;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast('Geçerli bir e-posta adresi girin.');
      return null;
    }

    return {
      id: 'MUM-' + Math.floor(1000 + Math.random() * 9000),
      ad: ad,
      soyad: soyad,
      email: email,
      phone: phone,
      address: address + ', ' + city,
      createdAt: new Date().toISOString(),
      status: 'Hazırlanıyor'
    };
  }

  function initIyzicoPayment(order) {
    var container = document.getElementById('iyzico-checkout-form');
    if (!container) return;

    var cfg = (window.IYZICO_CONFIG || {});

    // Üretimde: sunucunuzdan paymentPageToken alınır ve aşağıdaki gibi başlatılır.
    // Sandbox/demo: token üretilemediği için demo ödeme paneli gösterilir.
    if (cfg.paymentPageToken && window.iyzicoCheckoutForm) {
      try {
        window.iyzicoCheckoutForm.init('iyzico-checkout-form', {
          locale: cfg.locale || 'tr',
          token: cfg.paymentPageToken
        });
        return;
      } catch (err) {
        console.warn('İyzico formu başlatılamadı, demo panele geçiliyor.', err);
      }
    }

    // Demo ödeme paneli (test kartı: 5528 7900 0000 0008)
    container.innerHTML =
      '<div class="demo-pay">' +
        '<p class="demo-pay-note">Sandbox modu — gerçek ödeme alınmaz. İyzico Checkout Form, sunucudan alınan <code>paymentPageToken</code> ile bu alana yüklenir.</p>' +
        '<div class="field"><label>Kart Numarası</label><input value="5528 7900 0000 0008" readonly></div>' +
        '<div class="form-row">' +
          '<div class="field"><label>Son Kullanma</label><input value="12/2030" readonly></div>' +
          '<div class="field"><label>CVV</label><input value="123" readonly></div>' +
        '</div>' +
        '<button class="btn btn--gold demo-pay-btn" type="button">Ödemeyi Tamamla (Demo)</button>' +
      '</div>';

    var payBtn = container.querySelector('.demo-pay-btn');
    payBtn.addEventListener('click', function () {
      completeOrder(order);
    });
  }

  function completeOrder(order) {
    var orders = getOrders();
    order.status = 'Kargoda';
    order.trackingNo = 'YZ' + Math.floor(100000000 + Math.random() * 899999999);
    order.eta = '3-5 iş günü';
    orders.unshift(order);
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (e) { /* ignore */ }

    // Sepeti temizle
    saveCart([]);

    toast('Ödemeniz alındı!');
    setTimeout(function () {
      window.location.href = 'siparislerim.html?success=' + encodeURIComponent(order.id);
    }, 900);
  }

  function getOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_KEY);
      var orders = raw ? JSON.parse(raw) : [];
      return Array.isArray(orders) ? orders : [];
    } catch (e) {
      return [];
    }
  }

  /* =========================================================
     5) SİPARİŞLERİM — takip paneli
     ========================================================= */
  function initOrdersPage() {
    var list = document.querySelector('[data-orders-list]');
    if (!list) return;

    var saved = getOrders();
    var html = saved.map(orderCard).join('');

    // Varsayılan örnek siparişler (gerçekçi demo)
    html += orderCard({
      id: 'MUM-8492',
      createdAt: '2026-10-08T10:24:00+03:00',
      status: 'Kargoda',
      trackingNo: 'YZ749218304',
      eta: '17 Ekim 2026',
      total: 599,
      items: [{ id: 'MUM-100', qty: 1 }]
    });
    html += orderCard({
      id: 'MUM-7210',
      createdAt: '2026-09-22T14:02:00+03:00',
      status: 'Teslim Edildi',
      trackingNo: 'YZ638291104',
      deliveredAt: '25 Eylül 2026',
      total: 599,
      items: [{ id: 'MUM-100', qty: 1 }]
    });

    list.innerHTML = html;

    list.querySelectorAll('[data-reorder]').forEach(function (btn) {
      btn.addEventListener('click', function () { addToCart(1); });
    });

    // Başarı mesajı
    var params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      toast('Siparişiniz başarıyla oluşturuldu');
    }
  }

  function orderCard(order) {
    var statusMap = {
      'Hazırlanıyor': { step: 1, label: 'Hazırlanıyor' },
      'Kargoda': { step: 2, label: 'Kargoda' },
      'Teslim Edildi': { step: 3, label: 'Teslim Edildi' }
    };
    var st = statusMap[order.status] || statusMap['Hazırlanıyor'];
    var date = new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    var isDelivered = order.status === 'Teslim Edildi';
    var isShipped = order.status === 'Kargoda';

    var timeline =
      '<ol class="order-timeline" data-step="' + st.step + '">' +
        '<li class="done"><span></span>Hazırlanıyor</li>' +
        '<li class="' + (st.step >= 2 ? 'done' : '') + '"><span></span>Kargoda</li>' +
        '<li class="' + (st.step >= 3 ? 'done' : '') + '"><span></span>Teslim Edildi</li>' +
      '</ol>';

    var extraInfo = '';
    if (isShipped) {
      extraInfo =
        '<div class="order-ship">' +
          '<div class="order-ship-row"><span>Kargo Takip No</span><strong>' + order.trackingNo + '</strong></div>' +
          '<div class="order-ship-row"><span>Tahmini Teslimat</span><strong>' + order.eta + '</strong></div>' +
          '<div class="order-map" aria-hidden="true">' +
            '<span class="dot dot--from"></span><span class="line"></span><span class="dot dot--to"></span>' +
          '</div>' +
        '</div>';
    }
    if (isDelivered) {
      extraInfo =
        '<div class="order-ship">' +
          '<div class="order-ship-row"><span>Teslimat Tarihi</span><strong>' + order.deliveredAt + '</strong></div>' +
          '<div class="order-ship-row"><span>Durum</span><strong class="text-ok">✓ Teslim Edildi</strong></div>' +
        '</div>';
    }

    return (
      '<article class="order-card">' +
        '<header class="order-card-head">' +
          '<div><span class="order-status status--' + order.status.replace(/\s+/g, '-').toLowerCase() + '">' + order.status + '</span>' +
          '<h3>Sipariş #' + order.id + '</h3></div>' +
          '<time>' + date + '</time>' +
        '</header>' +
        timeline +
        '<div class="order-card-body">' +
          '<div class="order-line">' +
            '<span class="order-line-thumb" aria-hidden="true">M</span>' +
            '<span>' + PRODUCT.name + ' × 1</span>' +
            '<em>' + formatTRY(order.total || PRODUCT.price) + '</em>' +
          '</div>' +
          extraInfo +
        '</div>' +
        '<footer class="order-card-foot">' +
          '<a class="btn btn--outline btn--sm" href="iletisim.html">Destek Al</a>' +
          (isDelivered
            ? '<button class="btn btn--dark btn--sm" type="button" data-reorder>Tekrar Sipariş Et</button>'
            : '<a class="btn btn--dark btn--sm" href="checkout.html">Siparişi Tamamla</a>') +
        '</footer>' +
      '</article>'
    );
  }

  /* =========================================================
     6) Genel başlatma
     ========================================================= */
  function init() {
    buildCartUI();
    injectCartButton();
    bindCartEvents();
    renderCart();

    // Sayfa bazlı
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('checkout') > -1) {
      initCheckout();
    } else if (path.indexOf('siparislerim') > -1) {
      initOrdersPage();
    }

    /* Mobile nav toggle */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
      });
    }

    /* Nav shadow on scroll */
    var header = document.querySelector('.site-header');
    var onScroll = function () {
      if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Scroll reveal */
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* FAQ accordion */
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var q = item.querySelector('.faq-question');
      if (!q) return;
      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
          openItem.classList.remove('open');
          var a = openItem.querySelector('.faq-answer');
          if (a) a.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          var answer = item.querySelector('.faq-answer');
          if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });

    /* Smooth anchor scrolling */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });

    /* Demo form feedback */
    document.querySelectorAll('form[data-demo]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var note = form.querySelector('.form-note');
        if (note) {
          note.textContent = '✓ Talebiniz alındı. (Demo form — gerçek gönderim bağlı değildir.)';
          note.style.color = '#3c4433';
        }
        form.reset();
      });
    });

    /* Footer year */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
