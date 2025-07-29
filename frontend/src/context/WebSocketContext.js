import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    // In your WebSocketProvider component
useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        transports: ['websocket'], // Force WebSocket transport only
        withCredentials: true,
        extraHeaders: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });

    // Debug listeners
    socketInstance.on('connect', () => {
        console.log("✅ [WebSocket] Connected with ID:", socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
        console.log("❌ [WebSocket] Disconnected:", reason);
    });

    socketInstance.on('connect_error', (error) => {
        console.log("❌ [WebSocket] Connection Error:", error);
    });

    socketInstance.on('error', (error) => {
        console.log("❌ [WebSocket] Error:", error);
    });

    socketInstance.onAny((event, ...args) => {
        console.log(`📢 [WebSocket] Received ${event}:`, args);
    });

    setSocket(socketInstance);
    
    return () => {
        console.log("🧹 [WebSocket] Cleaning up connection");
        socketInstance.disconnect();
    };
}, []);

    return (<WebSocketContext.Provider value={socket}>
        {children}
    </WebSocketContext.Provider>
    );
};
export const useWebSocket=()=>useContext(WebSocketContext);