import * as signalR from '@microsoft/signalr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let connection: signalR.HubConnection | null = null;

export const createSignalRConnection = () => {
  if (connection) {
    return connection;
  }

  const token = localStorage.getItem('accessToken');

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/code`, {
      accessTokenFactory: () => token || '',
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const startConnection = async () => {
  const conn = createSignalRConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log('SignalR Connected');
    } catch (error) {
      console.error('SignalR Connection Error:', error);
      throw error;
    }
  }

  return conn;
};

export const stopConnection = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
    connection = null;
  }
};

export const getConnection = () => connection;

// ===========================================
// SignalR Events
// ===========================================
export interface CodeChangeEvent {
  fileId: string;
  userId: string;
  username: string;
  content: string;
  position: { line: number; column: number };
}

export interface UserJoinedEvent {
  userId: string;
  username: string;
  avatar?: string;
}

export interface CursorMoveEvent {
  fileId: string;
  userId: string;
  username: string;
  position: { line: number; column: number };
}

// Hub method wrappers
export const signalRMethods = {
  // Join a project room
  joinProject: async (projectId: string) => {
    const conn = await startConnection();
    await conn.invoke('JoinProject', projectId);
  },

  // Leave a project room
  leaveProject: async (projectId: string) => {
    const conn = getConnection();
    if (conn) {
      await conn.invoke('LeaveProject', projectId);
    }
  },

  // Send code change
  sendCodeChange: async (projectId: string, fileId: string, content: string, position: { line: number; column: number }) => {
    const conn = getConnection();
    if (conn) {
      await conn.invoke('SendCodeChange', projectId, fileId, content, position);
    }
  },

  // Send cursor position
  sendCursorMove: async (projectId: string, fileId: string, position: { line: number; column: number }) => {
    const conn = getConnection();
    if (conn) {
      await conn.invoke('SendCursorMove', projectId, fileId, position);
    }
  },

  // Event listeners
  onCodeChange: (callback: (event: CodeChangeEvent) => void) => {
    const conn = getConnection();
    if (conn) {
      conn.on('ReceiveCodeChange', callback);
    }
  },

  onUserJoined: (callback: (event: UserJoinedEvent) => void) => {
    const conn = getConnection();
    if (conn) {
      conn.on('UserJoined', callback);
    }
  },

  onUserLeft: (callback: (userId: string) => void) => {
    const conn = getConnection();
    if (conn) {
      conn.on('UserLeft', callback);
    }
  },

  onCursorMove: (callback: (event: CursorMoveEvent) => void) => {
    const conn = getConnection();
    if (conn) {
      conn.on('ReceiveCursorMove', callback);
    }
  },

  // Remove listeners
  offCodeChange: () => {
    const conn = getConnection();
    if (conn) {
      conn.off('ReceiveCodeChange');
    }
  },

  offUserJoined: () => {
    const conn = getConnection();
    if (conn) {
      conn.off('UserJoined');
    }
  },

  offUserLeft: () => {
    const conn = getConnection();
    if (conn) {
      conn.off('UserLeft');
    }
  },
};
