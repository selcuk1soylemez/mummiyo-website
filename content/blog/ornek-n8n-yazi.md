---
title: "n8n ile Mummiyo Sipariş Otomasyonu"
date: 2026-10-15T12:00:00+03:00
description: "n8n kullanarak Mummiyo sipariş bildirimlerini, müşteri e-postalarını ve kargo takip entegrasyonunu nasıl otomatikleştirebileceğinizi adım adım öğrenin."
image: "/assets/images/ornek-n8n-kapak.jpg"
---

# n8n ile Mummiyo Sipariş Otomasyonu

n8n, kodsuz veya az kodla çalışan açık kaynaklı bir iş akışı otomasyon aracıdır. Mummiyo gibi tek ürün odaklı bir e-ticaret yapısında; sipariş bildirimleri, müşteri e-postaları ve kargo takip entegrasyonu gibi tekrarlayan işlemleri otomatikleştirmek için idealdir.

## Bu Yazıda Neler Var?

- n8n nedir ve neden kullanılır?
- Mummiyo sipariş akışının otomasyona uyarlanması
- Örnek bir n8n workflow şablonu
- İyzico webhook'u ile sipariş tetikleme

## Adım 1: Tetikleyiciyi Tanımlayın

İlk düğüm olarak **Webhook** kullanın. İyzico ödeme callback'i başarılı olduğunda bu webhook'a `POST` isteği gönderir. Böylece ödeme onaylanır onaylanmaz otomasyon başlar.

## Adım 2: Sipariş Verisini İşleyin

Webhook'tan gelen JSON içindeki `orderId`, `customerEmail` ve `totalPrice` alanlarını bir **Set** veya **Function** düğümü ile ayrıştırın. Bu veriler sonraki adımlara temiz biçimde aktarılır.

## Adım 3: E-posta Gönderin

Ayrıştırılan veriyi **Gmail** veya **SMTP** düğümüne bağlayarak müşteriye otomatik "Siparişiniz Alındı" e-postası gönderin. E-posta şablonunda müşteri adı ve sipariş numarası dinamik alanlarla doldurulabilir.

## Adım 4: Kargo Takibine Bağlayın

Kargo sağlayıcınızın API'sini bir **HTTP Request** düğümüyle çağırarak kargo takip numarası oluşturun ve bu bilgiyi sipariş kaydına geri yazın. Böylece `siparislerim.html` sayfasındaki "Kargoda" durumu gerçek veriyle beslenebilir.

## Örnek Workflow JSON

```json
{
  "nodes": [
    { "name": "İyzico Webhook", "type": "n8n-nodes-base.webhook" },
    { "name": "Sipariş Ayrıştır", "type": "n8n-nodes-base.function" },
    { "name": "E-posta Gönder", "type": "n8n-nodes-base.emailSend" }
  ]
}
```

## Sonuç

Bu basit dört adımlı yapı, Mummiyo sipariş sürecindeki manuel iş yükünü azaltır ve müşteri deneyimini iyileştirir. n8n'in açık kaynaklı doğası sayesinde akışı kendi sunucunuzda ücretsiz barındırabilirsiniz.
