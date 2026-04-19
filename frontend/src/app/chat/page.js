'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  SkipForward,
  LogOut,
  Send,
  Flag,
  User,
  MoreVertical,
  Video,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ]
};

export default function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [mediaError, setMediaError] = useState(null);

  // Use refs for values that shouldn't trigger re-renders but must always be current
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const partnerRef = useRef(null); // track partner in ref too to avoid stale closures

  const router = useRouter();

  // ─── Media Initialization ───────────────────────────────────────────────────
  const initMedia = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Media error:', err);
      setMediaError(err.name === 'NotAllowedError'
        ? 'Camera/Mic permission denied. Please allow access and refresh.'
        : 'Could not access camera/microphone.');
      return null;
    }
  }, []);

  // ─── Cleanup Peer Connection ─────────────────────────────────────────────────
  const cleanupPeer = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  // ─── Handle Cleanup After Session Ends ──────────────────────────────────────
  const handleCleanup = useCallback((showMessage = true) => {
    cleanupPeer();
    if (showMessage && partnerRef.current) {
      setMessages(prev => [...prev, { text: 'Partner disconnected.', isSystem: true }]);
    }
    partnerRef.current = null;
    setPartner(null);
    setIsMatching(false);
    setConnectionStatus('disconnected');
  }, [cleanupPeer]);

  // ─── WebRTC Signaling ────────────────────────────────────────────────────────
  const initiateWebRTC = useCallback(async (isInitiator) => {
    const sock = socketRef.current;
    if (!sock) return;

    cleanupPeer();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;
    setConnectionStatus('connecting');

    // Add local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Remote stream arrives
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', event.candidate);
      }
    };

    // Connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log('ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionStatus('disconnected');
      }
    };

    // ── Signaling handlers (registered fresh each session) ──
    const handleOffer = async (offer) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Flush pending ICE candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
        }
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sock.emit('answer', answer);
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    };

    const handleAnswer = async (answer) => {
      try {
        if (pc.signalingState !== 'have-local-offer') return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // Flush pending ICE candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
        }
        pendingCandidatesRef.current = [];
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    };

    const handleIceCandidate = async (candidate) => {
      try {
        if (pc.remoteDescription?.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    };

    // Remove stale listeners and add new ones
    sock.off('offer').on('offer', handleOffer);
    sock.off('answer').on('answer', handleAnswer);
    sock.off('ice-candidate').on('ice-candidate', handleIceCandidate);

    // Initiator creates and sends the offer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sock.emit('offer', offer);
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    }
  }, [cleanupPeer]);

  // ─── Socket Initialization ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Session events
    newSocket.on('matched', ({ partner: partnerData, sessionId, initiator }) => {
      console.log('Matched! initiator:', initiator);
      partnerRef.current = partnerData;
      setPartner(partnerData);
      setIsMatching(false);
      setMessages([{ text: 'You are now connected with a random student. Say hi! 👋', isSystem: true }]);
      initiateWebRTC(initiator);
    });

    newSocket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('partnerDisconnected', () => {
      handleCleanup(true);
    });

    newSocket.on('sessionEnded', ({ reason }) => {
      const text = reason === 'partner_skipped' ? 'Partner skipped.' : 'Session ended.';
      setMessages(prev => [...prev, { text, isSystem: true }]);
      handleCleanup(false);
    });

    // Start media
    initMedia();

    return () => {
      newSocket.off('matched');
      newSocket.off('receiveMessage');
      newSocket.off('partnerDisconnected');
      newSocket.off('sessionEnded');
      newSocket.off('offer');
      newSocket.off('answer');
      newSocket.off('ice-candidate');
      newSocket.disconnect();
      cleanupPeer();
      // Stop local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, []); // run once on mount

  // ─── Chat Actions ────────────────────────────────────────────────────────────
  const startChat = useCallback(() => {
    const sock = socketRef.current;
    if (!sock || !sock.connected) return;
    handleCleanup(false);
    setIsMatching(true);
    setMessages([]);
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    sock.emit('joinQueue', userData);
  }, [handleCleanup]);

  const skipChat = useCallback(() => {
    const sock = socketRef.current;
    if (!sock) return;
    sock.emit('skip');
    handleCleanup(false);
    // Rejoin queue after a short delay
    setTimeout(() => {
      setIsMatching(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      sock.emit('joinQueue', userData);
    }, 300);
  }, [handleCleanup]);

  const endChat = useCallback(() => {
    const sock = socketRef.current;
    if (sock) sock.emit('endSession');
    handleCleanup(false);
    setMessages([{ text: 'Session ended. Start a new chat anytime.', isSystem: true }]);
  }, [handleCleanup]);

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!inputText.trim() || !partnerRef.current) return;
    const msg = { text: inputText, sender: 'me', timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    socketRef.current?.emit('sendMessage', inputText);
    setInputText('');
  }, [inputText]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsCameraOn(track.enabled);
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMicOn(track.enabled);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c]">

      {/* Header */}
      <header className="px-6 py-4 glass border-b border-white/5 flex justify-between items-center z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">CampusConnect</h1>
        </div>

        <div className="flex items-center gap-4">
          {partner && (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border ${
              connectionStatus === 'connected'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
            }`}>
              {connectionStatus === 'connected'
                ? <><Wifi className="w-3.5 h-3.5" /> Connected</>
                : <><WifiOff className="w-3.5 h-3.5" /> Connecting…</>
              }
            </div>
          )}
          <button
            onClick={() => {
              if (socketRef.current) socketRef.current.disconnect();
              if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Media Error Banner */}
      {mediaError && (
        <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm text-center">
          ⚠️ {mediaError}
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 min-h-0">

        {/* Video + Controls */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">

            {/* Remote Video */}
            <div className="video-container bg-black/40 flex items-center justify-center relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ display: partner ? 'block' : 'none' }}
              />
              {!partner && (
                <div className="text-center absolute inset-0 flex items-center justify-center">
                  {isMatching ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                      <p className="text-gray-400 animate-pulse">Finding someone special…</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <User className="w-20 h-20 text-white/5 mx-auto" />
                      <button onClick={startChat} className="btn-primary">
                        Start Chat
                      </button>
                    </div>
                  )}
                </div>
              )}
              {partner && (
                <div className="absolute bottom-6 left-6 px-4 py-2 glass rounded-2xl text-sm font-medium">
                  Stranger (Student)
                </div>
              )}
            </div>

            {/* Local Video */}
            <div className="video-container bg-black/40 relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover grayscale-[0.2]"
              />
              <div className="absolute bottom-6 left-6 px-4 py-2 glass rounded-2xl text-sm font-medium">
                You
              </div>
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl glass transition-colors ${!isCameraOn ? 'text-red-500 bg-red-500/10' : 'hover:bg-white/10'}`}
                  title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl glass transition-colors ${!isMicOn ? 'text-red-500 bg-red-500/10' : 'hover:bg-white/10'}`}
                  title={isMicOn ? 'Mute mic' : 'Unmute mic'}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-center gap-4 py-2 flex-shrink-0">
            <button
              onClick={skipChat}
              disabled={!partner && !isMatching}
              className="glass px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-5 h-5" /> SKIP
            </button>
            <button
              onClick={endChat}
              disabled={!partner}
              className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              STOP
            </button>
            <button
              className="glass p-4 rounded-2xl text-gray-400 hover:text-red-400 transition-colors"
              title="Report user"
            >
              <Flag className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-[380px] flex flex-col glass-dark rounded-3xl overflow-hidden border border-white/5 flex-shrink-0">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="font-bold">Live Chat</h3>
            <button className="text-gray-500 hover:text-white">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm mt-8">
                Start a chat and messages will appear here.
              </div>
            )}
            {messages.map((msg, i) =>
              msg.isSystem ? (
                <div key={i} className="text-center py-2">
                  <span className="text-xs text-gray-500 px-3 py-1 rounded-full bg-white/5">
                    {msg.text}
                  </span>
                </div>
              ) : (
                <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'me'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'glass text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/5 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={partner ? 'Type a message…' : 'Connect with someone first…'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!partner}
                className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!partner || !inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors disabled:opacity-30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
