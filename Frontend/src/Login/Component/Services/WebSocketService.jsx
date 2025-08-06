class WebSocketService {
    constructor() {
        this.socket = null;
        this.listeners = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // 3 seconds
    }

    connect = () => {
        // آدرس سرور WebSocket شما
        this.socket = new WebSocket('ws://localhost:8081');

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { type } = message;

                if (this.listeners[type]) {
                    this.listeners[type].forEach(callback => callback(message));
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.reason);

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
                    this.connect();
                }, this.reconnectInterval);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
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
            this.socket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket not connected, message not sent');
            return false;
        }
    };

    addListener = (type, callback) => {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);

        // Return a cleanup function
        return () => {
            this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        };
    };

    removeListener = (type, callback) => {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        }
    };
}

// ایجاد یک نمونه واحد از سرویس WebSocket
const webSocketService = new WebSocketService();

export default webSocketService;