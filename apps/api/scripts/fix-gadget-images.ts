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

// GSMArena CDN image mappings — used as source of truth for all gadgets
// Key: "${brand} ${name}" matching DB values
const IMAGE_MAP: Record<string, string> = {
  // ── APPLE ───────────────────────────────────────────────────────────
  'Apple iPhone 15 Pro Max':          'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg',
  'Apple iPhone 15 Pro':              'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro.jpg',
  'Apple iPhone 15 Plus':             'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-plus.jpg',
  'Apple iPhone 15':                  'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg',
  'Apple iPhone 16 Pro Max':          'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg',
  'Apple iPhone 16 Pro':              'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg',
  'Apple iPhone 16 Plus':             'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-plus.jpg',
  'Apple iPhone 16':                  'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg',
  'Apple iPhone 16e':                 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg',
  'Apple iPhone 14 Pro Max':          'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max.jpg',
  'Apple iPhone 14 Pro':              'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro.jpg',
  'Apple iPhone 14 Plus':             'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-plus.jpg',
  'Apple iPhone 14':                  'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg',
  'Apple iPad mini 7':                'https://fdn2.gsmarena.com/vv/bigpic/apple-ipad-mini-2024.jpg',
  'Apple AirPods Pro 2':              'https://fdn2.gsmarena.com/vv/bigpic/apple-airpods-pro-2nd-gen.jpg',
  'Apple AirPods Pro 3':              'https://fdn2.gsmarena.com/vv/bigpic/apple-airpods-pro-2nd-gen.jpg',
  'Apple AirPods 4':                  'https://fdn2.gsmarena.com/vv/bigpic/apple-airpods-4th-gen.jpg',
  'Apple AirPods Max USB-C':          'https://fdn2.gsmarena.com/vv/bigpic/apple-airpods-max-2024.jpg',
  // ── SAMSUNG ─────────────────────────────────────────────────────────
  'Samsung Galaxy S24 Ultra':         'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra5g.jpg',
  'Samsung Galaxy S24+':              'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24plus5g.jpg',
  'Samsung Galaxy S24':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24.jpg',
  'Samsung Galaxy S24 FE':            'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-fe.jpg',
  'Samsung Galaxy S25 Ultra':         'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra5g.jpg',
  'Samsung Galaxy S25+':              'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25plus5g.jpg',
  'Samsung Galaxy S25':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25.jpg',
  'Samsung Galaxy S25 Edge':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-edge.jpg',
  'Samsung Galaxy S26 Ultra':         'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s26-ultra-new.jpg',
  'Samsung Galaxy S23 Ultra':         'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra5g.jpg',
  'Samsung Galaxy S23+':              'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23plus5g.jpg',
  'Samsung Galaxy S23':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-5g.jpg',
  'Samsung Galaxy S23 FE':            'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-fe.jpg',
  'Samsung Galaxy Z Fold 6':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg',
  'Samsung Galaxy Z Flip 6':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg',
  'Samsung Galaxy Z Fold 5':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold5.jpg',
  'Samsung Galaxy Z Flip 5':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip5.jpg',
  'Samsung Galaxy A55 5G':            'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg',
  'Samsung Galaxy A35 5G':            'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a35.jpg',
  'Samsung Galaxy A54':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a54.jpg',
  'Samsung Galaxy A34':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a34.jpg',
  'Samsung Galaxy A14':               'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a14.jpg',
  'Samsung Galaxy Tab S10 Ultra':     'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s10-ultra.jpg',
  'Samsung Galaxy Tab S10+':          'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s10-plus.jpg',
  'Samsung Galaxy Tab S10':           'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-tab-s10.jpg',
  'Samsung Galaxy Watch 7':           'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch7.jpg',
  'Samsung Galaxy Watch Ultra':       'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-watch-ultra.jpg',
  'Samsung Galaxy Buds 3 Pro':        'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-buds3-pro.jpg',
  'Samsung Samsung Galaxy S24 Ultra': 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra5g.jpg',
  // ── XIAOMI ──────────────────────────────────────────────────────────
  'Xiaomi Xiaomi 14 Ultra':           'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
  'Xiaomi Xiaomi 14':                 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg',
  'Xiaomi Xiaomi 15':                 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15.jpg',
  'Xiaomi Xiaomi 15 Ultra':           'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15-ultra.jpg',
  'Xiaomi POCO F6':                   'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg',
  'Xiaomi POCO X6 Pro':               'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg',
  'Xiaomi POCO X6':                   'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6.jpg',
  'Xiaomi Redmi Note 13 Pro+':        'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro-plus.jpg',
  'Xiaomi Redmi Note 13 Pro':         'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro.jpg',
  'Xiaomi Redmi Note 13':             'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13.jpg',
  // ── GOOGLE ──────────────────────────────────────────────────────────
  'Google Google Pixel 8 Pro':        'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg',
  'Google Pixel 9':                   'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-.jpg',
  'Google Pixel 9 Pro':               'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-.jpg',
  'Google Pixel 8':                   'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8.jpg',
  'Google Pixel 8a':                  'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8a.jpg',
  // ── NOTHING ─────────────────────────────────────────────────────────
  'Nothing Nothing Phone (2a)':       'https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg',
  // ── OPPO ────────────────────────────────────────────────────────────
  'OPPO Find X8 Pro':                 'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8-pro.jpg',
  'OPPO Find X8':                     'https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8.jpg',
  // ── SONY ────────────────────────────────────────────────────────────
  'Sony WH-1000XM5':                  'https://fdn2.gsmarena.com/vv/bigpic/sony-wh1000xm5.jpg',
  'Sony WH-1000XM6':                  'https://fdn2.gsmarena.com/vv/bigpic/sony-wh-1000xm6.jpg',
  'Sony WF-1000XM5':                  'https://fdn2.gsmarena.com/vv/bigpic/sony-wf1000xm5.jpg',
  // ── VIVO ────────────────────────────────────────────────────────────
  'Vivo X100 Pro':                    'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg',
  'Vivo X100':                        'https://fdn2.gsmarena.com/vv/bigpic/vivo-x100.jpg',
  // ── REALME ──────────────────────────────────────────────────────────
  'Realme GT 6':                      'https://fdn2.gsmarena.com/vv/bigpic/realme-gt-6.jpg',
  'Realme 12 Pro+':                   'https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg',
  'Realme 12 Pro':                    'https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg',
};

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
  if (error) { console.error('  Upload error:', error.message); return null; }
  const { data } = supabase.storage.from('dekat-media').getPublicUrl(`gadgets/${filename}`);
  return data.publicUrl;
}

