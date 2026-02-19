import { createContext, useContext, useState, ReactNode } from 'react';

export type Post = {
  id: string;
  title: string;
  description: string;
  location: string;
  images: string[];
  author: string;
  createdAt: string;
  likes: number;
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Post) => void;
  toggleLike: (postId: string) => void;
  likedPosts: Set<string>;
};

const PostsContext = createContext<PostsContextType | null>(null);

const SAMPLE_POSTS: Post[] = [
  {
    id: 'sample-1',
    title: 'Golden hour in Santorini',
    description: 'Watched the most spectacular sunset from Oia. The whole sky turned amber and rose — totally worth the 2-hour hike.',
    location: 'Santorini, Greece',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'],
    author: 'Maria K.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    likes: 142,
  },
  {
    id: 'sample-2',
    title: 'Temples & street food in Kyoto',
    description: 'Spent 5 days cycling between shrines and eating my way through Nishiki Market. Japan never disappoints.',
    location: 'Kyoto, Japan',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
    author: 'James T.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: 89,
  },
  {
    id: 'sample-3',
    title: 'Safari mornings in Serengeti',
    description: 'Witnessed the great migration at dawn. 500,000 wildebeest crossing the Mara River — nothing prepares you for the scale of it.',
    location: 'Serengeti, Tanzania',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'],
    author: 'Amara N.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likes: 217,
  },
];

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const addPost = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: likedPosts.has(postId) ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, toggleLike, likedPosts }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}