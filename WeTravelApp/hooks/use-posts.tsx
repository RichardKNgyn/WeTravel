import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getCachedPosts, getLikedPosts, getSavedPosts, saveAllCachedPosts, saveCachedPost, saveLikedPosts, saveSavedPosts, type CachedPost } from './use-offline-db';

export type Comment = {
  id: string;
  user: string;
  text: string;
  replies?: Comment[];
  createdAt?: string;
};

export type Post = {
  id: string;
  author: string;
  location?: string;
  images: string[];
  title: string;
  description: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  createdAt: string;
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'comments'> & { comments?: Comment[] }) => void;
  toggleLike: (postId: string) => void;
  likedPosts: Set<string>;
  addComment: (postId: string, comment: Comment) => void;
  addReply: (postId: string, commentId: string, reply: Comment) => void;
  toggleSave: (postId: string) => void;
  savedPosts: Set<string>;
};

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Angelo Pineda',
    location: 'Sacred Valley, Peru',
    images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80'],
    title: 'Hiking through the Andes: Mountain encounters',
    description: '🦙 Trekked through the Sacred Valley and encountered wild llamas at 11,000 ft. The altitude is brutal but the views are unreal.',
    likes: 128,
    isLiked: false,
    comments: [
      {
        id: 'c1',
        user: 'Maya Chen',
        text: 'The Sacred Valley is on my bucket list! Did you do the full Inca Trail?',
        replies: [
          {
            id: 'r1',
            user: 'Angelo Pineda',
            text: 'We did a modified 2-day trek. Inca Trail is insane but worth every blister!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          },
          {
            id: 'r2',
            user: 'Sam Rivera',
            text: 'I heard you need permits 6 months ahead. How early did you book?',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: 'c2',
        user: 'James T.',
        text: "Did you get altitude sickness? I'm worried about that for my trip",
        replies: [
          {
            id: 'r3',
            user: 'Angelo Pineda',
            text: 'A little bit on day 1. Coca tea really helps! Acclimatize in Cusco for at least 2 days.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'p2',
    author: 'Maya Chen',
    location: 'Petra, Jordan',
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80'],
    title: 'Petra at sunrise: One of the 7 wonders',
    description: '🏜️ Woke up at 4am to hike to the Monastery. The rose-red cliffs glowing in the golden hour made me cry. Bucket list ✓',
    likes: 302,
    isLiked: false,
    comments: [
      {
        id: 'c3',
        user: 'Angelo Pineda',
        text: 'This is insane! The carved architecture is mind-blowing',
        replies: [
          {
            id: 'r4',
            user: 'Maya Chen',
            text: 'Right?? I learned it was carved from a single mountain 2,000 years ago. The Nabataeans were geniuses.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
      {
        id: 'c4',
        user: 'Karla R.',
        text: 'How many hours should I plan for the full Petra walk?',
        replies: [
          {
            id: 'r5',
            user: 'Maya Chen',
            text: 'We did 6 hours at a moderate pace. Start early, bring LOTS of water, and wear good shoes.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'p3',
    author: 'Sam Rivera',
    location: 'Griffith Observatory, Los Angeles',
    images: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80'],
    title: 'LA skyline: Purple hour photography',
    description: '📸 Shot this from Griffith Observatory at purple hour. The city lights mixed with the sunset colors were insane.',
    likes: 87,
    isLiked: false,
    comments: [
      {
        id: 'c6',
        user: 'Maya Chen',
        text: 'The composition is perfect! What camera settings did you use?',
        replies: [
          {
            id: 'r6',
            user: 'Sam Rivera',
            text: 'Sony A7 IV, 1/60s, f/8, ISO 400. Purple hour is 20 mins after sunset, best light!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 'c7',
        user: 'James T.',
        text: 'I need to get to Griffith Observatory next time I\'m in LA',
        replies: [
          {
            id: 'r7',
            user: 'Sam Rivera',
            text: 'Go on a weekday at 5pm. Weekends are packed. Parking is free and the views are always worth it!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'p4',
    author: 'Maria K.',
    location: 'Oia, Santorini',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'],
    title: 'Santorini sunsets: Worth the crowds',
    description: '🌅 Oia sunset is the most photographed sunset in Greece for a reason. The white-washed buildings against the caldera views are unmatched.',
    likes: 142,
    isLiked: false,
    comments: [
      {
        id: 'c8',
        user: 'Karla R.',
        text: 'Is it worth fighting the crowds? Or should I skip Oia?',
        replies: [
          {
            id: 'r8',
            user: 'Maria K.',
            text: 'Go 30 min before sunset to a side street. You get the view without 500 people pushing you. Pro tip!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 13).toISOString(),
      },
      {
        id: 'c9',
        user: 'James T.',
        text: 'How long is the ferry from Athens? Is it worth it over flying?',
        replies: [
          {
            id: 'r9',
            user: 'Maria K.',
            text: '8 hours by ferry, 1 hour by flight. Ferry is cheaper but I\'d fly for sanity. The views from the plane are stunning though!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'p5',
    author: 'James T.',
    location: 'Kyoto, Japan',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
    title: 'Kyoto temples and Nishiki Market food crawl',
    description: '🏯 5 days cycling through 100+ temples and eating everything at Nishiki Market. Japan is a food lover\'s dream.',
    likes: 89,
    isLiked: false,
    comments: [
      {
        id: 'c10',
        user: 'Angelo Pineda',
        text: 'Which temple should I prioritize? I only have 2 days',
        replies: [
          {
            id: 'r10',
            user: 'James T.',
            text: 'Fushimi Inari for the torii gates (30 min from Kyoto) and Kinkaku-ji early morning. Skip the crowds with a guide!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      },
      {
        id: 'c11',
        user: 'Maria K.',
        text: 'What was your favorite Nishiki food find?',
        replies: [
          {
            id: 'r11',
            user: 'James T.',
            text: 'Fresh wasabi on rice, sea urchin, and matcha everything. But the mochi stalls had the longest lines for a reason!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'p6',
    author: 'Amara N.',
    location: 'Serengeti National Park, Tanzania',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'],
    title: 'The Great Migration: Wildebeest river crossing',
    description: '🦁 Watched 500,000 wildebeest cross the Mara River at dawn. Our guide said we timed it perfectly — see predators everywhere.',
    likes: 217,
    isLiked: false,
    comments: [
      {
        id: 'c12',
        user: 'Sam Rivera',
        text: 'This is INCREDIBLE! When is the best time to see the migration?',
        replies: [
          {
            id: 'r12',
            user: 'Amara N.',
            text: 'June-September is peak season. Book 3+ months ahead. We saw lions, crocodiles, and the crossing in ONE morning!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
      },
      {
        id: 'c13',
        user: 'Maya Chen',
        text: 'How much does a safari tour cost? Is it better to go with an operator or self-drive?',
        replies: [
          {
            id: 'r13',
            user: 'Amara N.',
            text: 'Guided tour $2-4k for 4-5 days. 100% worth it — guides spot animals you\'d miss. Self-drive is cheaper but riskier.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 34).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const setup = async () => {
      const cachedPosts = await getCachedPosts();
      const liked = await getLikedPosts();
      const saved = await getSavedPosts();
      
      if (cachedPosts.length === 0) {
        setPosts(INITIAL_POSTS);
        const cached: CachedPost[] = INITIAL_POSTS.map(p => ({
          id: p.id,
          author: p.author,
          location: p.location || null,
          images: JSON.stringify(p.images),
          title: p.title,
          description: p.description,
          likes: p.likes,
          isLiked: p.isLiked,
          comments: JSON.stringify(p.comments),
          createdAt: p.createdAt,
        }));
        await saveAllCachedPosts(cached);
      } else {
        const loadedPosts: Post[] = cachedPosts.map(cp => ({
          id: cp.id,
          author: cp.author,
          location: cp.location || undefined,
          images: JSON.parse(cp.images),
          title: cp.title,
          description: cp.description,
          likes: cp.likes,
          isLiked: cp.isLiked || false,
          comments: JSON.parse(cp.comments),
          createdAt: cp.createdAt,
        }));
        setPosts(loadedPosts);
      }
      
      setLikedPosts(liked);
      setSavedPosts(saved);
    };
    setup();
  }, []);

  // Save liked posts when they change
  useEffect(() => {
    (async () => {
      try {
        await saveLikedPosts(likedPosts);
      } catch (error) {
        console.error('Failed to save liked posts:', error);
      }
    })();
  }, [likedPosts]);

  // Save saved posts when they change
  useEffect(() => {
    (async () => {
      try {
        await saveSavedPosts(savedPosts);
      } catch (error) {
        console.error('Failed to save saved posts:', error);
      }
    })();
  }, [savedPosts]);

  const addPost = (post: Omit<Post, 'comments' | 'isLiked'> & { comments?: Comment[] }) => {
    const newPost = { ...post, comments: post.comments ?? [], isLiked: false };
    setPosts((prev) => [newPost, ...prev]);
    const cached: CachedPost = {
      id: newPost.id,
      author: newPost.author,
      location: newPost.location || null,
      images: JSON.stringify(newPost.images),
      title: newPost.title,
      description: newPost.description,
      likes: newPost.likes,
      isLiked: newPost.isLiked,
      comments: JSON.stringify(newPost.comments),
      createdAt: newPost.createdAt,
    };
    saveCachedPost(cached);
  };

  const toggleLike = (postId: string) => {
    // Single source of truth: use post.isLiked boolean directly
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === postId) {
          const wasLiked = p.isLiked;
          return {
            ...p,
            isLiked: !wasLiked,
            likes: wasLiked ? p.likes - 1 : p.likes + 1,
          };
        }
        return p;
      });
      // Persist all updated posts to database
      const cached: CachedPost[] = updated.map(p => ({
        id: p.id,
        author: p.author,
        location: p.location || null,
        images: JSON.stringify(p.images),
        title: p.title,
        description: p.description,
        likes: p.likes,
        isLiked: p.isLiked,
        comments: JSON.stringify(p.comments),
        createdAt: p.createdAt,
      }));
      saveAllCachedPosts(cached).catch(console.error);
      return updated;
    });
  };

  const addComment = (postId: string, comment: Comment) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      );
      // Save to database
      const cached: CachedPost[] = updated.map(p => ({
        id: p.id,
        author: p.author,
        location: p.location || null,
        images: JSON.stringify(p.images),
        title: p.title,
        description: p.description,
        likes: p.likes,
        isLiked: p.isLiked,
        comments: JSON.stringify(p.comments),
        createdAt: p.createdAt,
      }));
      saveAllCachedPosts(cached).catch(console.error);
      return updated;
    });
  };

  const addReply = (postId: string, commentId: string, reply: Comment) => {
    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId
                  ? { ...c, replies: [...(c.replies || []), reply] }
                  : c
              ),
            }
          : p
      );
      // Save to database
      const cached: CachedPost[] = updated.map(p => ({
        id: p.id,
        author: p.author,
        location: p.location || null,
        images: JSON.stringify(p.images),
        title: p.title,
        description: p.description,
        likes: p.likes,
        isLiked: p.isLiked,
        comments: JSON.stringify(p.comments),
        createdAt: p.createdAt,
      }));
      saveAllCachedPosts(cached).catch(console.error);
      return updated;
    });
  };

  const toggleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, toggleLike, likedPosts, addComment, addReply, toggleSave, savedPosts }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}




