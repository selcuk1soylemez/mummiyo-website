/* =========================================================
   İyzico Sanal POS — Sandbox yapılandırması
   =========================================================
   ÖNEMLİ GÜVENLİK NOTU:
   - `secretKey` ASLA tarayıcıya (frontend'e) gönderilmemelidir.
   - Gerçek akışta `paymentPageToken`, kendi sunucunuzda
     (Node.js/Next.js API route) İyzico'ya yapılan
     `/payment/iyzipos/checkoutform/initialize/auth/ecom`
     çağrısı sonucunda üretilir ve istemciye döner.
   - Bu dosya yalnızca TEST/SANDBOX geliştirme içindir.
   ========================================================= */

window.IYZICO_CONFIG = {
  // Sandbox API uç noktası
  baseUrl: 'https://sandbox-api.iyzipay.com',

  // Sandbox API anahtarları (örnek değerler — kendi test hesabınızla değiştirin)
  apiKey: 'sandbox-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  secretKey: 'sandbox-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',

  // Ödeme sonrası dönüş adresi
  callbackUrl: 'https://www.mummiyo.com/siparislerim.html?success=1',

  // Checkout form ayarları
  locale: 'tr',
  currency: 'TRY',

  // Sunucudan dönen token (demo ortamda boş bırakılır;
  // doluysa main.js içindeki iyzicoCheckoutForm.init çalıştırılır)
  paymentPageToken: '',

  // İyzico Checkout Form istemci betiği (production: https://checkout.iyzipay.com/v1/checkout-form.js)
  checkoutFormScript: 'https://checkout.iyzipay.com/v1/checkout-form.js'
};
