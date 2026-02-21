"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import { TooltipProvider } from "./ui/tooltip";
import { queryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
