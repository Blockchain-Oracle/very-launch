"use client";

import Image from "next/image";
import { TextHoverEffect } from "./ui/text-hover-effect";
import { Github, Linkedin, Twitter } from "lucide-react";

export function FooterSection() {
  return (
    <div>
      <footer className="w-full max-w-[1320px] mx-auto px-5 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-0 py-10 md:py-[70px]">
        {/* Left Section: Logo, Description, Social Links */}
        <div className="flex flex-col justify-start items-start gap-8 p-4 md:p-8">
          <div className="flex gap-3 items-stretch justify-center">
            <Image src="/icon.svg" alt="VeryLaunch Logo" width={100} height={100} className="w-28" />
          </div>
          <p className="text-foreground/90 text-sm font-medium leading-[18px] text-left">
            From zero gravity to full liquidity in one launch.
          </p>
          <div className="flex justify-start items-start gap-3">
            <a href="#" aria-label="Twitter" className="w-4 h-4 flex items-center justify-center">
              <Twitter className="w-full h-full text-muted-foreground" />
            </a>
            <a href="#" aria-label="GitHub" className="w-4 h-4 flex items-center justify-center">
              <Github className="w-full h-full text-muted-foreground" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-4 h-4 flex items-center justify-center">
              <Linkedin className="w-full h-full text-muted-foreground" />
            </a>
          </div>
        </div>
        {/* Right Section: Product, Company, Resources */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 p-4 md:p-8 w-full md:w-auto">
          <div className="flex flex-col justify-start items-start gap-4">
            <h3 className="text-gray-400 text-sm font-medium leading-5">Product</h3>
            <div className="flex flex-col justify-end items-start gap-3 text-sm text-gray-200 font-light">
              <a href="#" className="leading-5 hover:underline">
                Features
              </a>
              <a href="#" className="leading-5 hover:underline">
                Pricing
              </a>
              <a href="#" className="leading-5 hover:underline">
                Integrations
              </a>
              <a href="#" className="leading-5 hover:underline">
                Real-time Previews
              </a>
              <a href="#" className="leading-5 hover:underline">
                Multi-Agent Coding
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-start items-start gap-4">
            <h3 className="text-gray-400 text-sm font-medium leading-5">Company</h3>
            <div className="flex flex-col justify-center items-start gap-3 text-gray-200 font-light">
              <a href="#" className="leading-5 hover:underline">
                About us
              </a>
              <a href="#" className="leading-5 hover:underline">
                Our team
              </a>
              <a href="#" className="leading-5 hover:underline">
                Careers
              </a>
              <a href="#" className="leading-5 hover:underline">
                Brand
              </a>
              <a href="#" className="leading-5 hover:underline">
                Contact
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-start items-start gap-4">
            <h3 className="text-gray-400 text-sm font-medium leading-5">Resources</h3>
            <div className="flex flex-col justify-center items-start gap-3 text-gray-200 font-light">
              <a href="#" className="leading-5 hover:underline">
                Terms of use
              </a>
              <a href="#" className="leading-5 hover:underline">
                API Reference
              </a>
              <a href="#" className="leading-5 hover:underline">
                Documentation
              </a>
              <a href="#" className="leading-5 hover:underline">
                Community
              </a>
              <a href="#" className="leading-5 hover:underline">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
      <div className="px-2 sm:px-0">
        <TextHoverEffect text="VERYLAUNCH" />
      </div>
    </div>
  );
}
