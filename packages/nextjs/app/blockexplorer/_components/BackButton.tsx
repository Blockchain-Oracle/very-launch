"use client";

import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();
  return (
    <button className="btn btn-sm bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white border-0" onClick={() => router.back()}>
      Back
    </button>
  );
};
