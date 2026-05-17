import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official image URLs from Apple, Samsung, and brand websites
const imageMap: Record<string, string> = {
  // ── Apple iPhone ──────────────────────────────────────────────
  'Apple|iPhone 16': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 16 Plus': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-finish-select-202409-6-7inch-black?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 16 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 16 Pro Max': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-finish-select-202409-6-9inch-blacktitanium?wid=600&hei=600&fmt=jpeg',
  // iPhone 17 pakai placeholder mirip iPhone 16 Pro sampai Apple release resmi
  'Apple|iPhone 17': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 17 Air': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-finish-select-202409-6-7inch-black?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 17 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=600&hei=600&fmt=jpeg',
  'Apple|iPhone 17 Pro Max': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-finish-select-202409-6-9inch-blacktitanium?wid=600&hei=600&fmt=jpeg',

  // ── Apple MacBook ──────────────────────────────────────────────
  'Apple|MacBook Air 13" M3': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-13-m3-midnight-select-20240308?wid=600&hei=600&fmt=jpeg',
  'Apple|MacBook Air 15" M3': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-15-m3-midnight-select-20240308?wid=600&hei=600&fmt=jpeg',
  'Apple|MacBook Air 13" M4': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-13-m4-sky-blue-select-202503?wid=600&hei=600&fmt=jpeg',
  'Apple|MacBook Pro 14" M4': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spaceblack-select-202411?wid=600&hei=600&fmt=jpeg',
  'Apple|MacBook Pro 16" M4 Pro': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spaceblack-select-202411?wid=600&hei=600&fmt=jpeg',

  // ── Apple iPad ─────────────────────────────────────────────────
  'Apple|iPad Air 11" M2': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202405?wid=600&hei=600&fmt=jpeg',
  'Apple|iPad Air 13" M2': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-starlight-202405_FMT_WHH?wid=600&hei=600&fmt=jpeg',
  'Apple|iPad Pro 11" M4': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-11-select-wifi-spacegray-202405?wid=600&hei=600&fmt=jpeg',
  'Apple|iPad Pro 13" M4': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-13-select-wifi-spacegray-202405?wid=600&hei=600&fmt=jpeg',
  'Apple|iPad mini 7': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-mini-select-wifi-starlight-202410?wid=600&hei=600&fmt=jpeg',

  // ── Apple Watch & Audio ────────────────────────────────────────
  'Apple|Apple Watch Series 10': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-s10-46-jet-black-aluminum-jet-black-sport-loop?wid=600&hei=600&fmt=jpeg',
  'Apple|Apple Watch Ultra 2': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/watch-ultra2-49-titanium-natural-trail-loop?wid=600&hei=600&fmt=jpeg',
  'Apple|AirPods 4': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MXP93?wid=600&hei=600&fmt=jpeg',
  'Apple|AirPods Pro 2': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=600&hei=600&fmt=jpeg',
  'Apple|AirPods Max USB-C': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTP3?wid=600&hei=600&fmt=jpeg',

  // ── Samsung Galaxy S ───────────────────────────────────────────
  'Samsung|Galaxy S24': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-sm-s921-sm-s921bzaabtu-thumb-539540616?$700_560_PNG$',
  'Samsung|Galaxy S24+': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-sm-s926-sm-s926bzaabtu-thumb-539540623?$700_560_PNG$',
  'Samsung|Galaxy S24 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2401/gallery/uk-galaxy-s24-ultra-sm-s928-sm-s928bzkabtu-thumb-539473375?$700_560_PNG$',
  'Samsung|Galaxy S24 FE': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2410/gallery/uk-galaxy-s24-fe-sm-s721-sm-s721blbabtu-thumb-542102601?$700_560_PNG$',
  'Samsung|Galaxy S25': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2501/gallery/uk-galaxy-s25-sm-s931-sm-s931bzkabtu-thumb-542524430?$700_560_PNG$',
  'Samsung|Galaxy S25+': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2501/gallery/uk-galaxy-s25-sm-s936-sm-s936bzkabtu-thumb-542524437?$700_560_PNG$',
  'Samsung|Galaxy S25 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2501/gallery/uk-galaxy-s25-ultra-sm-s938-sm-s938bzkabtu-thumb-542524444?$700_560_PNG$',
  'Samsung|Galaxy S25 Edge': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2504/gallery/uk-galaxy-s25-edge-sm-s937-sm-s937bzkabtu-thumb-544296810?$700_560_PNG$',
  'Samsung|Galaxy Z Fold 6': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-z-fold6-sm-f956-sm-f956bzkabtu-thumb-541659017?$700_560_PNG$',
  'Samsung|Galaxy Z Flip 6': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-z-flip6-sm-f741-sm-f741bzkabtu-thumb-541659027?$700_560_PNG$',
  'Samsung|Galaxy A55 5G': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2403/gallery/uk-galaxy-a55-5g-sm-a556-sm-a556bazaabtu-thumb-539886268?$700_560_PNG$',
  'Samsung|Galaxy A35 5G': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2403/gallery/uk-galaxy-a35-5g-sm-a356-sm-a356bzkabtu-thumb-539886278?$700_560_PNG$',

  // ── Samsung Tab & Watch ────────────────────────────────────────
  'Samsung|Galaxy Tab S10': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2408/gallery/uk-galaxy-tab-s10-sm-x726-sm-x726bzkabtu-thumb-541718898?$700_560_PNG$',
  'Samsung|Galaxy Tab S10+': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2408/gallery/uk-galaxy-tab-s10-sm-x826-sm-x826bzkabtu-thumb-541718905?$700_560_PNG$',
  'Samsung|Galaxy Tab S10 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2408/gallery/uk-galaxy-tab-s10-ultra-sm-x926-sm-x926bzkabtu-thumb-541718912?$700_560_PNG$',
  'Samsung|Galaxy Watch 7': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-watch7-sm-l300-sm-l300nzkabtu-thumb-541659037?$700_560_PNG$',
  'Samsung|Galaxy Watch Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-watch-ultra-sm-l705-sm-l705nzkabtu-thumb-541659047?$700_560_PNG$',
  'Samsung|Galaxy Ring': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-ring-sm-q501-sm-q501nzkabtu-thumb-541659057?$700_560_PNG$',
  'Samsung|Galaxy Buds 3 Pro': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2407/gallery/uk-galaxy-buds3-pro-sm-r630-sm-r630nzkabtu-thumb-541659067?$700_560_PNG$',
  'Samsung|Galaxy Book 4 Ultra': 'https://images.samsung.com/is/image/samsung/p6pim/uk/2024/gallery/uk-galaxy-book4-ultra-np960-np960xma-kb1uk-thumb-539607398?$700_560_PNG$',

  // ── Xiaomi ─────────────────────────────────────────────────────
  'Xiaomi|Xiaomi 14': 'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-14/section2.png',
  'Xiaomi|Xiaomi 14 Ultra': 'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-14-ultra/section1.png',
  'Xiaomi|Xiaomi 15': 'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-15/overview_hero_image.png',
  'Xiaomi|Xiaomi 15 Ultra': 'https://i01.appmifile.com/webfile/globalimg/products/m/xiaomi-15-ultra/section2.png',

  // ── Google Pixel ───────────────────────────────────────────────
  'Google|Pixel 9': 'https://store.google.com/us/category/phones/Pixel_9?hl=en-US',
  'Google|Pixel 9 Pro': 'https://lh3.googleusercontent.com/gPPGzMKjBuSvbFz1KoMxAH3FqPNdEYdCKe3aHo_gHdMOjc6QHM2t5WqJNKSBaQZUfg',

  // ── Sony Audio ─────────────────────────────────────────────────
  'Sony|WH-1000XM5': 'https://sony.scene7.com/is/image/sonyglobalsolutions/WH-1000XM5_Black_Front?$productImage_L$',
  'Sony|WH-1000XM6': 'https://sony.scene7.com/is/image/sonyglobalsolutions/WH-1000XM6-Black-Front?$productImage_L$',
  'Sony|WF-1000XM5': 'https://sony.scene7.com/is/image/sonyglobalsolutions/WF-1000XM5_Black_Front?$productImage_L$',
};

async function main() {
  console.log('🖼️  Updating gadget images...');
  let updated = 0;
  let notFound = 0;

  for (const [key, imageUrl] of Object.entries(imageMap)) {
    const [brand, name] = key.split('|');
    try {
      const result = await prisma.gadget.updateMany({
        where: { brand, name },
        data: { imageUrl },
      });
      if (result.count > 0) {
        updated++;
        console.log(`✅ ${brand} ${name}`);
      } else {
        notFound++;
        console.log(`⚠️  Not found: ${brand} ${name}`);
      }
    } catch (e: any) {
      console.log(`❌ Error: ${brand} ${name} — ${e.message}`);
    }
  }

  console.log(`\n🎉 Selesai! ${updated} updated, ${notFound} not found.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
