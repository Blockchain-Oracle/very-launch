"use client";

import { useState } from "react";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/dialog";
import { useWepin } from "~~/hooks/useWepin";

interface WepinProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WepinProviderModal({ isOpen, onClose }: WepinProviderModalProps) {
  const { connect, isLoading: wepinLoading, error: wepinError } = useWepin();
  const [selectedProvider, setSelectedProvider] = useState<"google" | "apple" | null>(null);

  const handleWepinConnect = async (provider: "google" | "apple") => {
    setSelectedProvider(provider);
    try {
      await connect(provider);
      onClose(); // Close modal on successful connection
    } catch (error) {
      console.error("Failed to connect with Wepin:", error);
      setSelectedProvider(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">Login via Wepin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-400 text-center px-4">Choose your preferred social login method</p>

          {/* Google Login */}
          <Button
            onClick={() => handleWepinConnect("google")}
            disabled={wepinLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 py-6 rounded-xl transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-3 w-full">
              {wepinLoading && selectedProvider === "google" ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="font-semibold">
                {wepinLoading && selectedProvider === "google" ? "Connecting..." : "Continue with Google"}
              </span>
            </div>
          </Button>

          {/* Apple Login */}
          <Button
            onClick={() => handleWepinConnect("apple")}
            disabled={wepinLoading}
            className="w-full bg-black hover:bg-gray-900 text-white py-6 rounded-xl transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-3 w-full">
              {wepinLoading && selectedProvider === "apple" ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              <span className="font-semibold">
                {wepinLoading && selectedProvider === "apple" ? "Connecting..." : "Continue with Apple"}
              </span>
            </div>
          </Button>

          {/* Error Message */}
          {wepinError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{wepinError}</p>
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center px-4 pt-2">
            Social login creates a secure wallet without seed phrases. Your keys are managed by Wepin.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
