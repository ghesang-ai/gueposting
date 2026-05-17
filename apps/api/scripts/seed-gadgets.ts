import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres.rhttgcrezicnkavwwfcy:Ghesang310785@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' } },
});

const supabase = createClient(
  'https://rhttgcrezicnkavwwfcy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodHRnY3Jlemljbmthdnd3ZmN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMyODQxNywiZXhwIjoyMDkzOTA0NDE3fQ.1kPNhiTg0uzNL-fETtNG9fgC782WHoDQWM2bTMqzA08'
);

const GADGETS = [
  // ── APPLE ──────────────────────────────────────────────────────────
  { name: 'iPhone 17 Pro Max', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro-max.jpg', specs: { display: '6.9" OLED', processor: 'Apple A19 Pro', ram: '8GB', storage: '256GB/512GB/1TB', camera: '48MP', battery: '4685mAh' } },
  { name: 'iPhone 17 Pro', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17-pro.jpg', specs: { display: '6.3" OLED', processor: 'Apple A19 Pro', ram: '8GB', storage: '128GB/256GB/512GB/1TB', camera: '48MP', battery: '4000mAh' } },
  { name: 'iPhone 17', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-17.jpg', specs: { display: '6.1" OLED', processor: 'Apple A19', ram: '8GB', storage: '128GB/256GB/512GB', camera: '48MP', battery: '3500mAh' } },
  { name: 'iPhone Air', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-air.jpg', specs: { display: '6.6" OLED', processor: 'Apple A18', ram: '8GB', storage: '128GB/256GB', camera: '48MP', battery: '3700mAh' } },
  { name: 'iPhone 16 Pro Max', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg', specs: { display: '6.9" OLED', processor: 'Apple A18 Pro', ram: '8GB', storage: '256GB/512GB/1TB', camera: '48MP', battery: '4685mAh' } },
  { name: 'iPhone 16 Pro', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg', specs: { display: '6.3" OLED', processor: 'Apple A18 Pro', ram: '8GB', storage: '128GB/256GB/512GB/1TB', camera: '48MP', battery: '3582mAh' } },
  { name: 'iPhone 16 Plus', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg', specs: { display: '6.7" OLED', processor: 'Apple A18', ram: '8GB', storage: '128GB/256GB/512GB', camera: '48MP', battery: '4674mAh' } },
  { name: 'iPhone 16', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg', specs: { display: '6.1" OLED', processor: 'Apple A18', ram: '8GB', storage: '128GB/256GB/512GB', camera: '48MP', battery: '3561mAh' } },
  { name: 'iPhone 16e', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg', specs: { display: '6.1" OLED', processor: 'Apple A16 Bionic', ram: '8GB', storage: '128GB/256GB/512GB', camera: '48MP', battery: '3279mAh' } },
  { name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg', specs: { display: '6.7" OLED', processor: 'Apple A17 Pro', ram: '8GB', storage: '256GB/512GB/1TB', camera: '48MP', battery: '4422mAh' } },
  { name: 'iPhone 15 Pro', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg', specs: { display: '6.1" OLED', processor: 'Apple A17 Pro', ram: '8GB', storage: '128GB/256GB/512GB/1TB', camera: '48MP', battery: '3274mAh' } },
  { name: 'iPhone 15', brand: 'Apple', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg', specs: { display: '6.1" OLED', processor: 'Apple A16 Bionic', ram: '6GB', storage: '128GB/256GB/512GB', camera: '48MP', battery: '3349mAh' } },

  // ── SAMSUNG ────────────────────────────────────────────────────────
  { name: 'Galaxy S26 Ultra', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26-ultra-new.jpg', specs: { display: '6.9" Dynamic AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '256GB/512GB/1TB', camera: '200MP', battery: '5000mAh' } },
  { name: 'Galaxy S26+', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26-plus.jpg', specs: { display: '6.7" Dynamic AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '4900mAh' } },
  { name: 'Galaxy S26', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26.jpg', specs: { display: '6.2" Dynamic AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '128GB/256GB', camera: '50MP', battery: '4000mAh' } },
  { name: 'Galaxy S25 Edge', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-edge.jpg', specs: { display: '6.7" Dynamic AMOLED', processor: 'Snapdragon 8 Elite', ram: '12GB', storage: '256GB/512GB', camera: '200MP', battery: '3900mAh' } },
  { name: 'Galaxy S25 FE', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-fe.jpg', specs: { display: '6.7" Dynamic AMOLED', processor: 'Exynos 2500', ram: '8GB', storage: '128GB/256GB', camera: '50MP', battery: '4900mAh' } },
  { name: 'Galaxy Z Fold7', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold7.jpg', specs: { display: '7.9" Foldable AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '256GB/512GB/1TB', camera: '200MP', battery: '4400mAh' } },
  { name: 'Galaxy Z Flip7', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip7.jpg', specs: { display: '6.7" Foldable AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '4000mAh' } },
  { name: 'Galaxy A57', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a57.jpg', specs: { display: '6.7" Super AMOLED', processor: 'Exynos 1480', ram: '8GB', storage: '128GB/256GB', camera: '64MP', battery: '5000mAh' } },
  { name: 'Galaxy A37', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a37.jpg', specs: { display: '6.5" Super AMOLED', processor: 'Exynos 1280', ram: '6GB', storage: '128GB', camera: '50MP', battery: '5000mAh' } },
  { name: 'Galaxy M36', brand: 'Samsung', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m36.jpg', specs: { display: '6.7" Super AMOLED', processor: 'Exynos 1380', ram: '6GB', storage: '128GB', camera: '50MP', battery: '6000mAh' } },

  // ── XIAOMI ─────────────────────────────────────────────────────────
  { name: 'Xiaomi 17 Ultra', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-17-ultra-global.jpg', specs: { display: '6.73" AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '16GB', storage: '256GB/512GB/1TB', camera: '200MP', battery: '6000mAh' } },
  { name: 'Xiaomi 17', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-17.jpg', specs: { display: '6.67" AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '5200mAh' } },
  { name: 'Poco X8 Pro Max', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x8-pro-max.jpg', specs: { display: '6.67" AMOLED', processor: 'Snapdragon 8 Elite', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Poco X8 Pro', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x8-pro.jpg', specs: { display: '6.67" AMOLED', processor: 'Snapdragon 8s Gen 3', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '5500mAh' } },
  { name: 'Poco M8 Pro', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-m8-pro.jpg', specs: { display: '6.67" AMOLED', processor: 'Dimensity 7300', ram: '8GB', storage: '256GB', camera: '108MP', battery: '5500mAh' } },
  { name: 'Redmi Note 15 Special', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-15-special-edition-.jpg', specs: { display: '6.67" AMOLED', processor: 'Dimensity 7300', ram: '8GB', storage: '256GB', camera: '200MP', battery: '5500mAh' } },
  { name: 'Redmi Turbo 5', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-turbo-5.jpg', specs: { display: '6.67" AMOLED', processor: 'Snapdragon 8s Gen 4', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Poco C81 Pro', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-c81-pro.jpg', specs: { display: '6.79" IPS LCD', processor: 'Helio G92 Ultra', ram: '6GB', storage: '128GB', camera: '50MP', battery: '5160mAh' } },
  { name: 'Redmi 15a', brand: 'Xiaomi', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-15a.jpg', specs: { display: '6.88" IPS LCD', processor: 'Helio G81 Ultra', ram: '4GB', storage: '128GB', camera: '50MP', battery: '5160mAh' } },

  // ── VIVO ───────────────────────────────────────────────────────────
  { name: 'Vivo X300 Ultra', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x300-ultra.jpg', specs: { display: '6.78" AMOLED', processor: 'Dimensity 9400', ram: '16GB', storage: '256GB/512GB/1TB', camera: '200MP', battery: '6500mAh' } },
  { name: 'Vivo X300s', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x300s.jpg', specs: { display: '6.78" AMOLED', processor: 'Dimensity 9300+', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '5500mAh' } },
  { name: 'Vivo X300 FE', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-x300-fe-5g-.jpg', specs: { display: '6.78" AMOLED', processor: 'Dimensity 8400', ram: '12GB', storage: '256GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Vivo T5 Pro', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-t5-pro.jpg', specs: { display: '6.78" AMOLED', processor: 'Dimensity 8400', ram: '8GB', storage: '256GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Vivo V70 FE', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-v70-fe.jpg', specs: { display: '6.74" AMOLED', processor: 'Snapdragon 6 Gen 1', ram: '8GB', storage: '256GB', camera: '50MP', battery: '5500mAh' } },
  { name: 'Vivo Y51 Pro', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-y51-pro.jpg', specs: { display: '6.72" IPS LCD', processor: 'Dimensity 6300', ram: '8GB', storage: '128GB', camera: '50MP', battery: '5000mAh' } },
  { name: 'Vivo iQOO Z11', brand: 'Vivo', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-z11-5g.jpg', specs: { display: '6.77" AMOLED', processor: 'Snapdragon 7s Gen 3', ram: '8GB', storage: '128GB/256GB', camera: '50MP', battery: '6000mAh' } },

  // ── REALME ─────────────────────────────────────────────────────────
  { name: 'Realme 16 Pro+', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-16-pro-plus.jpg', specs: { display: '6.77" AMOLED', processor: 'Snapdragon 7s Gen 3', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Realme 16 Pro', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-16-pro.jpg', specs: { display: '6.77" AMOLED', processor: 'Dimensity 7300 Energy', ram: '8GB', storage: '256GB', camera: '50MP', battery: '5200mAh' } },
  { name: 'Realme 16', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-16-.jpg', specs: { display: '6.72" IPS LCD', processor: 'Helio G100 Ultra', ram: '8GB', storage: '256GB', camera: '50MP', battery: '5000mAh' } },
  { name: 'Realme Neo8', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-neo8.jpg', specs: { display: '6.78" AMOLED', processor: 'Snapdragon 8s Gen 4', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '6000mAh' } },
  { name: 'Realme P4 Power', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-p4-power.jpg', specs: { display: '6.77" AMOLED', processor: 'Dimensity 7025', ram: '8GB', storage: '128GB/256GB', camera: '50MP', battery: '7000mAh' } },
  { name: 'Realme Narzo 90', brand: 'Realme', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/realme-narzo-90.jpg', specs: { display: '6.67" IPS LCD', processor: 'Helio G100', ram: '6GB', storage: '128GB', camera: '50MP', battery: '5000mAh' } },

  // ── GOOGLE ─────────────────────────────────────────────────────────
  { name: 'Pixel 10 Pro XL', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-pro-xl-.jpg', specs: { display: '6.8" OLED', processor: 'Google Tensor G5', ram: '16GB', storage: '256GB/512GB/1TB', camera: '50MP', battery: '5060mAh' } },
  { name: 'Pixel 10 Pro', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-pro-.jpg', specs: { display: '6.3" OLED', processor: 'Google Tensor G5', ram: '16GB', storage: '128GB/256GB/512GB', camera: '50MP', battery: '4700mAh' } },
  { name: 'Pixel 10', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-10-.jpg', specs: { display: '6.3" OLED', processor: 'Google Tensor G5', ram: '8GB', storage: '128GB/256GB', camera: '50MP', battery: '4400mAh' } },
  { name: 'Pixel 9 Pro XL', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl-.jpg', specs: { display: '6.8" OLED', processor: 'Google Tensor G4', ram: '16GB', storage: '128GB/256GB/512GB/1TB', camera: '50MP', battery: '5060mAh' } },
  { name: 'Pixel 9 Pro', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-.jpg', specs: { display: '6.3" OLED', processor: 'Google Tensor G4', ram: '16GB', storage: '128GB/256GB/512GB/1TB', camera: '50MP', battery: '4700mAh' } },
  { name: 'Pixel 9', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-.jpg', specs: { display: '6.3" OLED', processor: 'Google Tensor G4', ram: '12GB', storage: '128GB/256GB', camera: '50MP', battery: '4558mAh' } },
  { name: 'Pixel 9a', brand: 'Google', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9a.jpg', specs: { display: '6.3" OLED', processor: 'Google Tensor G4', ram: '8GB', storage: '128GB/256GB', camera: '48MP', battery: '5100mAh' } },

  // ── ASUS ROG / Gaming ──────────────────────────────────────────────
  { name: 'ROG Phone 9 Pro', brand: 'Asus', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-9-pro.jpg', specs: { display: '6.78" AMOLED 185Hz', processor: 'Snapdragon 8 Elite', ram: '16GB', storage: '512GB/1TB', camera: '50MP', battery: '5800mAh' } },
  { name: 'ROG Phone 9', brand: 'Asus', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-9.jpg', specs: { display: '6.78" AMOLED 185Hz', processor: 'Snapdragon 8 Elite', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '5800mAh' } },
  { name: 'Zenfone 12 Ultra', brand: 'Asus', category: 'smartphone', img: 'https://fdn2.gsmarena.com/vv/bigpic/asus-zenfone-12-ultra.jpg', specs: { display: '6.78" AMOLED', processor: 'Snapdragon 8 Elite', ram: '12GB', storage: '256GB/512GB', camera: '50MP', battery: '5500mAh' } },

  // ── LAPTOP ─────────────────────────────────────────────────────────
  { name: 'MacBook Pro 14 (M4)', brand: 'Apple', category: 'laptop', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-macbook-pro-14-2024-m4.jpg', specs: { display: '14.2" Liquid Retina XDR', processor: 'Apple M4 Pro', ram: '24GB', storage: '512GB SSD', battery: '72.4Wh' } },
  { name: 'MacBook Air 13 (M3)', brand: 'Apple', category: 'laptop', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-macbook-air-13-2024.jpg', specs: { display: '13.6" Liquid Retina', processor: 'Apple M3', ram: '8GB/16GB', storage: '256GB/512GB SSD', battery: '52.6Wh' } },

  // ── TABLET ─────────────────────────────────────────────────────────
  { name: 'iPad Pro 13 (2025)', brand: 'Apple', category: 'tablet', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-pro-13-2024.jpg', specs: { display: '13" Ultra Retina XDR OLED', processor: 'Apple M4', ram: '8GB/16GB', storage: '256GB-2TB', battery: '40.88Wh' } },
  { name: 'iPad Air 11 (2025)', brand: 'Apple', category: 'tablet', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-air-11-2025.jpg', specs: { display: '11" Liquid Retina', processor: 'Apple M3', ram: '8GB', storage: '128GB/256GB/512GB/1TB', battery: '28.93Wh' } },
  { name: 'Galaxy Tab S11 Ultra', brand: 'Samsung', category: 'tablet', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s11-ultra.jpg', specs: { display: '14.6" Dynamic AMOLED', processor: 'Snapdragon 8 Elite 2', ram: '12GB/16GB', storage: '256GB/512GB/1TB', battery: '11200mAh' } },
  { name: 'Xiaomi Pad 8 Pro', brand: 'Xiaomi', category: 'tablet', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-pad-8-pro.jpg', specs: { display: '12.1" LCD', processor: 'Snapdragon 8 Gen 2', ram: '8GB/12GB', storage: '128GB/256GB/512GB', battery: '10000mAh' } },

  // ── WEARABLE ───────────────────────────────────────────────────────
  { name: 'Apple Watch Ultra 3', brand: 'Apple', category: 'wearable', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-watch-ultra3.jpg', specs: { display: '2.1" LTPO OLED', processor: 'S10 chip', battery: '76h' } },
  { name: 'Apple Watch Series 11', brand: 'Apple', category: 'wearable', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-watch11.jpg', specs: { display: '1.9" LTPO OLED', processor: 'S10 chip', battery: '36h' } },
  { name: 'Galaxy Watch8 Classic', brand: 'Samsung', category: 'wearable', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch8-classic.jpg', specs: { display: '1.5" Super AMOLED', processor: 'Exynos W1000', battery: '47h' } },
  { name: 'Galaxy Watch8', brand: 'Samsung', category: 'wearable', img: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch8.jpg', specs: { display: '1.5" Super AMOLED', processor: 'Exynos W1000', battery: '40h' } },
  { name: 'Xiaomi Watch 5', brand: 'Xiaomi', category: 'wearable', img: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-watch5.jpg', specs: { display: '1.43" AMOLED', processor: 'Snapdragon W5 Gen 2', battery: '65h' } },

  // ── AUDIO ──────────────────────────────────────────────────────────
  { name: 'AirPods Pro 3', brand: 'Apple', category: 'audio', img: 'https://fdn2.gsmarena.com/vv/bigpic/apple-airpods-pro-2nd-gen.jpg', specs: { type: 'True Wireless', anc: 'Active Noise Cancellation', battery: '6h + 24h case', driver: 'H2 chip' } },
];

async function downloadImage(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

async function uploadToSupabase(buffer: Buffer, filename: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('dekat-media')
    .upload(`gadgets/${filename}`, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('dekat-media').getPublicUrl(`gadgets/${filename}`);
  return data.publicUrl;
}

async function main() {
  console.log(`\n🚀 Memulai import ${GADGETS.length} gadget...\n`);
  let success = 0, skip = 0, fail = 0;

  for (const g of GADGETS) {
    const exists = await prisma.gadget.findFirst({ where: { name: g.name, brand: g.brand } });
    if (exists) { console.log(`  ⏭  Skip: ${g.brand} ${g.name}`); skip++; continue; }

    process.stdout.write(`  📥 ${g.brand} ${g.name} ... `);
    const imgBuf = await downloadImage(g.img);
    let imageUrl: string | null = null;

    if (imgBuf) {
      const slug = g.img.split('/').pop()!;
      imageUrl = await uploadToSupabase(imgBuf, slug);
    }

    await prisma.gadget.create({
      data: {
        name: g.name,
        brand: g.brand,
        category: g.category as any,
        specs: g.specs,
        imageUrl,
        isTrending: ['iPhone 17 Pro Max', 'Galaxy S26 Ultra', 'Xiaomi 17 Ultra', 'Pixel 10 Pro'].includes(g.name),
      },
    });

    console.log(imageUrl ? `✅ (foto uploaded)` : `⚠️  (foto gagal, tanpa foto)`);
    success++;

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Selesai! ${success} imported, ${skip} skipped, ${fail} failed\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
