
type MessageHandler = (message: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string = '';
  private shouldReconnect: boolean = true;

  connect(url?: string) {
    this.url = url || this.getWebSocketUrl();

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Enable reconnection for new connections
    this.shouldReconnect = true;

    // Close existing connection before creating new one
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private   scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      if (this.url) {
        this.connect(this.url);
      }
    }, 3000);
  }

  // Get WebSocket URL from environment variables
  private getWebSocketUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Only close if the connection is actually open or connecting
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);

    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const wsManager = new WebSocketManager();
