'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { TerminalSquare, X, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  projectId: string;
  isVisible: boolean;
  onClose: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
}

export default function Terminal({
  projectId,
  isVisible,
  onClose,
  onToggleMaximize,
  isMaximized = false
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const onDataDisposableRef = useRef<{ dispose: () => void } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const getThemeColors = useCallback(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      background: isDark ? '#1a1b26' : '#ffffff',
      foreground: isDark ? '#c0caf5' : '#1a1b26',
      cursor: isDark ? '#c0caf5' : '#1a1b26',
      cursorAccent: isDark ? '#1a1b26' : '#ffffff',
      selectionBackground: isDark ? 'rgba(122, 162, 247, 0.3)' : 'rgba(26, 27, 38, 0.2)',
      black: isDark ? '#15161e' : '#1a1b26',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: isDark ? '#a9b1d6' : '#1a1b26',
      brightBlack: isDark ? '#414868' : '#4e5173',
      brightRed: '#f7768e',
      brightGreen: '#9ece6a',
      brightYellow: '#e0af68',
      brightBlue: '#7aa2f7',
      brightMagenta: '#bb9af7',
      brightCyan: '#7dcfff',
      brightWhite: isDark ? '#c0caf5' : '#1a1b26',
    };
  }, []);

  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      theme: getThemeColors(),
      allowProposedApi: true,
      scrollback: 1000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Gerer le redimensionnement
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {}
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [getThemeColors]);

  const connectToHub = useCallback(async (isManualRetry = false) => {
    if (connectionRef.current?.state === 'Connected' || isConnecting) return;

    // Si connexion echouee et pas une tentative manuelle, ne pas reessayer
    if (connectionFailed && !isManualRetry) return;

    // Verifier le nombre de tentatives
    if (!isManualRetry && retryCountRef.current >= maxRetries) {
      setConnectionFailed(true);
      xtermRef.current?.writeln('\r\n\x1b[31mNombre maximum de tentatives atteint. Cliquez sur le bouton rafraichir pour reessayer.\x1b[0m');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      xtermRef.current?.writeln('\r\n\x1b[31mErreur: Non authentifie. Veuillez vous reconnecter.\x1b[0m');
      setConnectionFailed(true);
      return;
    }

    setIsConnecting(true);
    if (isManualRetry) {
      retryCountRef.current = 0;
      setConnectionFailed(false);
    }

    try {
      const connection = new HubConnectionBuilder()
        .withUrl(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/hubs/terminal`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(LogLevel.Warning)
        .build();

      // Gerer les evenements du terminal
      connection.on('TerminalOutput', (output: string) => {
        xtermRef.current?.write(output);
      });

      connection.on('TerminalError', (error: string) => {
        xtermRef.current?.write(`\x1b[31m${error}\x1b[0m`);
      });

      connection.on('TerminalExit', (exitCode: number) => {
        xtermRef.current?.writeln(`\r\n\x1b[33mProcessus termine avec le code: ${exitCode}\x1b[0m`);
        setIsConnected(false);
      });

      connection.on('TerminalReady', (info: { sessionId: string; workingDirectory: string; shell: string }) => {
        console.log('Terminal ready:', info);
      });

      connection.on('TerminalClosed', () => {
        xtermRef.current?.writeln('\r\n\x1b[33mSession terminale fermee.\x1b[0m');
        setIsConnected(false);
      });

      connection.onreconnecting(() => {
        xtermRef.current?.writeln('\r\n\x1b[33mReconnexion en cours...\x1b[0m');
      });

      connection.onreconnected(() => {
        xtermRef.current?.writeln('\r\n\x1b[32mReconnecte!\x1b[0m\r\n');
        connection.invoke('CreateSession', projectId);
      });

      connection.onclose(() => {
        setIsConnected(false);
        xtermRef.current?.writeln('\r\n\x1b[31mConnexion perdue.\x1b[0m');
      });

      await connection.start();
      connectionRef.current = connection;

      // Creer la session terminal
      await connection.invoke('CreateSession', projectId);

      // Dispose previous onData handler if exists
      if (onDataDisposableRef.current) {
        onDataDisposableRef.current.dispose();
        onDataDisposableRef.current = null;
      }

      // Gerer l'input utilisateur
      if (xtermRef.current) {
        onDataDisposableRef.current = xtermRef.current.onData((data) => {
          if (connection.state === 'Connected') {
            // Envoyer chaque caractere au terminal
            connection.invoke('SendInput', projectId, data);
          }
        });
      }

      setIsConnected(true);
      retryCountRef.current = 0;
      setConnectionFailed(false);
    } catch (error) {
      console.error('Terminal connection error:', error);
      retryCountRef.current++;

      if (retryCountRef.current >= maxRetries) {
        setConnectionFailed(true);
        xtermRef.current?.writeln(`\r\n\x1b[31mErreur de connexion apres ${maxRetries} tentatives. Verifiez que le serveur est demarre.\x1b[0m`);
        xtermRef.current?.writeln('\x1b[33mCliquez sur le bouton rafraichir pour reessayer.\x1b[0m');
      } else {
        xtermRef.current?.writeln(`\r\n\x1b[31mErreur de connexion (tentative ${retryCountRef.current}/${maxRetries})\x1b[0m`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [projectId, isConnecting, connectionFailed]);

  const disconnectFromHub = useCallback(async () => {
    // Dispose onData handler
    if (onDataDisposableRef.current) {
      onDataDisposableRef.current.dispose();
      onDataDisposableRef.current = null;
    }

    if (connectionRef.current) {
      try {
        await connectionRef.current.invoke('CloseSession', projectId);
        await connectionRef.current.stop();
      } catch {}
      connectionRef.current = null;
      setIsConnected(false);
    }
  }, [projectId]);

  const handleReconnect = useCallback(async () => {
    xtermRef.current?.clear();
    await disconnectFromHub();
    await connectToHub(true); // true = manual retry
  }, [disconnectFromHub, connectToHub]);

  // Initialiser le terminal quand visible
  useEffect(() => {
    if (isVisible) {
      const cleanup = initTerminal();
      return () => {
        cleanup?.();
      };
    }
  }, [isVisible, initTerminal]);

  // Connecter au hub apres initialisation (une seule fois)
  useEffect(() => {
    if (isVisible && xtermRef.current && !isConnected && !isConnecting && !connectionFailed) {
      connectToHub();
    }
  }, [isVisible, isConnected, isConnecting, connectionFailed, connectToHub]);

  // Nettoyer a la fermeture
  useEffect(() => {
    return () => {
      // Dispose onData handler
      if (onDataDisposableRef.current) {
        onDataDisposableRef.current.dispose();
        onDataDisposableRef.current = null;
      }
      disconnectFromHub();
      xtermRef.current?.dispose();
      xtermRef.current = null;
    };
  }, [disconnectFromHub]);

  // Refitter quand la taille change
  useEffect(() => {
    if (isVisible && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 100);
    }
  }, [isVisible, isMaximized]);

  // Observer les changements de theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (xtermRef.current) {
        xtermRef.current.options.theme = getThemeColors();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [getThemeColors]);

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-l border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2">
          <TerminalSquare className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Terminal</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Connecte" />
          )}
          {isConnecting && (
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Connexion..." />
          )}
          {connectionFailed && !isConnecting && (
            <span className="w-2 h-2 rounded-full bg-red-500" title="Connexion echouee" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReconnect}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
            title="Reconnecter"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${isConnecting ? 'animate-spin' : ''}`} />
          </button>
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
              title={isMaximized ? 'Reduire' : 'Agrandir'}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Terminal container */}
      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-hidden"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
}
