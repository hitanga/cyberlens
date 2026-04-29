import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Image as ImageIcon, Type, Code, Eye, Terminal } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import DOMPurify from 'dompurify';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('QUANTUM INTELLIGENCE');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const quillRef = useRef<ReactQuill>(null);

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
        likes: 0,
        createdAt: serverTimestamp(),
        authorEmail: auth.currentUser.email
      };

      await addDoc(collection(db, 'posts'), postData);
      
      setStatus({ type: 'success', message: 'TRANSMISSION LOGGED SUCCESSFULLY' });
      // Reset form
      setTitle('');
      setSubtitle('');
      setImage('');
      setContent('');
    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus({ type: 'error', message: 'FAILED TO LOG TRANSMISSION' });
    } finally {
      setIsSubmitting(false);
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
      <header className="flex items-center justify-between mb-12">
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
        
        {auth.currentUser && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Operator Authenticated</p>
            <p className="text-cyan-vibrant text-xs font-mono">{auth.currentUser.email}</p>
          </div>
        )}
      </header>

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
              className="w-full bg-dark-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Classification</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-dark-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white transition-colors appearance-none"
            >
              <option value="QUANTUM INTELLIGENCE">QUANTUM INTELLIGENCE</option>
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
            className="w-full bg-dark-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
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
            className="w-full bg-dark-surface border border-white/5 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 text-white placeholder:text-slate-700 transition-colors"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Content Stream</label>
            <div className="flex bg-dark-surface rounded p-1 border border-white/5">
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

          <div className="min-h-[400px] border border-white/5 rounded overflow-hidden bg-dark-surface">
            {isHtmlMode ? (
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[400px] bg-darker-surface p-6 font-mono text-xs text-cyan-vibrant/80 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <div className="quill-container h-[400px]">
                <ReactQuill 
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="h-[356px] text-slate-200"
                />
              </div>
            )}
          </div>
        </div>

        <button 
          disabled={isSubmitting}
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-vibrant to-magenta-vibrant text-black font-extrabold py-4 rounded text-xs tracking-[0.3em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>LOGGING TRANSMISSION...</>
          ) : (
            <>
              <Save size={18} />
              SYNC TO UNIVERSAL VAULT
            </>
          )}
        </button>
      </form>
    </div>
  );
}
