import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Heart, Share2, Send, User, MoreVertical } from 'lucide-react';
import { BlogPost, Comment } from '../constants';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { formatLikes } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
  isLiked: boolean;
  onLike: () => void;
}

const cleanText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim();
};

export default function BlogPostDetail({ post, onBack, isLiked, onLike }: BlogPostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const cleanedTitle = cleanText(post.title);
  const cleanedSubtitle = cleanText(post.subtitle);

  const handleLike = async () => {
    if (!auth.currentUser) {
      setCommentError("AUTH_REQUIRED: LOG IN TO LIKE TRANSMISSIONS");
      return;
    }

    if (isLiked) return; // Already liked
    
    onLike(); // Optimistic update in parent
    setIsLiking(true);
    const postRef = doc(db, 'posts', post.id);
    try {
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error: any) {
      if (error?.code === 'not-found' || error?.code === 'permission-denied') {
        setCommentError("NOTICE: THIS ARCHIVE LOG IS READ-ONLY IN ITS CURRENT SECTOR");
        console.warn("Liking failed: Document may not exist in Firestore yet.");
      } else {
        handleFirestoreError(error, OperationType.WRITE, `posts/${post.id}`);
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.subtitle,
      url: window.location.href,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("NODE_LINK_COPIED: TRANSMISSION URL STORED IN CLIPBOARD");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Real-time comments listener
  useEffect(() => {
    if (!post.id) return;

    const commentsPath = `posts/${post.id}/comments`;
    const q = query(collection(db, commentsPath), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Fallback for static display if createdAt hasn't synced yet
        time: doc.data().createdAt ? new Date(doc.data().createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'JUST NOW'
      })) as Comment[];
      setComments(fetchedComments);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, commentsPath);
    });

    return () => unsubscribe();
  }, [post.id]);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // We don't necessarily want to crash the UI for everyone, but we log it as required.
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    setCommentError(null);
    const commentsPath = `posts/${post.id}/comments`;

    try {
      const commentData = {
        user: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'ANONYMOUS_NODE',
        content: newComment.trim(),
        time: 'JUST NOW',
        location: 'ENCRYPTED_SECTOR',
        avatarColor: 'bg-cyan-vibrant',
        createdAt: serverTimestamp(),
        uid: auth.currentUser.uid
      };

      await addDoc(collection(db, commentsPath), commentData);
      setNewComment('');
    } catch (error) {
      setCommentError("TRANSMISSION_FAILED: INSUFFICIENT_PERMISSIONS");
      handleFirestoreError(error, OperationType.WRITE, commentsPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-cyan-vibrant transition-all text-xs font-bold tracking-widest uppercase group mb-12"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to perimeter
      </button>

      {/* Detail Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-[1px] w-8 bg-cyan-vibrant" />
          <span className="text-[10px] md:text-xs font-bold text-cyan-vibrant tracking-[0.3em] uppercase">{post.category}</span>
          <span className="text-[10px] md:text-xs font-bold text-slate-600 tracking-[0.2em] uppercase">{post.readTime}</span>
          <div className="h-[1px] w-8 bg-cyan-vibrant" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] uppercase drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] break-words">
          {cleanedTitle}
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed break-words">
          {cleanedSubtitle}
        </p>
      </div>

      {/* Featured Image */}
      <div className="w-full aspect-[21/9] rounded-lg overflow-hidden border border-white/10 mb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900">
        <img 
          src={post.image}
          alt="Main content" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Content */}
      <div 
        className="prose prose-invert prose-lg max-w-none mb-20 text-slate-300 leading-relaxed prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-strong:text-magenta-vibrant prose-em:text-cyan-vibrant break-words overflow-x-hidden w-full"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Actions */}
      <div className="flex items-center justify-between py-10 border-y border-white/5 mb-24">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLike}
            disabled={isLiking || isLiked}
            className={`flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all border border-white/5 ${isLiking ? 'opacity-50 cursor-wait' : ''} ${isLiked ? 'border-white/20 bg-white/10' : ''}`}
          >
            <Heart 
              size={16} 
              className={`${isLiking ? 'animate-pulse' : ''} ${isLiked ? 'text-white fill-white' : 'text-cyan-vibrant'} transition-colors`} 
            />
            {isLiked ? post.likes : formatLikes(post.likes)}
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all border border-white/5"
          >
            <Share2 size={16} className="text-magenta-vibrant" />
            SHARE
          </button>
        </div>
        
        <div className="flex items-center -space-x-3">
          {[1,2,3].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-darker-surface bg-slate-800 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + post.id}`} alt="User" referrerPolicy="no-referrer" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-darker-surface bg-dark-surface flex items-center justify-center text-[10px] font-bold text-slate-500">
            +{Math.floor(Math.random() * 50) + 10}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <section className="mb-32">
        <h3 className="text-3xl font-bold text-white mb-10 tracking-tight uppercase">Transmission Logs ({comments.length})</h3>
        
        {/* Comment Form */}
        <div className="bg-dark-surface/40 border border-white/5 rounded-lg p-8 mb-12">
          {auth.currentUser ? (
            <form onSubmit={handlePostComment}>
              <div className="mb-6">
                <span className="text-[10px] font-bold text-cyan-vibrant tracking-[0.2em] uppercase mb-4 block">POST ENCRYPTED MESSAGE</span>
                <div className="flex items-center gap-3 mb-4 p-3 bg-darker-surface/50 border border-white/5 rounded">
                    <div className="w-8 h-8 rounded-sm bg-cyan-vibrant/20 border border-cyan-vibrant/20 flex items-center justify-center">
                        <User size={16} className="text-cyan-vibrant" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">AUTHENTICATED_OPERATOR</p>
                        <p className="text-xs text-white font-mono">{auth.currentUser.email}</p>
                    </div>
                </div>
                <textarea 
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your neural imprint..."
                  rows={4}
                  className="w-full bg-darker-surface border border-white/10 rounded px-4 py-3 text-sm focus:outline-none focus:border-cyan-vibrant/50 transition-colors resize-none text-white"
                />
                {commentError && (
                    <p className="text-[10px] text-red-500 font-bold tracking-widest mt-2 uppercase">{commentError}</p>
                )}
              </div>
              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-vibrant to-magenta-vibrant text-black font-extrabold py-3 rounded text-[11px] tracking-[0.2em] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={14} />
                {isSubmitting ? 'EXECUTING...' : 'EXECUTE TRANSMISSION'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-4">Aithentication required to post logs</p>
                <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em]">Please sign in using the terminal header</p>
            </div>
          )}
        </div>

        {/* Comment List */}
        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map((comment, idx) => (
              <motion.div 
                key={comment.id || idx} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-dark-surface/30 border border-white/5 rounded-lg p-6 group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-sm ${comment.avatarColor || 'bg-slate-700'} opacity-20 border border-white/10 flex items-center justify-center group-hover:opacity-40 transition-opacity`}>
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <h5 className="text-cyan-vibrant font-bold text-xs tracking-widest uppercase">{comment.user}</h5>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{comment.time} • {comment.location}</p>
                    </div>
                  </div>
                  <button className="text-slate-700 hover:text-white"><MoreVertical size={16} /></button>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-normal pl-14 break-words">
                  {comment.content}
                </p>
              </motion.div>
            ))
          ) : (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-lg">
                  <p className="text-slate-600 text-[10px] font-bold tracking-[0.3em] uppercase">No logs recorded for this transmission</p>
              </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
