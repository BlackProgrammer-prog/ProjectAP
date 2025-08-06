class WebSocketService {
    constructor() {
        this.socket = null;
        this.generalListeners = [];
        this.messageQueue = []; // The queue for messages sent before connection is ready
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectInterval = 3000;
    }

    connect = () => {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            // console.log('🔌 WebSocket is already connected or connecting.');
            return;
        }

        this.socket = new WebSocket('ws://localhost:8081');
        console.log('🔌 Attempting to connect to WebSocket...');

        this.socket.onopen = () => {
            console.log('✅ WebSocket connected successfully!');
            this.reconnectAttempts = 0;
            // --- Process the message queue ---
            this.processMessageQueue();
        };

        this.socket.onmessage = (event) => {
            console.log('📬 [RAW MESSAGE FROM SERVER]:', event.data);
            this.generalListeners.forEach(callback => callback(event.data));
        };

        this.socket.onclose = (event) => {
            console.log(`🔌 WebSocket disconnected. Code: ${event.code}`);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    console.log(`🔁 Reconnecting... attempt ${this.reconnectAttempts}`);
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

    // New method to send all queued messages
    processMessageQueue = () => {
        console.log(`Processing message queue... ${this.messageQueue.length} message(s) to send.`);
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift(); // Get the first message in the queue
            this.send(message, true); // Send it, force bypass queueing
        }
    };
    
    send = (message, force = false) => {
        // If we are forcing the send (from the queue processor), or if the socket is open
        if (force || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
            try {
                const jsonMessage = JSON.stringify(message);
                console.log('🚀 [MESSAGE SENT TO SERVER]:', jsonMessage);
                this.socket.send(jsonMessage);
                return true;
            } catch (error) {
                 console.error('❌ Failed to send message:', error);
                 this.messageQueue.unshift(message); // Put it back at the front of the queue
                 return false;
            }
        } else {
            // If the socket is not ready, queue the message
            console.warn('⚠️ WebSocket not ready. Queuing message:', message);
            this.messageQueue.push(message);
            // And attempt to connect if not already doing so
            if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
                this.connect();
            }
            return false;
        }
    };

    addGeneralListener = (callback) => {
        this.generalListeners.push(callback);
        return () => {
            this.generalListeners = this.generalListeners.filter(cb => cb !== callback);
        };
    };

    disconnect = () => {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    };
}

const webSocketService = new WebSocketService();
export default webSocketService;
