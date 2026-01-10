import * as signalR from '@microsoft/signalr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5072';

let connection: signalR.HubConnection | null = null;
let isConnecting = false;
let isStopped = false;

export const createSignalRConnection = () => {
  if (connection) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/code`, {
      accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
};

export const startConnection = async (): Promise<signalR.HubConnection | null> => {
  // Don't start if already connecting or if stopped
  if (isConnecting || isStopped) {
    return connection;
  }

  // Reset connection if disconnected
  if (connection && connection.state === signalR.HubConnectionState.Disconnected) {
    connection = null;
  }

  const conn = createSignalRConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      isConnecting = true;
      await conn.start();
      isConnecting = false;

      // Check if stop was called while we were connecting
      if (isStopped) {
        conn.stop().catch(() => {});
        connection = null;
        return null;
      }

      console.log('SignalR Connected');
      return conn;
    } catch (error: unknown) {
      isConnecting = false;
      // Ignore "stopped during negotiation" error - this is expected when navigating away
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('stop') && !errorMessage.includes('abort')) {
        console.error('SignalR Connection Error:', error);
      }
      connection = null;
      return null;
    }
  }

  return conn;
};

export const stopConnection = () => {
  isStopped = true;
  if (connection) {
    const conn = connection;
    connection = null;
    conn.stop().catch(() => {});
  }
};

export const resetConnectionState = () => {
  isStopped = false;
  isConnecting = false;
};

export const getConnection = () => connection;

// ===========================================
// Types matching backend DTOs
// ===========================================
export interface ConnectedUser {
  id: string;
  username: string;
  connectionId: string;
  color: string;
}

export interface CodeChange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
  rangeText: string;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface TextSelection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CodeChangedEvent {
  fileId: string;
  user: ConnectedUser;
  change: CodeChange;
  timestamp: string;
}

export interface CursorMovedEvent {
  fileId: string;
  user: ConnectedUser;
  position: CursorPosition;
}

export interface SelectionChangedEvent {
  fileId: string;
  user: ConnectedUser;
  selection: TextSelection;
}

export interface FileChangedEvent {
  changeType: 'created' | 'deleted' | 'renamed';
  user: ConnectedUser;
  file: unknown;
}

export interface ChatMessageEvent {
  user: ConnectedUser;
  message: string;
  timestamp: string;
}

// ===========================================
// Hub method wrappers
// ===========================================
export const signalRMethods = {
  // Join a project room
  joinProject: async (projectId: string) => {
    try {
      const conn = await startConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('JoinProject', projectId);
      }
    } catch (error) {
      console.error('Failed to join project:', error);
    }
  },

  // Leave a project room
  leaveProject: async (projectId: string) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('LeaveProject', projectId);
      }
    } catch (error) {
      console.error('Failed to leave project:', error);
    }
  },

  // Send code change
  sendCodeChange: async (projectId: string, fileId: string, change: CodeChange) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('SendCodeChange', projectId, fileId, change);
      }
    } catch (error) {
      console.error('Failed to send code change:', error);
    }
  },

  // Send cursor position
  sendCursorPosition: async (projectId: string, fileId: string, position: CursorPosition) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('SendCursorPosition', projectId, fileId, position);
      }
    } catch (error) {
      console.error('Failed to send cursor position:', error);
    }
  },

  // Send selection
  sendSelection: async (projectId: string, fileId: string, selection: TextSelection) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('SendSelection', projectId, fileId, selection);
      }
    } catch (error) {
      console.error('Failed to send selection:', error);
    }
  },

  // Notify file change
  notifyFileChange: async (projectId: string, changeType: string, fileInfo: unknown) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('NotifyFileChange', projectId, changeType, fileInfo);
      }
    } catch (error) {
      console.error('Failed to notify file change:', error);
    }
  },

  // Send chat message
  sendChatMessage: async (projectId: string, message: string) => {
    try {
      const conn = getConnection();
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        await conn.invoke('SendChatMessage', projectId, message);
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  },
};

// ===========================================
// Event registration (call after connection)
// ===========================================
export const registerSignalREvents = (handlers: {
  onUserJoined?: (user: ConnectedUser) => void;
  onUserLeft?: (user: ConnectedUser) => void;
  onActiveUsers?: (users: ConnectedUser[]) => void;
  onCodeChanged?: (event: CodeChangedEvent) => void;
  onCursorMoved?: (event: CursorMovedEvent) => void;
  onSelectionChanged?: (event: SelectionChangedEvent) => void;
  onFileChanged?: (event: FileChangedEvent) => void;
  onChatMessage?: (event: ChatMessageEvent) => void;
}) => {
  const conn = getConnection();
  if (!conn) return;

  if (handlers.onUserJoined) conn.on('UserJoined', handlers.onUserJoined);
  if (handlers.onUserLeft) conn.on('UserLeft', handlers.onUserLeft);
  if (handlers.onActiveUsers) conn.on('ActiveUsers', handlers.onActiveUsers);
  if (handlers.onCodeChanged) conn.on('CodeChanged', handlers.onCodeChanged);
  if (handlers.onCursorMoved) conn.on('CursorMoved', handlers.onCursorMoved);
  if (handlers.onSelectionChanged) conn.on('SelectionChanged', handlers.onSelectionChanged);
  if (handlers.onFileChanged) conn.on('FileChanged', handlers.onFileChanged);
  if (handlers.onChatMessage) conn.on('ChatMessage', handlers.onChatMessage);
};

export const unregisterSignalREvents = () => {
  const conn = getConnection();
  if (!conn) return;

  conn.off('UserJoined');
  conn.off('UserLeft');
  conn.off('ActiveUsers');
  conn.off('CodeChanged');
  conn.off('CursorMoved');
  conn.off('SelectionChanged');
  conn.off('FileChanged');
  conn.off('ChatMessage');
};
