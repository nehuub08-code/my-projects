import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Mail, 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  ShieldCheck,
  Moon,
  Sun,
  Lock,
  Smartphone,
  ChevronRight,
  Info,
  Clock,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { classifier } from './lib/classifier';
import { AppState, UserProfile, AppNotification } from './types';

// Assets (Using Picsum for realistic avatars)
const DEFAULT_AVATAR = "https://picsum.photos/seed/user123/100/100";

// Sound Effects Simulation (Using synth to avoid external dependencies)
const playSound = (type: 'spam' | 'ham') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'spam') {
      // Alert sound: high to low slide
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } else {
      // Success sound: low to high chirp
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function App() {
  const [state, setState] = useState<AppState>({
    isDarkMode: true,
    isLoggedIn: false,
    currentUser: null,
    notifications: [],
    stats: {
      totalScanned: 1240,
      spamDetected: 432,
      hamDetected: 808
    },
    permissions: {
      gmail: false,
      notifications: true,
      mobileSync: false
    }
  });

  const [inputEmail, setInputEmail] = useState("");
  const [classification, setClassification] = useState<{isSpam: boolean, confidence: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeWindow, setActiveWindow] = useState<'dashboard' | 'checker' | 'settings' | 'permissions' | 'history'>('dashboard');
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [showArrivalToast, setShowArrivalToast] = useState(false);

  // Login handler
  const handleLogin = (e: React.FormEvent, email: string) => {
    e.preventDefault();
    const mockUser: UserProfile = {
      username: email.split('@')[0],
      email: email,
      avatar: DEFAULT_AVATAR,
      role: 'Admin'
    };
    setState(prev => ({ ...prev, isLoggedIn: true, currentUser: mockUser }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, isLoggedIn: false, currentUser: null }));
  };

  // Simulation: Incoming notification after login
  useEffect(() => {
    if (state.isLoggedIn && state.permissions.mobileSync) {
      const timer = setTimeout(() => {
        setShowArrivalToast(true);
        const arrivalNotif: AppNotification = {
          id: 'phone-alert-' + Date.now(),
          title: "Intrusion Alert!",
          message: "A suspicious background packet was detected from an unknown source. Redirecting to analyzer...",
          type: 'spam',
          timestamp: new Date()
        };
        setState(prev => ({ 
          ...prev, 
          notifications: [arrivalNotif, ...prev.notifications],
        }));
        
        // Auto-redirect to checker after showing toast
        setTimeout(() => {
            setActiveWindow('checker');
            setInputEmail("PHISHING ALERT: Your PayPal account has been limited. Please click here to verify: http://ppal-security-update.net/verify-login?id=9281");
            setShowArrivalToast(false);
        }, 3000);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [state.isLoggedIn, state.permissions.mobileSync]);

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const checkSpam = () => {
    if (!inputEmail.trim()) return;
    setIsProcessing(true);
    setClassification(null);
    setScanSteps(["Initializing..."]);
    
    const steps = [
      "Decomposing text structure...",
      "Matching against local Bayes dataset...",
      "Analyzing suspicious keywords...",
      "Finalizing risk assessment..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setScanSteps(prev => [...prev, steps[stepIdx]]);
        stepIdx++;
      } else {
        clearInterval(interval);
        const result = classifier.classify(inputEmail);
        setClassification(result);
        setIsProcessing(false);
        playSound(result.isSpam ? 'spam' : 'ham');

        // Add to notifications
        const newNotif: AppNotification = {
          id: Math.random().toString(36).substr(2, 9),
          title: result.isSpam ? "Spam Blocked" : "Email Verified",
          message: result.isSpam ? "We caught a phishing attempt. Stay safe!" : "This message cleared our local security filters.",
          type: result.isSpam ? 'spam' : 'ham',
          timestamp: new Date(),
          ...({ isNew: true } as any)
        };
        
        setState(prev => ({ 
          ...prev, 
          notifications: [newNotif, ...prev.notifications],
          stats: {
            ...prev.stats,
            totalScanned: prev.stats.totalScanned + 1,
            spamDetected: result.isSpam ? prev.stats.spamDetected + 1 : prev.stats.spamDetected,
            hamDetected: !result.isSpam ? prev.stats.hamDetected + 1 : prev.stats.hamDetected
          }
        }));

        // Remove the 'isNew' flag after some time for toast disappearance
        setTimeout(() => {
          setState(p => ({
            ...p,
            notifications: p.notifications.map(n => n.id === newNotif.id ? { ...n, isNew: false } : n)
          }));
        }, 5000);
      }
    }, 600);
  };

  const requestGmailPermission = () => {
    setState(prev => ({ 
      ...prev, 
      permissions: { ...prev.permissions, gmail: true, mobileSync: true }
    }));
    setActiveWindow('dashboard');
  };

  if (!state.isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-hidden font-sans ${state.isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* Desktop Shell Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full ${state.isDarkMode ? 'bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_-20%,#3b82f644,transparent_50%)]'}`}></div>
      </div>

      {/* Taskbar / Header */}
      <header className={`fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50 backdrop-blur-md border-b ${state.isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg">SpamShield <span className="text-blue-500">Desktop</span></span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="toggle-dark-mode"
            onClick={toggleDarkMode}
            className={`p-2 rounded-full hover:bg-slate-400/10 transition-colors cursor-pointer`}
          >
            {state.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <div className="h-6 w-[1px] bg-slate-700/30 mx-2"></div>
          
          <div className="flex items-center gap-3 pr-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-tight">{state.currentUser?.username}</p>
              <p className="text-[10px] opacity-60 leading-tight">{state.currentUser?.role}</p>
            </div>
            <img 
              id="user-profile-icon"
              src={state.currentUser?.avatar} 
              alt="Avatar" 
              className="w-9 h-9 rounded-full ring-2 ring-blue-500/30 object-cover"
              referrerPolicy="no-referrer"
            />
            <button 
              id="logout-button"
              onClick={handleLogout}
              className="p-2 ml-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed left-0 top-14 bottom-0 w-16 sm:w-64 flex flex-col pt-6 z-40 border-r ${state.isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="px-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeWindow === 'dashboard'} 
            onClick={() => setActiveWindow('dashboard')} 
            dark={state.isDarkMode} 
          />
          <NavItem 
            icon={<Mail className="w-5 h-5" />} 
            label="Spam Checker" 
            active={activeWindow === 'checker'} 
            onClick={() => setActiveWindow('checker')} 
            dark={state.isDarkMode} 
          />
          <NavItem 
            icon={<Clock className="w-5 h-5" />} 
            label="Scan History" 
            active={activeWindow === 'history'} 
            onClick={() => setActiveWindow('history')} 
            dark={state.isDarkMode} 
          />
          <NavItem 
            icon={<Smartphone className="w-5 h-5" />} 
            label="Device Connect" 
            active={activeWindow === 'permissions'} 
            onClick={() => setActiveWindow('permissions')} 
            dark={state.isDarkMode} 
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Configuration" 
            active={activeWindow === 'settings'} 
            onClick={() => setActiveWindow('settings')} 
            dark={state.isDarkMode} 
          />
        </div>

        <div className="mt-auto p-4">
          <div className={`p-4 rounded-xl border ${state.isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} hidden sm:block shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">System Status</span>
            </div>
            <p className="text-xs font-semibold">Protection Active</p>
            <div className="mt-2 h-1.5 w-full bg-slate-700/30 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[94%]"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Window Shell) */}
      <main className="ml-16 sm:ml-64 pt-14 h-screen overflow-y-auto relative bg-transparent">
        <AnimatePresence mode="wait">
          {activeWindow === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tight">Security Intel</h2>
                  <p className="opacity-50 font-medium">Monitoring local heuristics and packet streams.</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40 leading-none mb-1">Protection</p>
                    <p className="text-sm font-bold leading-none">ACTIVE & OPTIMIZED</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatBox label="Total Scanned" count={state.stats.totalScanned} color="blue" isDarkMode={state.isDarkMode} icon={<Search className="w-5 h-5"/>} />
                <StatBox label="Spam Blocked" count={state.stats.spamDetected} color="red" isDarkMode={state.isDarkMode} icon={<Trash2 className="w-5 h-5"/>} />
                <StatBox label="Legitimate" count={state.stats.hamDetected} color="green" isDarkMode={state.isDarkMode} icon={<CheckCircle2 className="w-5 h-5"/>} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`p-8 rounded-[40px] border relative overflow-hidden group ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                  <h3 className="text-xl font-black mb-6">Device Link Status</h3>
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${state.permissions.mobileSync ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold">{state.permissions.mobileSync ? "Phone Connected" : "No Phone Found"}</p>
                      <p className="text-xs opacity-50">{state.permissions.mobileSync ? "Synchronizing real-time pings" : "Sync disabled in permissions"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveWindow('permissions')}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    Sync Settings <ArrowRight className="w-4 h-4" />
                  </button>
                  <ShieldCheck className="absolute -bottom-8 -right-8 w-40 h-40 opacity-5 -rotate-12" />
                </div>

                <div className={`p-8 rounded-[40px] border ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                  <h3 className="text-xl font-black mb-6">Recent Alerts</h3>
                  <div className="space-y-4">
                    {state.notifications.slice(0, 3).map(n => (
                      <div key={n.id} className="flex gap-4 items-start p-3 rounded-2xl hover:bg-slate-500/5 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'spam' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                          {n.type === 'spam' ? <Trash2 className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{n.title}</p>
                          <p className="text-xs opacity-50 truncate">{n.message}</p>
                        </div>
                        <span className="text-[10px] opacity-30 mt-1">{n.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ))}
                    <button onClick={() => setActiveWindow('history')} className="w-full pt-2 text-xs font-black uppercase opacity-40 hover:opacity-100 transition-opacity">View All Records</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeWindow === 'checker' && (
            <motion.div 
              key="checker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 sm:p-8 max-w-5xl mx-auto"
            >
              <div id="main-application-window" className={`rounded-3xl border shadow-2xl overflow-hidden ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Window Controls */}
                <div className={`px-5 py-3 border-b flex items-center justify-between ${state.isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-4">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold opacity-60 flex items-center gap-2 tracking-wide uppercase">
                      <Mail className="w-3 h-3" />
                      Heuristic Engine Terminal
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-10">
                  <h3 className="text-2xl font-black mb-6 tracking-tight">Pattern Laboratory</h3>
                  <div className="relative group">
                    <textarea 
                      id="email-input-box"
                      value={inputEmail}
                      onChange={(e) => setInputEmail(e.target.value)}
                      placeholder="Paste suspicious text payload for heuristic decomposition..."
                      className={`w-full h-56 sm:h-64 p-6 rounded-2xl outline-none border-2 transition-all resize-none font-medium leading-relaxed ${
                        state.isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 placeholder:text-slate-500' 
                          : 'bg-slate-50 border-slate-100 focus:border-blue-400 placeholder:text-slate-400'
                      }`}
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => { setInputEmail(""); setClassification(null); }}
                        className="p-2 rounded-lg bg-slate-500/10 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                        title="Reset Shell"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                      <button 
                        id="check-spam-button"
                        onClick={checkSpam}
                        disabled={isProcessing || !inputEmail.trim()}
                        className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isProcessing ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 text-white shadow-blue-600/20'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            Run Scan
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex-1 max-w-sm">
                       <AnimatePresence>
                          {isProcessing && (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-1">
                               {scanSteps.map((step, i) => (
                                 <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    {step}
                                 </div>
                               ))}
                            </motion.div>
                          )}
                       </AnimatePresence>

                       <AnimatePresence>
                        {classification && !isProcessing && (
                          <motion.div 
                            id="result-display"
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 w-full ${
                              classification.isSpam 
                                ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                                : 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                            }`}
                          >
                            {classification.isSpam ? (
                              <AlertTriangle className="w-8 h-8 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-8 h-8 shrink-0" />
                            )}
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Heuristic Out</p>
                              <h4 className="text-2xl font-black leading-none">
                                {classification.isSpam ? "THREAT_SPAM" : "VERIFIED_HAM"}
                              </h4>
                              <p className="text-xs opacity-80 mt-1 font-bold">
                                Confidence: {(classification.confidence * 100).toFixed(2)}%
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeWindow === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6"
            >
              <h2 className="text-3xl font-black tracking-tight">Scan Repository</h2>
              <div className={`rounded-3xl border overflow-hidden ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
                <table className="w-full text-left">
                  <thead className={`text-[10px] font-black uppercase tracking-widest opacity-40 border-b ${state.isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4 uppercase">Status</th>
                      <th className="px-6 py-4 uppercase">Detection</th>
                      <th className="px-6 py-4 uppercase">Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-medium">
                    {state.notifications.filter(n => n.type !== 'system').map(n => (
                      <tr key={n.id} className={`border-b transition-colors ${state.isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 opacity-50">{n.timestamp.toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${n.type === 'spam' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                              {n.type === 'spam' ? 'THREAT' : 'SECURE'}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-bold">{n.title}</td>
                        <td className="px-6 py-4 opacity-40 truncate max-w-xs">{n.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeWindow === 'permissions' && (
            <motion.div 
              key="permissions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8 max-w-xl mx-auto mt-12"
            >
              <div className={`rounded-[40px] border shadow-2xl p-10 text-center ${state.isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="w-24 h-24 bg-blue-600 rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-blue-600/30 rotate-6 hover:rotate-0 transition-transform">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tight">System Connectivity</h2>
                <p className="opacity-60 mb-8 leading-relaxed font-medium text-sm">
                  Enable background monitoring to detect suspicious activity across your ecosystem. Messages will be intercepted and analyzed locally.
                </p>
                
                <div className="space-y-3 mb-8">
                  <PermissionToggle label="Gmail Monitoring API" active={state.permissions.gmail} />
                  <PermissionToggle label="Hardware Notifications" active={true} />
                  <PermissionToggle label="Deep Packet Analysis" active={true} />
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    id="confirm-permissions-button"
                    onClick={requestGmailPermission}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 cursor-pointer"
                  >
                    Authorize Integration
                  </button>
                  <button 
                    onClick={() => setActiveWindow('dashboard')}
                    className="w-full py-2 opacity-40 hover:opacity-100 font-black text-[10px] uppercase tracking-widest transition-opacity cursor-pointer"
                  >
                    Defer Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeWindow === 'settings' && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="p-8 max-w-2xl mx-auto"
            >
              <h2 className="text-4xl font-black mb-10 tracking-tight">Global Settings</h2>
              <div className="space-y-8">
                <SettingsGroup title="Visual Experience">
                  <SettingItem 
                    icon={<Moon className="w-4 h-4" />} 
                    label="Dark UI Theme" 
                    value={state.isDarkMode} 
                    onChange={toggleDarkMode}
                    dark={state.isDarkMode}
                  />
                  <SettingItem 
                    icon={<Bell className="w-4 h-4" />} 
                    label="Rich Desktop Context Alerts" 
                    value={true} 
                    onChange={() => {}}
                    dark={state.isDarkMode}
                  />
                </SettingsGroup>

                <SettingsGroup title="AI Core Engine">
                   <div className={`p-6 rounded-3xl border transition-all ${state.isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Active Model</span>
                       <span className="text-[9px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black tracking-widest border border-green-500/20 uppercase">STABLE</span>
                    </div>
                    <p className="text-xl font-black">Naive Bayes Classifier v2.1</p>
                    <p className="text-xs opacity-50 mt-2 font-medium leading-relaxed">
                      Privacy-first architecture. All text analysis happens strictly on your CPU. No data is transmitted to external servers for classification.
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center justify-between">
                       <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Last Update: April 2026</span>
                       <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline cursor-pointer">Re-Train Locally</button>
                    </div>
                   </div>
                </SettingsGroup>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Notification Toast simulation */}
      <AnimatePresence>
        {state.notifications.length > 0 && (state.notifications[0] as any).isNew && (
          <motion.div 
            initial={{ opacity: 0, y: 100, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-[100] p-5 rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex gap-4 items-center w-80 sm:w-96 backdrop-blur-xl ${
              state.notifications[0].type === 'spam' 
                ? 'bg-red-600 text-white border-transparent' 
                : state.isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              state.notifications[0].type === 'spam' ? 'bg-white/20' : 'bg-blue-600/10 text-blue-500'
            }`}>
              {state.notifications[0].type === 'spam' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <p className="font-black text-sm tracking-tight">{state.notifications[0].title}</p>
              <p className="text-xs opacity-90 line-clamp-2 leading-tight mt-1">{state.notifications[0].message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active, onClick, dark }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, dark: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group cursor-pointer ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 font-black' 
          : dark ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 shadow-sm sm:shadow-none'
      }`}
    >
      <span className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-blue-500'}`}>{icon}</span>
      <span className="hidden sm:block text-xs font-bold tracking-tight uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatBox({ label, count, color, isDarkMode, icon }: any) {
  const colorMap = {
    blue: isDarkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-blue-50 border-blue-100 text-blue-600',
    red: isDarkMode ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-red-50 border-red-100 text-red-600',
    green: isDarkMode ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-green-50 border-green-100 text-green-600',
  };
  
  return (
    <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
        <div className={`p-2 rounded-xl ${colorMap[color as keyof typeof colorMap]}`}>{icon}</div>
      </div>
      <p className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{count.toLocaleString()}</p>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (e: React.FormEvent, email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid security-authenticated email address.");
      return;
    }

    if (password.length < 6) {
      setError("Digital Key must be at least 6 characters for high-level clearance.");
      return;
    }

    onLogin(e, email);
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0F172A] to-slate-900 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="p-10 sm:p-14">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-3xl shadow-blue-600/40 mb-8 rotate-6 hover:rotate-0 transition-transform duration-700">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-center">SpamShield <br/><span className="text-blue-600 uppercase text-xs tracking-[0.3em] font-black opacity-40">Identity Vault</span></h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Personnel Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[28px] outline-none focus:border-blue-500/50 transition-all text-slate-900 font-bold placeholder:opacity-30" 
                  placeholder="expert@spamshield.io" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Digital Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[28px] outline-none focus:border-blue-500/50 transition-all text-slate-900 font-bold placeholder:opacity-30" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            <button 
              id="login-submit-button"
              type="submit"
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
            >
              System Authorization <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              Node Connected
            </div>
            <span>Build 4.0.2</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PermissionToggle({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-400/5 border border-slate-400/10">
      <span className="text-sm font-bold opacity-80 tracking-tight">{label}</span>
      <div className={`w-12 h-7 rounded-full p-1.5 transition-colors ${active ? 'bg-green-500' : 'bg-slate-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 pl-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SettingItem({ icon, label, value, onChange, dark }: { icon: React.ReactNode, label: string, value: boolean, onChange: () => void, dark: boolean }) {
  return (
    <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50 italic sm:not-italic'}`}>
      <div className="flex items-center gap-4">
        <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">{icon}</span>
        <span className="text-sm font-bold opacity-80 tracking-tight">{label}</span>
      </div>
      <button 
        onClick={onChange}
        className={`w-14 h-8 rounded-full p-1.5 transition-colors relative cursor-pointer ${value ? 'bg-blue-600' : 'bg-slate-400/30'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-0'} shadow-md`}></div>
      </button>
    </div>
  );
}
