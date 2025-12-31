"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "~~/components/ui/button";
import { Calendar as CalendarComponent } from "~~/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~~/components/ui/drawer";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~~/components/ui/form";
import { Input } from "~~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~~/components/ui/popover";
import { Switch } from "~~/components/ui/switch";
import { Textarea } from "~~/components/ui/textarea";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const formSchema = z.object({
  _name: z.string().min(1, "Campaign name is required").max(100, "Name too long"),
  _symbol: z.string().min(1, "Token symbol is required").max(10, "Symbol too long"),
  _description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  _targetFunding: z
    .string()
    .min(1, "Target funding is required")
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  _totalSupply: z
    .string()
    .min(1, "Total supply is required")
    .refine(val => !isNaN(Number(val)) && Number(val) >= 1000000, "Total supply must be at least 1,000,000 tokens"),
  _reserveRatio: z
    .string()
    .refine(
      val => !isNaN(Number(val)) && Number(val) >= 10 && Number(val) <= 90,
      "Reserve ratio must be between 10% and 90%",
    ),
  _deadline: z
    .date({
      message: "Please select a deadline date",
    })
    .refine(date => {
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      return date >= oneDayFromNow;
    }, "Deadline must be at least 1 day in the future"),
});

type FormData = z.infer<typeof formSchema>;

const CreateCampaignDrawer = () => {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "Launchpad" });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      _name: "",
      _symbol: "",
      _description: "",
      _targetFunding: "1000", // 1000 WVERY default
      _totalSupply: "10000000", // 10M tokens default
      _reserveRatio: "50", // 50% default reserve ratio
    },
  });

  const handleCreateCampaign = async (value: FormData) => {
    console.log("values", value);
    const toastId = toast.loading("Preparing campaign...", {
      position: "top-right",
    });
    try {
      // Convert reserve ratio to basis points (if needed)
      const reserveRatio = Math.floor(Number(value._reserveRatio) * 10000);

      // Convert deadline from ms to seconds (if input is a JS timestamp)
      const deadlineInSeconds = Math.floor(Number(value._deadline) / 1000);

      // Convert targetFunding and totalSupply to wei (assuming 18 decimals)
      const targetFunding = BigInt(value._targetFunding) * 10n ** 6n;
      const totalSupply = BigInt(value._totalSupply) * 10n ** 18n;

      await writeYourContractAsync(
        {
          functionName: "createCampaign",
          args: [
            value._name,
            value._symbol,
            value._description,
            targetFunding,
            totalSupply,
            reserveRatio,
            BigInt(deadlineInSeconds),
          ],
          // gas: BigInt(3_000_000),
        },
        {
          blockConfirmations: 1,
          onBlockConfirmation: () => {
            toast.success("Campaign created successfully!", {
              id: toastId,
              position: "top-right",
            });
          },
        },
      );
    } catch (e: any) {
      console.error("Error creating campaign:", e);
      toast.error(e.message || "Error creating campaign", {
        id: toastId,
        position: "top-right",
      });
    }
  };

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    handleCreateCampaign(data);
  };

  return (
    <>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            size="sm"
            className="text-white hover:text-white flex items-center bg-[#FF6B7A] hover:bg-[#FF8B7A] h-10 w-40 rounded-lg font-semibold transition-colors"
          >
            <Layers />
            New campaign
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-[#19242a] overflow-y-scroll">
          <div className="mx-auto w-full sm:min-w-sm overflow-y-scroll">
            <DrawerHeader>
              <DrawerTitle className="text-white">Create New Campaign</DrawerTitle>
              <DrawerDescription className="text-gray-400">
                Fill in the details to create your campaign token.
              </DrawerDescription>
            </DrawerHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-2 sm:px-4 pb-4 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Campaign Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter campaign name"
                            {...field}
                            className="bg-[#25333b] border-gray-600 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="_symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Token Symbol</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., CAMP"
                            {...field}
                            className="bg-[#25333b] border-gray-600 text-white placeholder:text-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your campaign..."
                            {...field}
                            className="bg-[#25333b] border-gray-600 text-white placeholder:text-gray-400 min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="_targetFunding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Target Funding</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="bg-[#25333b] border-gray-600 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="_totalSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Total Supply</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              className="bg-[#25333b] border-gray-600 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="_deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Campaign Deadline</FormLabel>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal bg-[#25333b] border-gray-600 text-white hover:bg-[#2a3940]"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-[#25333b] border-gray-600">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={date => {
                                field.onChange(date);
                                setIsCalendarOpen(false);
                              }}
                              initialFocus
                              className="text-white"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Advanced Settings Toggle */}
                <div className="flex items-center space-x-2 pt-4 border-t border-gray-600">
                  <Switch id="advanced" checked={isAdvanced} onCheckedChange={setIsAdvanced} />
                  <FormLabel htmlFor="advanced" className="text-white font-medium">
                    Advanced Settings
                  </FormLabel>
                </div>

                {/* Advanced Settings */}
                {isAdvanced && (
                  <div className="space-y-4 p-4 bg-[#25333b] rounded-lg border border-gray-600">
                    <FormField
                      control={form.control}
                      name="_reserveRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-medium">Reserve Ratio</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="10"
                              {...field}
                              className="bg-[#19242a] border-gray-500 text-white placeholder:text-gray-400"
                            />
                          </FormControl>
                          <FormDescription className="text-sm text-gray-400">
                            Default value is 10. Adjust only if you understand the implications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <DrawerFooter>
                  <Button type="submit" className="bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white transition-colors">
                    Create Campaign
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-[#25333b] bg-transparent"
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </Form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CreateCampaignDrawer;
