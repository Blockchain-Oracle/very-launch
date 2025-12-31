"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "~~/components/ui/drawer";

export default function Header() {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Explore", href: "/app/explore" },
    { label: "Manage", href: "/app" },
    { label: "Roadmap", href: "/app/roadmap" },
  ];

  return (
    <header className="relative z-20 flex items-center justify-between p-3 sm:p-6">
      {/* Logo */}
      <Link href="/">
        <Image src="/logo.svg" alt="VeryLaunch" width={200} height={60} className="h-8 sm:h-10 w-auto" />
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden sm:flex items-center space-x-2">
        <a
          href="/app/explore"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Explore
        </a>
        <a
          href="/app"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Manage
        </a>
        <a
          href="/app/roadmap"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Roadmap
        </a>
      </nav>

      {/* Mobile Navigation & App Button Container */}
      <div className="flex items-center gap-2">
        {/* Mobile Hamburger Menu */}
        <Drawer open={open} onOpenChange={setOpen} direction="bottom">
          <DrawerTrigger asChild>
            <button className="sm:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-[#0F0F0F] border-t border-gray-800 text-white">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-700 mb-4 mt-2" />
            <div className="px-4 pb-6 space-y-4">
              {/* Logo */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <Link href="/" onClick={() => setOpen(false)}>
                  <Image src="/logo.svg" alt="VeryLaunch" width={200} height={60} className="h-8 w-auto" />
                </Link>
                <DrawerClose asChild>
                  <button className="p-2 text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </DrawerClose>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-2">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* App Button */}
              <div className="pt-4 border-t border-gray-800">
                <Link
                  href="/app"
                  onClick={() => setOpen(false)}
                  className="block w-full px-6 py-3 rounded-full bg-[#FF6B7A] text-white font-normal text-center transition-all duration-300 hover:bg-[#FF8B7A]"
                >
                  Launch App
                </Link>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Desktop App Button */}
        <div
          id="gooey-btn"
          className="hidden sm:flex relative items-center group"
          style={{ filter: "url(#gooey-filter)" }}
        >
          <Link
            href={"/app"}
            className="px-6 py-2 rounded-full bg-[#FF6B7A] text-white font-normal text-xs transition-all duration-300 hover:bg-[#FF8B7A] cursor-pointer h-8 flex items-center z-10"
          >
            App
          </Link>
        </div>
      </div>
    </header>
  );
}
