"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/dialog";
import { Input } from "~~/components/ui/input";
import { Label } from "~~/components/ui/label";

interface SlippageSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slippage: number;
  onSlippageChange: (slippage: number) => void;
}

export function SlippageSettings({ open, onOpenChange, slippage, onSlippageChange }: SlippageSettingsProps) {
  const [customSlippage, setCustomSlippage] = useState("");
  const [deadline, setDeadline] = useState("20");

  const presetSlippages = [0.1, 0.5, 1.0];

  const handlePresetClick = (value: number) => {
    onSlippageChange(value);
    setCustomSlippage("");
  };

  const handleCustomChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      onSlippageChange(numValue);
    }
  };

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Transaction Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Slippage Tolerance */}
          <div>
            <Label className="text-sm text-gray-400 mb-3 block">Slippage Tolerance</Label>

            <div className="flex gap-2 mb-3">
              {presetSlippages.map(preset => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className={`flex-1 ${
                    slippage === preset && !customSlippage
                      ? "bg-[#FF6B7A]/20 border-[#FF6B7A] text-[#FF6B7A]"
                      : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                  }`}
                >
                  {preset}%
                </Button>
              ))}

              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={e => handleCustomChange(e.target.value)}
                  className={`bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-8 ${
                    customSlippage ? "border-[#FF6B7A]" : ""
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>

            {/* Warning for high slippage */}
            {slippage > 3 && (
              <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-orange-400 font-medium">High slippage tolerance</p>
                  <p className="text-gray-400 mt-1">
                    Your transaction may be frontrun and result in an unfavorable trade.
                  </p>
                </div>
              </div>
            )}

            {/* Warning for low slippage */}
            {slippage < 0.1 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium">Low slippage tolerance</p>
                  <p className="text-gray-400 mt-1">Your transaction may fail due to price movements.</p>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Deadline */}
          <div>
            <Label className="text-sm text-gray-400 mb-3 block">Transaction Deadline</Label>

            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white w-24"
              />
              <span className="text-gray-400">minutes</span>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Your transaction will revert if it is not confirmed within this time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
