"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "~~/components/ui/drawer";

interface NavItem {
  href: string;
  label: string;
  isActive: boolean;
}

interface MobileNavDrawerProps {
  navItems: NavItem[];
  onNavClick: (href: string) => void;
}

export function MobileNavDrawer({ navItems, onNavClick }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>
        <button className="sm:hidden p-2 text-white hover:bg-[#1A1A1A] rounded-lg transition-colors">
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
                onClick={() => {
                  onNavClick(item.href);
                  setOpen(false);
                }}
                className={`block px-4 py-3 rounded-xl transition-colors ${
                  item.isActive
                    ? "bg-[#FF6B7A]/10 text-white border border-[#FF6B7A]/30"
                    : "text-gray-400 hover:bg-[#1A1A1A] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="pt-4 border-t border-gray-800">
            <RainbowKitCustomConnectButton bg="bg-[#0F0F0F] text-gray-200" useModal={true} />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
