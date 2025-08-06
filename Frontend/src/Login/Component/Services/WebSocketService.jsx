class WebSocketService {
    constructor() {
        this.socket = null;
        this.generalListeners = []; // Changed to an array to support multiple listeners
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 3000;
    }

    connect = () => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('🔌 WebSocket is already connected.');
            return;
        }

        this.socket = new WebSocket('ws://localhost:8081');
        console.log('🔌 Attempting to connect to WebSocket...');

        this.socket.onopen = () => {
            console.log('✅ WebSocket connected successfully!');
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            console.log('📬 [RAW MESSAGE FROM SERVER]:', event.data);
            // --- Execute ALL general listeners ---
            this.generalListeners.forEach(callback => callback(event.data));
        };

        this.socket.onclose = (event) => {
            console.log(`🔌 WebSocket disconnected. Reason: ${event.reason || 'No reason given'}. Code: ${event.code}`);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`🔁 Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                    this.connect();
                }, this.reconnectInterval);
            } else {
                console.error('🚫 Max reconnect attempts reached.');
            }
        };

        this.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
    };
    
    disconnect = () => {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    };

    send = (message) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const jsonMessage = JSON.stringify(message);
            console.log('🚀 [MESSAGE SENT TO SERVER]:', jsonMessage);
            this.socket.send(jsonMessage);
            return true;
        } else {
            console.warn('⚠️ WebSocket not connected. Message not sent:', message);
            this.connect(); 
            return false;
        }
    };
    
    // This function adds a listener that hears ALL messages
    addGeneralListener = (callback) => {
        this.generalListeners.push(callback);
        // Return a cleanup function to remove the listener
        return () => {
            this.generalListeners = this.generalListeners.filter(cb => cb !== callback);
        };
    };
}

const webSocketService = new WebSocketService();
export default webSocketService;
