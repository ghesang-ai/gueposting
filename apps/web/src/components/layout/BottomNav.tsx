"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", label: "Beranda", icon: Home },
  { href: "/explore", label: "Jelajah", icon: Compass },
  { href: "/post/new", label: "Post", icon: PlusCircle },
  { href: "/community", label: "Komunitas", icon: Users },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const isPost = href === "/post/new";
          if (isPost) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 -mt-4">
                <div className="w-12 h-12 rounded-full bg-[#d42b2b] flex items-center justify-center shadow-md">
                  <Icon size={24} strokeWidth={2.5} className="text-white" />
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                active ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={cn("text-[10px] font-medium", active && "font-bold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
