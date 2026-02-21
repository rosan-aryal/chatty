import { auth } from "@chat-application/auth";
import { connectionManager, type WsUserData } from "./connection-manager";
import { handleWsMessage, handleWsClose } from "./message-handler";
import { upgradeWebSocket, websocket } from "hono/bun";

export { websocket };

export const wsRoute = upgradeWebSocket(async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return {
      onOpen(_event, ws) {
        ws.close(1008, "Unauthorized");
      },
    };
  }

  const userData: WsUserData = {
    userId: session.user.id,
    gender: (session.user as any).gender,
    isPremium: (session.user as any).isPremium ?? false,
  };

  return {
    onOpen(_event, ws) {
      connectionManager.add(userData.userId, ws as any);
    },
    onMessage(event, ws) {
      handleWsMessage(ws as any, event.data as string);
    },
    onClose() {
      handleWsClose(userData.userId);
    },
  };
});
