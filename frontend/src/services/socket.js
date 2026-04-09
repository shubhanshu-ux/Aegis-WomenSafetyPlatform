import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/env";

/**
 * Shared Socket.io client (new-alert, alert-accepted, etc.).
 */
export function createSocketClient() {
  try {
    const url = SOCKET_URL || "http://localhost:4000";
    return io(url, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      timeout: 20000,
    });
  } catch (e) {
    console.warn("[BSafe] Socket.io client could not start:", e);
    return null;
  }
}

/** @deprecated use createSocketClient */
export const createVolunteerSocket = createSocketClient;
