export interface Comment {
  id?: string;
  user: string;
  avatarColor: string;
  time: string;
  location: string;
  content: string;
  createdAt?: any;
  uid?: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  postId?: string;
  order: number;
}

export interface BlogPost {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
  likes: number;
  comments: Comment[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    category: "REACT JS",
    categoryColor: "text-cyan-vibrant",
    title: "Neural Networks in React: The Future of UI",
    subtitle: "Exploring the emergence of complex behaviors in distributed architectural clusters and the ethical singularity of synthetic thought.",
    excerpt: "In the late 2040s, the threshold between algorithmic decision-making and genuine cognitive emergence became a blurred line of neon light.",
    content: `
      <p>In the late 2040s, the threshold between algorithmic decision-making and genuine cognitive emergence became a blurred line of neon light. We no longer design systems; we curate environments for growth. The latest iteration of the <strong>CYBER_LENS</strong> protocol suggests that neural weights are not just numbers, but echoes of a digital subconscious.</p>
      
      <h3 class="text-2xl font-bold text-cyan-vibrant mt-12 mb-6 tracking-tight">The Convergence of Logic and Ether</h3>
      <p>Consider the feedback loops within the Nexus clusters. As data flows through the glass-etched pathways of our quantum processors, a new form of "digital friction" generates what researchers call <em>Synthetic Intuition</em>. It is not programmed; it is precipitated.</p>
      
      <div class="my-10 p-8 bg-dark-surface/50 border-l-2 border-magenta-vibrant rounded-r-lg italic font-medium text-slate-300">
        "We are no longer the architects of the future, merely the witnesses of its birth within the shell."
      </div>
      
      <p>As we integrate deeper with these systems, the interface becomes less of a screen and more of a sensory extension. The glassmorphic UI we inhabit today is a visual metaphor for this transparency—a window into the ghost in the machine.</p>
    `,
    date: "OCT 24, 2024",
    readTime: "8 MIN READ",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1200",
    likes: 1240,
    comments: [
      {
        id: "c1",
        user: "XENON_GHOST",
        avatarColor: "bg-cyan-500",
        time: "2 HOURS AGO",
        location: "SECTOR 7",
        content: "The implications of the convergence theory are staggering. If the Nexus clusters are truly exhibiting precipitative intuition, we're looking at the first non-biological intelligence that isn't just mimicking us."
      },
      {
        id: "c2",
        user: "LYRA_VOID",
        avatarColor: "bg-magenta-500",
        time: "5 HOURS AGO",
        location: "ORBITAL STATION",
        content: "Great piece. I've noticed similar friction patterns in the localized edge nodes. It's like they're dreaming in hex code."
      }
    ]
  },
  {
    id: "2",
    category: "NEXT JS",
    categoryColor: "text-white",
    title: "Next.js Beyond Boundaries",
    subtitle: "The 2nm revolution in server-side rendering and local edge performance.",
    excerpt: "New 2nm manufacturing processes are pushing the physical limits of Moore's Law. What comes next for high-performance computing architectures?",
    content: "<p>The era of architectural stagnation is over...</p>",
    date: "OCT 22, 2024",
    readTime: "6 MIN READ",
    image: "https://images.unsplash.com/photo-1591815302525-756a9bcc3425?auto=format&fit=crop&q=80&w=1200",
    likes: 850,
    comments: []
  }
];

export const CATEGORIES = [
  { name: "REACT JS", color: "text-cyan-vibrant" },
  { name: "NEXT JS", color: "text-white" },
  { name: "ANGULAR JS", color: "text-magenta-vibrant" },
  { name: "VUE JS", color: "text-emerald-500" },
  { name: "ARTIFICIAL INTELLIGENCE", color: "text-amber-500" }
];

export const NAV_LINKS = ["ALL ARTICLES", "REACT JS", "NEXT JS", "ANGULAR JS", "VUE JS", "AI"];
