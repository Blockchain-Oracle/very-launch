import Image from "next/image";
import Link from "next/link";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

// Define the props type for AppHeader
interface NavItem {
  href: string;
  label: string;
  isActive: boolean;
}

interface AppHeaderProps {
  navItems: NavItem[];
  onNavClick: (href: string) => void;
}

export function AppHeader({ navItems, onNavClick }: AppHeaderProps) {
  return (
    <header className="bg-[#0F0F0F] px-3 sm:px-6 pt-4 pb-2">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left side - Logo and Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-5 md:space-x-10 flex-1 min-w-0">
          <Link href="/" className="flex-shrink-0">
            <Image src="/logo.svg" alt="VeryLaunch" width={200} height={60} className="h-6 sm:h-8 md:h-10 w-auto" />
          </Link>

          <nav className="hidden sm:flex items-center space-x-2 md:space-x-4 lg:space-x-6">
            {navItems.map((item, index) => (
              <Link
                href={item.href}
                key={index}
                onClick={() => onNavClick(item.href)}
                className={`hover:text-gray-300 transition-colors font-extralight flex justify-center items-center h-full rounded-3xl text-xs sm:text-sm whitespace-nowrap ${
                  item.isActive ? "text-white bg-[#FF6B7A]/10 px-3 sm:px-5 py-1 sm:py-2" : "text-gray-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side - Mobile menu and User section */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Menu */}
          <div className="sm:hidden">
            <MobileNavDrawer navItems={navItems} onNavClick={onNavClick} />
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden sm:block navbar-end">
            <RainbowKitCustomConnectButton bg="bg-[#0F0F0F] text-gray-200" />
          </div>
        </div>
      </div>
    </header>
  );
}
