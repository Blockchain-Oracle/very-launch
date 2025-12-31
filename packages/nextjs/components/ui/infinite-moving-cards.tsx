"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Address } from "../scaffold-eth";
import { cn, formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: ICampaign[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  const [start, setStart] = useState(false);

  const getDirection = useCallback(() => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty("--animation-direction", "forwards");
      } else {
        containerRef.current.style.setProperty("--animation-direction", "reverse");
      }
    }
  }, [containerRef, direction]);

  const getSpeed = useCallback(() => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  }, [containerRef, speed]);

  const addAnimation = useCallback(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      scrollerContent.forEach(item => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });
      getDirection();
      getSpeed();
      setStart(true);
    }
  }, [containerRef, scrollerRef, getDirection, getSpeed]);

  useEffect(() => {
    addAnimation();
  }, [addAnimation]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
      >
        {items
          .filter(item => item.name !== "Steakhouse")
          .map(item => (
            <li
              className="relative w-[350px] max-w-full shrink-0 rounded-2xl bg-[#0f1211] border-[#3e545f] px-6 py-4 md:w-[450px] h-auto dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
              key={item.id}
            >
              <div className="h-full">
                <div
                  aria-hidden="true"
                  className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
                ></div>
                <div className="flex flex-col justify-between h-full items-start">
                  <p className="text-2xl sm:text-3xl font-semibold mb-3">
                    {item.name} <span className="text-sm p-3 text-gray-500">{item.symbol}</span>{" "}
                  </p>
                  <div className="inline-flex items-center text-xs gap-2 mb-2">
                    BY <Address size="xs" address={item.creator} />
                  </div>
                  <span className="relative z-20 text-sm leading-[1.6] font-normal text-neutral-100 dark:text-gray-100 text-wrap line-clamp-2 mb-4">
                    {item.description}
                  </span>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex gap-6">
                      <div className="flex flex-col items-start">
                        <p className="text-sm md:text-2xl md:leading-16 tracking-tight font-light text-white">
                          {formatAmount(item.targetAmount)}
                        </p>
                        <span className="text-[11px] text-gray-300">Target</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <p className="text-sm md:text-2xl md:leading-16 tracking-tight font-light text-white">
                          {formatAmount(item.amountRaised)}
                        </p>
                        <span className="text-[11px] text-gray-300">Raised</span>
                      </div>
                    </div>
                    <Link
                      href={`/app/campaign/${item.id}`}
                      className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10"
                    >
                      Visit
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};
