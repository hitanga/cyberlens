import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Image as ImageIcon, Type, Code, Eye, Terminal, Layers, Plus, Trash2, ArrowUp, ArrowDown, Edit3, X, List, Bold, Italic, List as ListIcon, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Type as TypeIcon } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { CarouselSlide, BlogPost, CATEGORIES } from '../constants';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: { chain: any }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    } as any;
  },
});

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'POSTS' | 'CAROUSEL';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-white/5 bg-darker-surface sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('bold') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('italic') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <div className="w-px h-6 bg-white/5 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('paragraph') && !editor.isActive('heading') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Normal Text"
      >
        <Type size={16} />
      </button>
      <div className="w-px h-6 bg-white/5 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="H1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="H2"
      >
        <Heading2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="H3"
      >
        <Heading3 size={16} />
      </button>
      <div className="w-px h-6 bg-white/5 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('bulletList') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Bullet List"
      >
        <ListIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('orderedList') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-white/5 transition-colors ${editor.isActive('blockquote') ? 'text-cyan-vibrant' : 'text-slate-400'}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>
      <div className="w-px h-6 bg-white/5 mx-1 self-center" />
      <div className="flex items-center gap-2 px-2 hover:bg-white/5 rounded transition-colors group" title="Font Size">
        <TypeIcon size={14} className="text-slate-500 group-hover:text-cyan-vibrant transition-colors" />
        <select
          onChange={e => {
            const val = e.target.value;
            if (val === 'default') {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(val).run();
            }
          }}
          value={editor.getAttributes('textStyle').fontSize || 'default'}
          className="bg-transparent text-[10px] text-slate-400 font-bold border-none focus:ring-0 cursor-pointer uppercase appearance-none"
        >
          <option value="default">AUTO</option>
          <option value="10px">10px</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="32px">32px</option>
          <option value="48px">48px</option>
        </select>
      </div>
      <div className="w-px h-6 bg-white/5 mx-1 self-center" />
      <div className="flex items-center gap-2 px-2 hover:bg-white/5 rounded transition-colors group" title="Text Color">
        <Palette size={14} className="text-slate-500 group-hover:text-cyan-vibrant transition-colors" />
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
          value={editor.getAttributes('textStyle').color || '#ffffff'}
          className="w-4 h-4 p-0 bg-transparent border-none cursor-pointer transition-transform"
        />
      </div>
    </div>
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[FIRESTORE_ERROR]', JSON.stringify(errInfo, null, 2));
  return errInfo.error;
};

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('POSTS');
  
  // Blog Post State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
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
  
  const formRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      Placeholder.configure({
        placeholder: 'Forge the future here...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm focus:outline-none max-w-none p-6 min-h-[300px] break-words overflow-x-hidden',
      },
    },
  });

  // Sync editor content when switching posts or modes
  useEffect(() => {
    if (editor && editingPostId && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    } else if (editor && !editingPostId && content === '') {
      editor.commands.setContent('');
    }
  }, [editingPostId]);

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

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body.textContent || "";
    return text.replace(/[\s\u00A0]+/g, ' ').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });

    try {
      const cleanContent = stripHtml(content);
      const selectedCat = CATEGORIES.find(c => c.name === category);
      const postData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        categoryColor: selectedCat ? selectedCat.color : 'text-cyan-vibrant',
        excerpt: cleanContent.substring(0, 180).trim() + (cleanContent.length > 180 ? '...' : ''),
        content,
        image,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
        readTime: `${Math.max(1, Math.ceil(cleanContent.split(' ').length / 200))} MIN READ`,
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
      const errorMsg = handleFirestoreError(error, editingPostId ? OperationType.UPDATE : OperationType.CREATE, editingPostId ? `posts/${editingPostId}` : 'posts');
      setStatus({ type: 'error', message: `SYNC_FAILED: ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPostForm = () => {
    setTitle('');
    setSubtitle('');
    setImage('');
    setContent('');
    if (editor) editor.commands.setContent('');
    setEditingPostId(null);
    setCategory(CATEGORIES[0].name);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSubtitle(post.subtitle);
    setCategory(post.category);
    setImage(post.image);
    setContent(post.content);
    if (editor) editor.commands.setContent(post.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeletePost = async (id: string) => {
    if (!auth.currentUser) {
      setStatus({ type: 'error', message: 'SESSION_EXPIRED: PLEASE RELOGIN' });
      return;
    }

    console.log(`[DEBUG] Attempting to delete transmission: ${id} by user: ${auth.currentUser.email}`);
    
    setStatus({ type: null, message: '' });
    setDeleteConfirmId(null);
    setIsDeleting(id);
    const path = `posts/${id}`;
    
    try {
      await deleteDoc(doc(db, 'posts', id));
      console.log(`[DEBUG] Transmission ${id} vaporized successfully.`);
      if (editingPostId === id) resetPostForm();
      setStatus({ type: 'success', message: 'TRANSMISSION VAPORIZED' });
    } catch (error) {
      console.error(`[DEBUG] Error deleting transmission ${id}:`, error);
      const errorMsg = handleFirestoreError(error, OperationType.DELETE, path);
      setStatus({ type: 'error', message: `DELETION_FAILED: ${errorMsg}` });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
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
      const errorMsg = handleFirestoreError(error, OperationType.CREATE, 'carousel_slides');
      setStatus({ type: 'error', message: `SLIDE_ADD_FAILED: ${errorMsg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!auth.currentUser) return;
    if (!confirm("Confirm deletion of this intelligence slide?")) return;
    
    try {
      await deleteDoc(doc(db, 'carousel_slides', id));
      setStatus({ type: 'success', message: 'SLIDE REMOVED' });
    } catch (error) {
      const errorMsg = handleFirestoreError(error, OperationType.DELETE, `carousel_slides/${id}`);
      setStatus({ type: 'error', message: `SLIDE_DELETE_FAILED: ${errorMsg}` });
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
        
        <div className="flex flex-col items-end">
          <div className="text-[9px] text-slate-600 font-mono mb-2 uppercase tracking-tighter">
            Authorized as: <span className="text-cyan-vibrant">{auth.currentUser?.email || 'ANONYMOUS'}</span>
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
        </div>
      </header>

      {status.type && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded border text-xs font-bold tracking-widest uppercase ${
            status.type === 'success' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500' : 'bg-red-500/10 border-red-500/50 text-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{status.message}</span>
            <button onClick={() => setStatus({ type: null, message: '' })} className="hover:text-white"><X size={14} /></button>
          </div>
        </motion.div>
      )}

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
                      {CATEGORIES.map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
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
                        onChange={(e) => {
                          setContent(e.target.value);
                          if (editor) editor.commands.setContent(e.target.value);
                        }}
                        className="w-full h-[400px] bg-darker-surface p-6 font-mono text-xs text-cyan-vibrant/80 focus:outline-none resize-none leading-relaxed border-none ring-0"
                        spellCheck={false}
                      />
                    ) : (
                      <div className="tiptap-container h-[400px] flex flex-col">
                        <MenuBar editor={editor} />
                        <div className="flex-grow overflow-y-auto">
                          <EditorContent editor={editor} />
                        </div>
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
                      <h4 className="text-white font-bold text-sm uppercase tracking-tight line-clamp-1 group-hover:text-cyan-vibrant transition-colors break-words">{post.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditPost(post)}
                        className={`p-3 text-slate-500 hover:text-cyan-vibrant hover:bg-cyan-vibrant/5 rounded transition-all ${editingPostId === post.id ? 'text-cyan-vibrant bg-cyan-vibrant/10' : ''}`}
                        title="Edit Transmission"
                      >
                        <Edit3 size={18} />
                      </button>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setDeleteConfirmId(deleteConfirmId === post.id ? null : post.id)}
                          disabled={isDeleting === post.id}
                          className={`p-3 transition-all ${isDeleting === post.id ? 'text-slate-700 animate-pulse' : 'text-slate-500 hover:text-red-500 hover:bg-red-500/5'}`}
                          title="Delete from Archive"
                        >
                          <Trash2 size={18} className={isDeleting === post.id ? 'animate-spin' : ''} />
                        </button>

                        <AnimatePresence>
                          {deleteConfirmId === post.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, x: 20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9, x: 20 }}
                              className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-darker-surface border border-red-500/50 p-2 rounded shadow-2xl flex items-center gap-3 z-50 whitespace-nowrap"
                            >
                              <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase pl-2">Confirm?</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-xs hover:bg-red-600 transition-colors uppercase"
                                >
                                  Delete
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="bg-slate-800 text-white text-[9px] font-black px-3 py-1 rounded-xs hover:bg-slate-700 transition-colors uppercase"
                                >
                                  Exit
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
