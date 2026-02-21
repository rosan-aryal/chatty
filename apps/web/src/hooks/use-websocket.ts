"use client";

import { useEffect, useRef } from "react";
import { wsClient } from "@/lib/ws-client";

export function useWebSocket() {
  const connected = useRef(false);

  useEffect(() => {
    if (!connected.current) {
      wsClient.connect();
      connected.current = true;
    }
  }, []);

  return {
    send: wsClient.send.bind(wsClient),
    on: wsClient.on.bind(wsClient),
    disconnect: wsClient.disconnect.bind(wsClient),
  };
}
