"use client";

import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/dialog";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionHash?: string;
  status?: "pending" | "success" | "error";
}

export function TransactionModal({ open, onOpenChange, transactionHash, status = "success" }: TransactionModalProps) {
  const explorerUrl = transactionHash ? `https://explorer.very.network/tx/${transactionHash}` : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {status === "pending" && "Transaction Pending"}
            {status === "success" && "Transaction Successful"}
            {status === "error" && "Transaction Failed"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {status === "pending" ? (
            <Loader2 className="h-16 w-16 text-[#FF6B7A] animate-spin mb-4" />
          ) : status === "success" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <CheckCircle className="h-16 w-16 text-green-400 mb-4" />
            </motion.div>
          ) : null}

          <p className="text-gray-400 text-center mb-6">
            {status === "pending" && "Your transaction is being processed..."}
            {status === "success" && "Your swap has been completed successfully!"}
            {status === "error" && "Something went wrong. Please try again."}
          </p>

          {transactionHash && (
            <div className="w-full space-y-3">
              <Button
                variant="outline"
                className="w-full bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600"
                onClick={() => window.open(explorerUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>

              <Button onClick={() => onOpenChange(false)} className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
