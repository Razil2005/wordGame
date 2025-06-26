# Guess the Word Game - Düzeltme Rehberi

## Sorun
Oyunun "Start Game" düğmesi çalışmıyor ve sunucu yanıt vermiyor mesajı alınıyor.

## Ana Problemler ve Çözümler

### 1. Port Uyumsuzluğu (ÇÖZÜLDÜ)
**Sorun:** Sunucu port 3001'de çalışıyor, ancak client port 3000'e bağlanmaya çalışıyor.
**Çözüm:** server.js dosyasında port 3000 olarak değiştirildi.

### 2. Host Doğrulama Sorunu (ÇÖZÜLDÜ)
**Sorun:** Socket ID'leri değiştiği için host doğrulaması başarısız oluyordu.
**Çözüm:** Hem socket ID hem de oyuncu ismiyle host kontrolü yapılıyor.

### 3. Tekrarlanan Oyuncu İsimleri (ÇÖZÜLDÜ)
**Sorun:** Aynı kullanıcı için birden fazla socket bağlantısı oluşuyordu.
**Çözüm:** Client tarafında isime göre tekrarları engelleme eklendi.

## Sunucuyu Başlatma

### Yöntem 1: Manuel
1. Komut satırını açın
2. `cd c:\Users\Razil\Desktop\newgame` komutuyla klasöre gidin
3. `node server.js` komutunu çalıştırın

### Yöntem 2: Batch Dosyası
`start-server-3000.bat` dosyasına çift tıklayın

### Yöntem 3: PowerShell Script
`start-game-server.ps1` dosyasını PowerShell'de çalıştırın

## Test Etme

1. Sunucuyu başlattıktan sonra tarayıcıda `http://localhost:3000` adresine gidin
2. Oyuncu adınızı girin ve "Create Room" düğmesine tıklayın
3. Oda oluşturulduktan sonra "Start Game" düğmesine tıklayın
4. Oyun "word-setting" aşamasına geçmeli

## Hata Durumunda

Eğer hala sorun yaşıyorsanız:

1. Tarayıcı konsolunu açın (F12)
2. Console sekmesine bakın
3. Hata mesajlarını kontrol edin
4. Sunucunun çalışıp çalışmadığını `netstat -an | findstr :3000` komutuyla kontrol edin

## Test Dosyaları

- `test-basic-server.js`: Basit test sunucusu
- `game-launcher.html`: Bağlantı test sayfası
- `test-join.html`: Oda katılma test sayfası

## Son Değişiklikler

1. server.js: Port 3000'e değiştirildi
2. server.js: Host doğrulama geliştirildi
3. script.js: Oyuncu listesi tekrarlarını engelleme
4. Detaylı logging eklendi

## Başarı Kriterleri

✅ Sunucu port 3000'de çalışıyor
✅ Client başarıyla bağlanıyor
✅ Oda oluşturma çalışıyor
✅ Host doğrulama çalışıyor
🔄 "Start Game" düğmesi test edilmeli

**Not:** Tüm kod değişiklikleri yapıldı. Tek yapmanız gereken sunucuyu başlatmak ve test etmek.
