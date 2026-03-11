'use client';
import { useEffect, useRef, useState } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const chatEndRef = useRef();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user'));
    const newSocket = io(SOCKET_URL, {
        auth: { token }
    });

    setSocket(newSocket);

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    initMedia();

    return () => {
      newSocket.disconnect();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('matched', async ({ partner, sessionId, initiator }) => {
      console.log('Matched with:', partner, 'Initiator:', initiator);
      setPartner(partner);
      setIsMatching(false);
      setMessages([{ text: 'You are now chatting with a random student.', isSystem: true }]);
      
      initiateWebRTC(initiator);
    });

    socket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('partnerDisconnected', () => {
        handleCleanup();
    });

    socket.on('sessionEnded', () => {
        handleCleanup();
    });

    return () => {
        socket.off('matched');
        socket.off('receiveMessage');
        socket.off('partnerDisconnected');
        socket.off('sessionEnded');
    };
  }, [socket, localStream]);

  const initiateWebRTC = async (isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    socket.on('offer', async (offer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', answer);
    });

    socket.on('answer', async (answer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async (candidate) => {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', offer);
    }

    setPeerConnection(pc);
  };

  const startChat = () => {
    setIsMatching(true);
    setPartner(null);
    setRemoteStream(null);
    setMessages([]);
    const userData = JSON.parse(localStorage.getItem('user'));
    socket.emit('joinQueue', userData);
  };

  const skipChat = () => {
    socket.emit('skip');
    handleCleanup();
    startChat();
  };

  const endChat = () => {
      socket.emit('endSession');
      handleCleanup();
  };

  const handleCleanup = () => {
    if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
    }
    setRemoteStream(null);
    setPartner(null);
    setMessages(prev => [...prev, { text: 'Partner disconnected.', isSystem: true }]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !partner) return;

    const msg = { text: inputText, sender: 'me', timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    socket.emit('sendMessage', inputText);
    setInputText('');
  };

  const toggleCamera = () => {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
  };

  const toggleMic = () => {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0c]">
      {/* Header */}
      <header className="px-6 py-4 glass border-b border-white/5 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Video className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">CampusConnect</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {partner && (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </div>
          )}
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/');
            }}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Main Video Section */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Remote Video */}
            <div className="video-container bg-black/40 flex items-center justify-center">
              {remoteStream ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  {isMatching ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                      <p className="text-gray-400">Finding someone special...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <User className="w-20 h-20 text-white/5 mx-auto" />
                       <button onClick={startChat} className="btn-primary">Start Chat</button>
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
            <div className="video-container bg-black/40">
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
              
              {/* Controls */}
              <div className="absolute bottom-6 right-6 flex gap-2">
                <button 
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl glass hover:bg-white/10 transition-colors ${!isCameraOn && 'text-red-500 bg-red-500/10'}`}
                >
                  {isCameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
                <button 
                   onClick={toggleMic}
                   className={`p-3 rounded-2xl glass hover:bg-white/10 transition-colors ${!isMicOn && 'text-red-500 bg-red-500/10'}`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-center gap-4 py-2">
            <button 
                onClick={skipChat}
                className="glass px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all text-indigo-400"
            >
              <SkipForward className="w-5 h-5" /> SKIP
            </button>
            <button 
                onClick={endChat}
                className="bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all"
            >
              STOP
            </button>
            <button className="glass p-4 rounded-2xl text-gray-400 hover:text-red-400 transition-colors">
              <Flag className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-[400px] flex flex-col glass-dark rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="font-bold">Live Chat</h3>
            <button className="text-gray-500 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
               msg.isSystem ? (
                 <div key={i} className="text-center py-2">
                    <span className="text-xs text-gray-500 px-3 py-1 rounded-full bg-white/5">{msg.text}</span>
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
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/5">
            <div className="relative">
              <input 
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-600"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-colors"
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