const SUPABASE_HOST = 'rhttgcrezicnkavwwfcy.supabase.co';

function isSupabaseUrl(url: string): boolean {
  return url.includes(SUPABASE_HOST);
}

function slugFromUrl(url: string, fallbackName: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop();
    if (last && last.includes('.')) return last;
  } catch {}
  return fallbackName.toLowerCase().replace(/\s+/g, '-') + '.jpg';
}

async function main() {
  // Find gadgets with null imageUrl OR non-Supabase imageUrl
  const allGadgets = await prisma.gadget.findMany({
    select: { id: true, name: true, brand: true, imageUrl: true },
    orderBy: { brand: 'asc' },
  });

  const toFix = allGadgets.filter(g => !g.imageUrl || !isSupabaseUrl(g.imageUrl));
  console.log(`\n🔍 Found ${toFix.length} gadgets needing image fix\n`);

  let fixed = 0, skipped = 0, failed = 0;

  for (const g of toFix) {
    const key = `${g.brand} ${g.name}`;
    // Prefer IMAGE_MAP (GSMArena CDN, publicly downloadable) over samsung.com/unsplash URLs
    const srcUrl = IMAGE_MAP[key] ?? g.imageUrl ?? null;

    if (!srcUrl) {
      console.log(`  ⚠️  No image for: ${key}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  📥 ${key} ... `);
    const imgBuf = await downloadImage(srcUrl);

    if (!imgBuf) {
      console.log(`❌ download failed`);
      failed++;
      continue;
    }

    const slug = slugFromUrl(srcUrl, `${g.brand}-${g.name}`);
    const publicUrl = await uploadToSupabase(imgBuf, slug);

    if (!publicUrl) {
      console.log(`❌ upload failed`);
      failed++;
      continue;
    }

    await prisma.gadget.update({
      where: { id: g.id },
      data: { imageUrl: publicUrl },
    });

    console.log(`✅`);
    fixed++;

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Done! ${fixed} fixed, ${skipped} skipped (no source), ${failed} failed\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
