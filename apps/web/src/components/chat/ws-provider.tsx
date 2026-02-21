"use client";

import { useWebSocket } from "@/hooks/use-websocket";

export function WsProvider({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}
