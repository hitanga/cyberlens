import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Image as ImageIcon, Type, Code, Eye, Terminal, Layers, Plus, Trash2, ArrowUp, ArrowDown, Edit3, X, List } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import DOMPurify from 'dompurify';
import { CarouselSlide, BlogPost } from '../constants';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'POSTS' | 'CAROUSEL';

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('POSTS');
  
  // Blog Post State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('QUANTUM INTELLIGENCE');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Carousel State
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideDescription, setSlideDescription] = useState('');
  const [slideImage, setSlideImage] = useState('');
  const [slidePostId, setSlidePostId] = useState('');
  
  const quillRef = useRef<ReactQuill>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Fetch Slides & Posts
  useEffect(() => {
    if (activeTab === 'CAROUSEL') {
      const q = query(collection(db, 'carousel_slides'), orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CarouselSlide[]);
      });
      return () => unsubscribe();
    } else {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BlogPost[]);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const postData = {
        title,
        subtitle,
        category,
        categoryColor: category === 'HARDWARE' ? 'text-magenta-vibrant' : 'text-cyan-vibrant',
        excerpt: DOMPurify.sanitize(content, { ALLOWED_TAGS: [] }).substring(0, 160) + '...',
        content,
        image,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
        readTime: `${Math.ceil(content.split(' ').length / 200)} MIN READ`,
        updatedAt: serverTimestamp(),
      };

      if (editingPostId) {
        await updateDoc(doc(db, 'posts', editingPostId), postData);
        setStatus({ type: 'success', message: 'TRANSMISSION UPDATED' });
      } else {
        await addDoc(collection(db, 'posts'), {
          ...postData,
          likes: 0,
          createdAt: serverTimestamp(),
          authorEmail: auth.currentUser.email
        });
        setStatus({ type: 'success', message: 'TRANSMISSION LOGGED' });
      }
      
      resetPostForm();
    } catch (error) {
      console.error("Error saving transmission: ", error);
      setStatus({ type: 'error', message: 'FAILED TO SYNC TRANSMISSION' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPostForm = () => {
    setTitle('');
    setSubtitle('');
    setImage('');
    setContent('');
    setEditingPostId(null);
    setCategory('QUANTUM INTELLIGENCE');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSubtitle(post.subtitle);
    setCategory(post.category);
    setImage(post.image);
    setContent(post.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Confirm permanent destruction of this transmission log?")) return;
    setStatus({ type: 'idle', message: '' });
    try {
      await deleteDoc(doc(db, 'posts', id));
      if (editingPostId === id) resetPostForm();
      setStatus({ type: 'success', message: 'TRANSMISSION VAPORIZED' });
    } catch (error) {
      console.error("Deletion failed:", error);
      setStatus({ type: 'error', message: 'DELETION ABORTED: INSUFFICIENT CLEARANCE' });
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'carousel_slides'), {
        title: slideTitle,
        subtitle: slideSubtitle,
        description: slideDescription,
        image: slideImage,
        postId: slidePostId,
        order: slides.length
      });
      setSlideTitle('');
      setSlideSubtitle('');
      setSlideDescription('');
      setSlideImage('');
      setSlidePostId('');
      setStatus({ type: 'success', message: 'SLIDE ADDED' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'FAILED TO ADD SLIDE' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Confirm deletion of this intelligence slide?")) return;
    try {
      await deleteDoc(doc(db, 'carousel_slides', id));
    } catch (error) {
      console.error(error);
    }
  };

  const moveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    
    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];
    
    try {
      await updateDoc(doc(db, 'carousel_slides', currentSlide.id), { order: targetIndex });
      await updateDoc(doc(db, 'carousel_slides', targetSlide.id), { order: index });
    } catch (error) {
      console.error(error);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-cyan-vibrant transition-all text-[10px] font-bold tracking-widest uppercase mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            EXIT CONTROL ROOM
          </button>
          <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-4">
            <Terminal className="text-cyan-vibrant" size={28} />
            Command Center
          </h2>
        </div>
        
        <div className="flex bg-dark-surface p-1 rounded border border-white/5 self-start md:self-auto">
          <button 
            onClick={() => setActiveTab('POSTS')}
            className={`px-6 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'POSTS' ? 'bg-cyan-vibrant text-black' : 'text-slate-500 hover:text-white'}`}
          >
            Transmissions
          </button>
          <button 
            onClick={() => setActiveTab('CAROUSEL')}
            className={`px-6 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'CAROUSEL' ? 'bg-magenta-vibrant text-black' : 'text-slate-500 hover:text-white'}`}
          >
            Neural Carousel
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'POSTS' ? (
          <motion.div
            key="posts-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-16"
          >
            <div ref={formRef} className="space-y-8 bg-dark-surface p-8 rounded-sm border border-white/5 relative overflow-hidden">
              {/* Active Edit Indicator */}
              {editingPostId && (
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-vibrant shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
              )}
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">
                  {editingPostId ? 'MODIFY_TRANSMISSION' : 'FORGE_NEW_LOG'}
                </h3>
                {editingPostId && (
                  <button 
                    onClick={resetPostForm}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-white tracking-widest uppercase transition-all"
                  >
                    <X size={14} /> CANCEL_EDIT
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {status.type && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded border text-xs font-bold tracking-widest uppercase ${
                      status.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
                    }`}
                  >
                    {status.message}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
                      <Type size={12} /> Transmission Title
                    </label>
                    <input 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter headline..."
                      className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Classification</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white transition-colors appearance-none"
                    >
                      <option value="QUANTUM INTELLIGENCE">QUANTUM INTELLIGENCE</option>
                      <option value="REACT JS">REACT JS</option>
                      <option value="HARDWARE">HARDWARE</option>
                      <option value="CYBERSECURITY">CYBERSECURITY</option>
                      <option value="NEURAL LINKS">NEURAL LINKS</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Secondary Header (Subtitle)</label>
                  <input 
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Clarifying metadata..."
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
                    <ImageIcon size={12} /> Image Uplink URL
                  </label>
                  <input 
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Content Stream</label>
                    <div className="flex bg-darker-surface rounded p-1 border border-white/5">
                      <button 
                        type="button"
                        onClick={() => setIsHtmlMode(false)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${!isHtmlMode ? 'bg-cyan-vibrant text-black' : 'text-slate-500 hover:text-white'}`}
                      >
                        <Eye size={12} /> VISUAL
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsHtmlMode(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all ${isHtmlMode ? 'bg-magenta-vibrant text-black' : 'text-slate-500 hover:text-white'}`}
                      >
                        <Code size={12} /> HTML SOURCE
                      </button>
                    </div>
                  </div>

                  <div className="min-h-[400px] border border-white/5 rounded overflow-hidden bg-darker-surface font-display selection:bg-cyan-vibrant/30">
                    {isHtmlMode ? (
                      <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[400px] bg-darker-surface p-6 font-mono text-xs text-cyan-vibrant/80 focus:outline-none resize-none leading-relaxed border-none ring-0"
                        spellCheck={false}
                      />
                    ) : (
                      <div className="quill-container h-[400px]">
                        <ReactQuill 
                          theme="snow"
                          value={content}
                          onChange={setContent}
                          modules={modules}
                          className="h-[356px] text-slate-200 border-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  disabled={isSubmitting}
                  type="submit"
                  className={`w-full bg-gradient-to-r ${editingPostId ? 'from-magenta-vibrant to-cyan-vibrant' : 'from-cyan-vibrant to-magenta-vibrant'} text-black font-extrabold py-5 rounded-xs text-[10px] tracking-[0.4em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_20px_rgba(0,229,255,0.2)]`}
                >
                  {isSubmitting ? (
                    <>SYNCING TRANSMISSION...</>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingPostId ? 'UPDATE_UNIVERSAL_VAULT' : 'SYNC_TO_UNIVERSAL_VAULT'}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Transmissions List */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase flex items-center gap-3">
                <List size={14} /> ARCHIVED_TRANSMISSIONS
              </h3>

              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-dark-surface/40 border border-white/5 p-5 rounded-sm flex items-center gap-6 group hover:border-cyan-vibrant/30 transition-all">
                    <div className="w-24 h-16 shrink-0 rounded overflow-hidden border border-white/5">
                      <img src={post.image} alt="" className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[9px] font-black tracking-widest uppercase ${post.categoryColor}`}>{post.category}</span>
                        <span className="text-slate-700 text-[9px] font-bold">{post.date}</span>
                      </div>
                      <h4 className="text-white font-bold text-sm uppercase tracking-tight line-clamp-1 group-hover:text-cyan-vibrant transition-colors">{post.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditPost(post)}
                        className={`p-3 text-slate-500 hover:text-cyan-vibrant hover:bg-cyan-vibrant/5 rounded transition-all ${editingPostId === post.id ? 'text-cyan-vibrant bg-cyan-vibrant/10' : ''}`}
                        title="Edit Transmission"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded transition-all"
                        title="Delete from Archive"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded">
                    <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">No archived transmissions found in sector</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="carousel-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            {/* Add Slide Form */}
            <div className="bg-dark-surface p-8 rounded-sm border border-white/5">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                <Plus size={20} className="text-magenta-vibrant" />
                Forge New Neural Slide
              </h3>
              
              <form onSubmit={handleAddSlide} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Slide Heading</label>
                  <input 
                    required
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="QUANTUM SYSTEMS: NEW FRONTIERS"
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-magenta-vibrant/50 text-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Pre-Heading Title</label>
                  <input 
                    required
                    value={slideSubtitle}
                    onChange={(e) => setSlideSubtitle(e.target.value)}
                    placeholder="FEATURED INTELLIGENCE"
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-magenta-vibrant/50 text-white transition-colors"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Supporting Description</label>
                  <textarea 
                    required
                    rows={2}
                    value={slideDescription}
                    onChange={(e) => setSlideDescription(e.target.value)}
                    placeholder="Tracking the emergence of complex behaviors..."
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-magenta-vibrant/50 text-white transition-colors resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Uplink Background URL</label>
                  <input 
                    required
                    value={slideImage}
                    onChange={(e) => setSlideImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-magenta-vibrant/50 text-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Target Transmission ID (Optional)</label>
                  <input 
                    value={slidePostId}
                    onChange={(e) => setSlidePostId(e.target.value)}
                    placeholder="1"
                    className="w-full bg-darker-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-magenta-vibrant/50 text-white transition-colors"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="md:col-span-2 bg-magenta-vibrant text-black font-black py-4 rounded-xs text-[10px] tracking-[0.3em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  ACTIVATE SLIDE
                </button>
              </form>
            </div>

            {/* List Slides */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase flex items-center gap-3">
                <Layers size={14} /> Active Neural Slides
              </h3>
              
              <div className="space-y-4">
                {slides.map((slide, idx) => (
                  <div key={slide.id} className="bg-dark-surface/40 border border-white/5 p-4 rounded flex items-center gap-6 group hover:border-magenta-vibrant/20 transition-all">
                    <div className="w-40 h-24 shrink-0 rounded overflow-hidden border border-white/10">
                      <img src={slide.image} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    
                    <div className="flex-grow">
                      <p className="text-[9px] text-magenta-vibrant font-bold tracking-widest uppercase mb-1">{slide.subtitle}</p>
                      <h4 className="text-white font-bold text-sm mb-1 uppercase italic">{slide.title}</h4>
                      <p className="text-slate-500 text-[10px] line-clamp-1">{slide.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => moveSlide(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:text-cyan-vibrant disabled:opacity-20"><ArrowUp size={14}/></button>
                        <button onClick={() => moveSlide(idx, 'down')} disabled={idx === slides.length - 1} className="p-1.5 hover:text-cyan-vibrant disabled:opacity-20"><ArrowDown size={14}/></button>
                      </div>
                      <button 
                        onClick={() => deleteSlide(slide.id)}
                        className="p-3 text-slate-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {slides.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/5 rounded">
                    <p className="text-slate-600 text-[10px] font-bold tracking-widest uppercase">No active slides in orbit</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

