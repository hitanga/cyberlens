import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import { CarouselSlide } from '../constants';

interface HeroCarouselProps {
  slides: CarouselSlide[];
  onReadMore: (postId: string) => void;
}

export default function HeroCarousel({ slides, onReadMore }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  const nextSlide = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 1.1
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.6 },
        scale: { duration: 0.8 }
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.4 }
      }
    })
  };

  const slide = slides[current];

  return (
    <section id="hero-carousel" className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden -mt-24 w-full bg-darker-surface">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 z-0"
        >
          <img 
            src={slide.image} 
            alt={slide.title}
            className="w-full h-full object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-darker-surface via-darker-surface/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-darker-surface via-transparent to-transparent opacity-80" />
          
          {/* Animated scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
        </motion.div>
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 relative z-20 w-full pt-20">
        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${slide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.span 
                initial={{ letterSpacing: "0.1em", opacity: 0 }}
                animate={{ letterSpacing: "0.3em", opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="text-cyan-vibrant font-black text-[10px] md:text-sm tracking-[0.3em] uppercase mb-8 block drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"
              >
                {slide.subtitle}
              </motion.span>
              
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] mb-8 uppercase italic break-words">
                {slide.title.split(':').map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    <span className={i > 0 ? "text-slate-600 drop-shadow-none" : "drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"}>
                      {part.trim()}
                    </span>
                  </React.Fragment>
                ))}
              </h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400 text-base md:text-xl mb-12 leading-relaxed max-w-2xl font-medium border-l-2 border-white/10 pl-6 break-words"
              >
                {slide.description}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-6"
              >
                <button 
                  onClick={() => slide.postId && onReadMore(slide.postId)}
                  className="btn-cyan flex items-center gap-4 transition-all transform hover:translate-x-2 group h-[56px] px-10"
                >
                  <span className="text-sm font-black tracking-widest">ESTABLISH_UPLINK</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-12 h-[1px] bg-white/10" />
                  <span className="text-[10px] font-bold text-slate-600 tracking-widest uppercase">ID: {slide.id.slice(0, 8)}</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 right-6 md:right-12 z-30 flex items-center gap-4">
        <div className="flex items-center gap-2 mr-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className={`h-1 transition-all duration-500 rounded-full ${i === current ? 'w-12 bg-cyan-vibrant shadow-[0_0_10px_rgba(0,229,255,0.8)]' : 'w-4 bg-white/10 hover:bg-white/30'}`}
            />
          ))}
        </div>
        
        <button 
          onClick={prevSlide}
          className="p-4 bg-dark-surface/50 border border-white/5 text-white hover:text-cyan-vibrant hover:border-cyan-vibrant/30 transition-all rounded-xs backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="p-4 bg-dark-surface/50 border border-white/5 text-white hover:text-cyan-vibrant hover:border-cyan-vibrant/30 transition-all rounded-xs backdrop-blur-sm"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Side Label */}
      <div className="absolute left-8 bottom-32 origin-left -rotate-90 z-30 hidden lg:block">
        <span className="text-[10px] font-black tracking-[0.5em] text-slate-700 uppercase whitespace-nowrap">
          SYSTEM_TRANSMISSION_FEED_v4.2
        </span>
      </div>
    </section>
  );
}
