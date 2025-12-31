"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./_components/app-header";

// Define the NavItem type for clarity
interface NavItem {
  label: string;
  href: string;
}

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  // Define navItems without isActive, as it will be derived dynamically
  const navItems: NavItem[] = [
    {
      label: "Manage",
      href: "/app",
    },
    {
      label: "Explore",
      href: "/app/explore",
    },
    {
      label: "Roadmap",
      href: "/app/roadmap",
    },
  ];

  // Use pathname to determine the active item based on the current route
  const pathname = usePathname();
  // State to track the active item (optional, for click-based toggling)
  const [activeItem, setActiveItem] = useState<string>(pathname);

  // Handler to update active item on click
  const handleNavClick = (href: string) => {
    setActiveItem(href);
  };

  // Map navItems to include isActive based on the current pathname or activeItem
  const navItemsWithActive = navItems.map(item => ({
    ...item,
    isActive: item.href === activeItem || item.href === pathname,
  }));

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <AppHeader navItems={navItemsWithActive} onNavClick={handleNavClick} />
      {children}
    </div>
  );
};

export default AppLayout;
