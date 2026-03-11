'use client';
import { useState } from 'react';
import { Video, Shield, MessageCircle, ArrowRight } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 overflow-hidden">
      <nav className="w-full max-w-7xl flex justify-between items-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <Video className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CampusConnect</span>
        </div>
        <button 
          onClick={() => setIsAuthOpen(true)}
          className="glass px-6 py-2 rounded-full font-medium hover:bg-white/10 transition-colors"
        >
          Login
        </button>
      </nav>

      <div className="max-w-4xl text-center z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 heading-gradient animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Randomly Connect with <br /> College Peers.
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          The private, anonymous video chat platform exclusively for verified college students. Match, chat, and make new campus friends instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <button 
            onClick={() => setIsAuthOpen(true)}
            className="btn-primary group flex items-center gap-2"
          >
            Start Chatting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="glass px-8 py-3 rounded-full font-semibold hover:bg-white/5 transition-all">
            How it works
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mt-24 animate-in fade-in zoom-in-95 duration-1000 delay-500">
        {[
          { icon: Shield, title: "Verified Only", desc: "Access limited to students with valid @lead.ac.in emails." },
          { icon: MessageCircle, title: "Stay Anonymous", desc: "No names, no profiles. Just real conversations with peers." },
          { icon: Video, title: "HD Video Chat", desc: "Seamless WebRTC-powered video and text communication." }
        ].map((feature, i) => (
          <div key={i} className="glass p-8 rounded-3xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <feature.icon className="text-indigo-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
    </main>
  );
}
