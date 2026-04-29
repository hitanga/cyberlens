import { Search, ChevronRight, Bookmark, LayoutGrid, List, ArrowLeft, ArrowRight, Rss, Globe, Mail, Heart, Share2, MoreVertical, Send, User, LogOut, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, ChangeEvent } from 'react';
import { BLOG_POSTS as STATIC_POSTS, BlogPost, Comment } from './constants';
import { db, auth, signInWithGoogle } from './lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import AdminDashboard from './components/AdminDashboard';
import BlogPostDetail from './components/BlogPostDetail';
import { formatLikes } from './lib/utils';

export default function App() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"HOME" | "PRIVACY" | "TERMS" | "CONTACT" | "RSS" | "ADMIN">("HOME");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("list");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>(STATIC_POSTS);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isAdmin = user?.email === 'gopalzone2025@gmail.com';

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggingIn(false);
    });
    return () => unsubscribe();
  }, []);

  // Load liked posts from local storage
  useEffect(() => {
    const saved = localStorage.getItem('liked_posts');
    if (saved) {
      try {
        setLikedPostIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing liked posts", e);
      }
    }
  }, []);

  const toggleLike = (postId: string) => {
    setLikedPostIds(prev => {
      const next = prev.includes(postId) ? prev : [...prev, postId];
      localStorage.setItem('liked_posts', JSON.stringify(next));
      return next;
    });
  };

  // Firestore Data Listener
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestorePosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      
      // Merge with static posts or just use firestore
      // For this app, we'll prefix firestore posts
      setPosts([...firestorePosts, ...STATIC_POSTS.filter(p => !firestorePosts.find(fp => fp.id === p.id))]);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPost = posts.find(p => p.id === selectedPostId);

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedPostId, currentView]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedPostId) setSelectedPostId(null);
    if (currentView !== "HOME") setCurrentView("HOME");
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.warn("Authentication popup was closed or cancelled.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Domain Not Authorized: Please add this URL to the 'Authorized domains' list in your Firebase Console -> Authentication -> Settings.");
        console.error("Login failed: domain not authorized.");
      } else {
        console.error("Login failed:", error);
      }
      setIsLoggingIn(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (currentView === "ADMIN") navigateTo("HOME");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigateTo = (view: "HOME" | "PRIVACY" | "TERMS" | "CONTACT" | "RSS" | "ADMIN") => {
    setCurrentView(view);
    setSelectedPostId(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-darker-surface text-slate-200 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-darker-surface/80 backdrop-blur-md border-b border-border-glow">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-12 text-nowrap">
            <h1 
              onClick={() => navigateTo('HOME')} 
              className="text-2xl font-bold tracking-tight flex items-center cursor-pointer group"
            >
              <span className="text-cyan-vibrant group-hover:text-white transition-colors uppercase">CYBER_LENS</span>
            </h1>
          </div>

          <div className="flex items-center gap-6 flex-1 justify-end max-w-2xl">
            <div 
              className={`relative hidden sm:flex items-center gap-3 bg-dark-surface px-4 py-2 rounded-sm border transition-all duration-300 ${
                searchFocused ? "border-cyan-vibrant ring-1 ring-cyan-vibrant/20 w-full" : "border-white/5 w-64"
              }`}
            >
              <Search size={14} className={searchFocused ? "text-cyan-vibrant" : "text-slate-500"} />
              <input
                type="text"
                placeholder="search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder:text-slate-600 focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-4 whitespace-nowrap">
              {isAdmin && (
                <button 
                  onClick={() => navigateTo('ADMIN')}
                  className={`text-xs font-bold tracking-widest flex items-center gap-2 transition-colors ${currentView === 'ADMIN' ? 'text-cyan-vibrant' : 'text-slate-500 hover:text-white'}`}
                >
                  <Shield size={14} />
                  ADMIN
                </button>
              )}
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Operator</p>
                    <p className="text-[10px] text-white font-mono">{user.email?.split('@')[0]}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 bg-dark-surface border border-white/5 text-slate-500 hover:text-red-500 rounded transition-colors group"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  id="login-btn" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className={`text-xs font-semibold transition-colors flex items-center gap-2 ${isLoggingIn ? 'text-slate-600 opacity-50 cursor-not-allowed' : 'hover:text-cyan-vibrant uppercase'}`}
                >
                  <User size={14} className={isLoggingIn ? "animate-pulse" : ""} />
                  {isLoggingIn ? 'CONNECTING...' : 'LOGIN'}
                </button>
              )}
              
              {!user && (
                <button id="subscribe-btn" className="btn-cyan rounded-xs text-xs py-2 px-6">
                  SUBSCRIBE
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24">
        <AnimatePresence mode="wait">
          {currentView === "HOME" ? (
            !selectedPostId ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Hero Section */}
                <section id="hero-section" className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden -mt-24">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000" 
                      alt="Futuristic Tech"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-darker-surface via-darker-surface/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-darker-surface via-transparent to-transparent" />
                  </div>

                  <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="max-w-3xl"
                    >
                      <span className="text-cyan-vibrant font-semibold text-xs tracking-[0.3em] uppercase mb-6 block">
                        FEATURED INTELLIGENCE
                      </span>
                      <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1] mb-8 uppercase">
                        QUANTUM SYSTEMS: <br />
                        <span className="text-slate-600">NEW FRONTIERS</span>
                      </h2>
                      <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-xl">
                        Tracking the emergence of complex behaviors in distributed architectural clusters and the ethical singularity of synthetic thought.
                      </p>
                      
                      <button 
                        onClick={() => setSelectedPostId("1")}
                        className="btn-cyan flex items-center gap-3 transition-all transform hover:scale-105"
                      >
                        READ MORE
                        <ChevronRight size={18} />
                      </button>
                    </motion.div>
                  </div>
                </section>

                {/* Blog List Section */}
                <section id="latest-transmissions" className="max-w-7xl mx-auto px-6 py-20 pb-32">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">LATEST TRANSMISSIONS</h3>
                      <p className="text-slate-500 text-xs uppercase tracking-widest">Real-time updates from the digital perimeter.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setLayoutMode("grid")}
                        className={`p-3 bg-dark-surface border border-white/5 rounded-xs transition-colors ${layoutMode === "grid" ? "text-cyan-vibrant border-cyan-vibrant/30" : "text-slate-600 hover:text-white"}`}
                      >
                        <LayoutGrid size={20} />
                      </button>
                      <button 
                        onClick={() => setLayoutMode("list")}
                        className={`p-3 bg-dark-surface border border-white/5 rounded-xs transition-colors ${layoutMode === "list" ? "text-cyan-vibrant border-cyan-vibrant/30" : "text-slate-600 hover:text-white"}`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                  </div>

                  <div className={layoutMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "grid grid-cols-1 gap-10"}>
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((post, index) => (
                        <PostCard 
                          key={post.id} 
                          post={post} 
                          delay={index * 0.1} 
                          layoutMode={layoutMode}
                          isLiked={likedPostIds.includes(post.id)}
                          onClick={() => setSelectedPostId(post.id)} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                        <p className="text-slate-500 font-bold tracking-widest uppercase mb-4">No transmissions found matching your criteria</p>
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="text-cyan-vibrant text-xs font-bold hover:underline"
                        >
                          CLEAR SEARCH
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto px-6 py-12"
              >
                {selectedPost && (
                  <BlogPostDetail 
                    post={selectedPost} 
                    onBack={() => setSelectedPostId(null)} 
                    isLiked={likedPostIds.includes(selectedPost.id)}
                    onLike={() => toggleLike(selectedPost.id)}
                  />
                )}
              </motion.div>
            )
          ) : currentView === "PRIVACY" ? (
            <InfoPage 
              key="privacy"
              title="Privacy Protocol" 
              subtitle="Data encryption and digital footprint security measures."
              content={`
                <p>The <strong>NEON_READER</strong> protocol prioritizes the complete anonymity of its node operators. Our data handling follows strict end-to-end encryption standards, ensuring that your digital footprint remains invisible within the perimeter.</p>
                <h3 class="text-xl font-bold text-cyan-vibrant mt-8 mb-4">Identity Cloaking</h3>
                <p>We do not store personally identifiable information (PII). Access handles are generated via cryptographic hashes that reset every cycle. Your interactions are your own; we merely provide the conduit.</p>
                <h3 class="text-xl font-bold text-cyan-vibrant mt-8 mb-4">Node Security</h3>
                <p>Communication between your device and our clusters is tunneled through decentralized relays, preventing traditional packet sniffing and localized tracking.</p>
              `}
              onBack={() => navigateTo('HOME')}
            />
          ) : currentView === "TERMS" ? (
            <InfoPage 
              key="terms"
              title="Service Terms" 
              subtitle="The legal framework governing transmission and access."
              content={`
                <p>By accessing the <strong>NEON_READER</strong> network, you agree to abide by the digital compact outlined below. Misuse of the transmission protocols may result in localization blacklisting.</p>
                <h3 class="text-xl font-bold text-magenta-vibrant mt-8 mb-4">Access Rights</h3>
                <p>Content published here is distributed under the Cyber-Creative License. You are free to redistribute encrypted packets as long as the origin headers remain intact.</p>
                <h3 class="text-xl font-bold text-magenta-vibrant mt-8 mb-4">Transmission Limits</h3>
                <p>Automated scraping bots without valid API tokens will be identified and shunted. We value high-fidelity human interaction over algorithmic data extraction.</p>
              `}
              onBack={() => navigateTo('HOME')}
            />
          ) : currentView === "CONTACT" ? (
            <InfoPage 
              key="contact"
              title="Contact API" 
              subtitle="Direct uplink to the central node administrators."
              content={`
                <p>Need to report a protocol breach or suggest an architectural improvement? Use the direct uplink channels below. Response time varies based on network congestion.</p>
                <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="p-6 bg-dark-surface border border-white/5 rounded">
                    <h4 class="text-cyan-vibrant font-bold mb-2">GENERAL INQUIRIES</h4>
                    <p class="text-xs text-slate-500 font-mono">UPLINK_01@NEONREADER.NET</p>
                  </div>
                  <div class="p-6 bg-dark-surface border border-white/5 rounded">
                    <h4 class="text-magenta-vibrant font-bold mb-2">SECURITY BREACHES</h4>
                    <p class="text-xs text-slate-500 font-mono">ROOT_SHIELD@NEONREADER.NET</p>
                  </div>
                </div>
              `}
              onBack={() => navigateTo('HOME')}
            />
          ) : currentView === "RSS" ? (
            <InfoPage 
              key="rss"
              title="RSS Feed" 
              subtitle="Raw data stream for automated news aggregation."
              content={`
                <p>Subscribe to our raw intelligence feed using the following XML endpoint. This stream is optimized for high-speed terminal readers and automated dashboards.</p>
                <div class="mt-12 p-8 bg-darker-surface border border-dashed border-cyan-vibrant/20 rounded font-mono text-xs text-cyan-vibrant/60">
                   https://ais-dev.run.app/api/transmissions/feed.xml
                </div>
                <p class="mt-8">We support Standard RSS 2.0 and Atom protocols. All feeds are signed with our public PGP key for authenticity verification.</p>
              `}
              onBack={() => navigateTo('HOME')}
            />
          ) : currentView === "ADMIN" ? (
            <AdminDashboard onBack={() => navigateTo('HOME')} />
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-darker-surface border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="max-w-sm">
            <h4 className="text-cyan-vibrant font-bold tracking-tight mb-4 text-xl uppercase">CYBER_LENS</h4>
            <p className="text-[10px] text-slate-600 tracking-widest uppercase leading-loose">
              © 2024 CYBER_LENS. ENCRYPTED TRANSMISSION SECURED. <br />
              ALL RIGHTS RESERVED BY SECURITY PROTOCOLS.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            <button onClick={() => navigateTo('PRIVACY')} className="text-[11px] font-bold text-slate-500 hover:text-cyan-vibrant tracking-widest transition-all uppercase cursor-pointer">PRIVACY PROTOCOL</button>
            <button onClick={() => navigateTo('TERMS')} className="text-[11px] font-bold text-slate-500 hover:text-cyan-vibrant tracking-widest transition-all uppercase cursor-pointer">SERVICE TERMS</button>
            <button onClick={() => navigateTo('CONTACT')} className="text-[11px] font-bold text-slate-500 hover:text-cyan-vibrant tracking-widest transition-all uppercase cursor-pointer">CONTACT API</button>
            <button onClick={() => navigateTo('RSS')} className="text-[11px] font-bold text-slate-500 hover:text-cyan-vibrant tracking-widest transition-all uppercase cursor-pointer">RSS FEED</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PostCard({ post, delay, onClick, layoutMode, isLiked }: { post: BlogPost; delay: number; onClick: () => void; key?: string | number; layoutMode: "grid" | "list"; isLiked: boolean }) {
  if (layoutMode === "grid") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="group flex flex-col bg-dark-surface/20 border border-white/5 hover:border-cyan-vibrant/20 transition-all duration-500 rounded-sm cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <div className="w-full aspect-video shrink-0 overflow-hidden relative">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100 opacity-60 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-cyan-vibrant/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex flex-col flex-grow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-bold tracking-widest uppercase ${post.categoryColor}`}>{post.category}</span>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{post.date}</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-4 group-hover:text-cyan-vibrant transition-colors duration-300 uppercase leading-snug line-clamp-2">{post.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-2">{post.excerpt}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-cyan-vibrant hover:text-white transition-all group/link uppercase">
                READ MORE
                <ChevronRight size={14} />
              </button>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${isLiked ? 'text-white' : 'text-slate-600'}`}>
                <Heart size={12} className={isLiked ? 'fill-white' : ''} />
                {isLiked ? post.likes : formatLikes(post.likes)}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group flex flex-col lg:flex-row gap-10 p-4 lg:p-8 bg-dark-surface/20 border border-white/5 hover:border-cyan-vibrant/20 transition-all duration-500 rounded-sm cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full lg:w-[400px] h-[260px] shrink-0 overflow-hidden relative rounded-sm">
        <img src={post.image} alt={post.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100 opacity-60 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-cyan-vibrant/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-col flex-grow py-2">
        <div className="flex items-center justify-between mb-6">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 bg-white/5 rounded-xs ${post.categoryColor}`}>{post.category}</span>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{post.date}</span>
        </div>
        <h3 className="text-3xl font-bold tracking-tight text-white mb-6 group-hover:text-cyan-vibrant transition-colors duration-300 uppercase leading-snug">{post.title}</h3>
        <p className="text-slate-500 text-base leading-relaxed mb-10 line-clamp-2">{post.excerpt}</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-4 text-[11px] font-extrabold tracking-widest text-cyan-vibrant hover:text-white transition-all group/link uppercase">
                READ MORE
                <ChevronRight size={16} />
              </button>
              <div className={`flex items-center gap-2 text-[11px] font-bold ${isLiked ? 'text-white' : 'text-slate-600'}`}>
                <Heart size={14} className={`${isLiked ? 'text-white fill-white' : 'text-cyan-vibrant/40'}`} />
                {isLiked ? post.likes : formatLikes(post.likes)}
              </div>
            </div>
            <button className="text-slate-700 hover:text-cyan-vibrant transition-all"><Bookmark size={20} /></button>
          </div>
      </div>
    </motion.article>
  );
}

function InfoPage({ title, subtitle, content, onBack }: { title: string; subtitle: string; content: string; onBack: () => void; key?: string | number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 px-6"
    >
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 uppercase drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">
          {title}
        </h1>
        <p className="text-cyan-vibrant/60 text-xs font-bold tracking-[0.3em] uppercase">
          {subtitle}
        </p>
      </div>

      <div 
        className="prose prose-invert prose-lg max-w-none mb-12 text-slate-400 leading-loose"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-cyan-vibrant transition-all text-xs font-bold tracking-widest uppercase group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to articles
      </button>
    </motion.div>
  );
}
