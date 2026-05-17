"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const FALLBACK = [
  { id: "d87dba92-e880-416a-b093-e0b6a187dcfe", name: "iPhone 17", brand: "Apple", emoji: "📱" },
  { id: "32062a42-d258-4310-bb42-760567e812a6", name: "S26 Ultra", brand: "Samsung", emoji: "📲" },
  { id: "aacabfc3-4310-4a68-ba07-6f5f2a5ccd39", name: "MacBook M5", brand: "Apple", emoji: "💻" },
  { id: "5f4cccfe-a8ee-4eaf-aff1-a29d1dd40ea1", name: "AirPods Pro 3", brand: "Apple", emoji: "🎧" },
  { id: "eb1d2c80-2358-4257-8d2f-e934103dec5f", name: "Vivo X300 Pro", brand: "Vivo", emoji: "📸" },
  { id: "1c9dfa3c-b64f-4317-94e2-57fcaad2f82d", name: "Watch Ultra 3", brand: "Apple", emoji: "⌚" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟",
  wearable: "⌚", audio: "🎧", other: "📦",
};

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string | null;
  emoji?: string;
}

export function GadgetTrending() {
  const router = useRouter();
  const [gadgets, setGadgets] = useState<Gadget[]>(FALLBACK);

  useEffect(() => {
    api.get("/gadgets/trending")
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setGadgets(res.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
          🔥 Gadget Trending
        </p>
        <button className="text-[12px] font-semibold text-[#d42b2b]">Lihat semua ›</button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
        {gadgets.map((g) => {
          const emoji = g.emoji ?? CATEGORY_EMOJI[g.category ?? ""] ?? "📱";
          return (
            <button
              key={g.id}
              onClick={() => router.push(`/gadget/${g.id}`)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:border-[#d42b2b] transition-colors overflow-hidden">
                {g.imageUrl
                  ? <img src={g.imageUrl} alt={g.name} className="w-12 h-12 object-contain" />
                  : <span className="text-2xl">{emoji}</span>}
              </div>
              <span className="text-[11px] font-medium text-gray-700 text-center leading-tight max-w-[68px] truncate">
                {g.name}
              </span>
              <span className="text-[10px] text-gray-400">{g.brand}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
