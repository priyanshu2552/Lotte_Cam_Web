import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3000', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket'],
            withCredentials: true,
            extraHeaders: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        socketInstance.on('connect', () => {
            console.log("✅ [WebSocket] Connected with ID:", socketInstance.id);
        });

        socketInstance.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                socketInstance.connect();
            }
            console.log("❌ [WebSocket] Disconnected:", reason);
        });

        socketInstance.on('connect_error', (error) => {
            console.log("❌ [WebSocket] Connection Error:", error);
            setTimeout(() => {
                socketInstance.connect();
            }, 1000);
        });

        setSocket(socketInstance);

        return () => {
            if (socketInstance.connected) {
                console.log("🧹 [WebSocket] Gracefully disconnecting");
                socketInstance.removeAllListeners();
                socketInstance.disconnect();
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={socket}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => useContext(WebSocketContext);