import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getCachedPosts, saveAllCachedPosts, saveCachedPost, type CachedPost } from './use-offline-db';

export type Comment = {
  id: string;
  user: string;
  text: string;
};

export type Post = {
  id: string;
  author: string;
  location?: string;
  images: string[];
  title: string;
  description: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'comments'> & { comments?: Comment[] }) => void;
  toggleLike: (postId: string) => void;
  likedPosts: Set<string>;
  addComment: (postId: string, comment: Comment) => void;
};

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Angelo Pineda',
    location: 'Peru',
    images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80'],
    title: 'Random llama encounter',
    description: '🦙 Unreal vibes in the mountains. This little guy walked right up to me on the trail.',
    likes: 128,
    comments: [
      { id: 'c1', user: 'Maya Chen', text: 'Omg I need to go here 😭' },
      { id: 'c2', user: 'Sam Rivera', text: 'The llama said hi to ME specifically' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'p2',
    author: 'Maya Chen',
    location: 'Jordan',
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80'],
    title: 'Desert heat + ancient stones',
    description: 'Main character energy 🏜️ Petra is absolutely breathtaking. The rose-red city lived up to every expectation.',
    likes: 302,
    comments: [
      { id: 'c3', user: 'Angelo Pineda', text: 'Petra is unreal 🔥' },
      { id: 'c4', user: 'Sam Rivera', text: 'The lighting here is insane' },
      { id: 'c5', user: 'Karla R.', text: 'Adding this to my bucket list rn' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'p3',
    author: 'Sam Rivera',
    location: 'Los Angeles, CA',
    images: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80'],
    title: 'City nights',
    description: 'Camera roll going crazy 📸 LA hits different after dark. The skyline never gets old.',
    likes: 87,
    comments: [
      { id: 'c6', user: 'Maya Chen', text: 'LA hits different at night' },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'p4',
    author: 'Maria K.',
    location: 'Santorini, Greece',
    images: ['https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800'],
    title: 'Golden hour in Santorini',
    description: 'Watched the most spectacular sunset from Oia. The whole sky turned amber and rose — totally worth the 2-hour hike.',
    likes: 142,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'p5',
    author: 'James T.',
    location: 'Kyoto, Japan',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
    title: 'Temples & street food in Kyoto',
    description: 'Spent 5 days cycling between shrines and eating my way through Nishiki Market. Japan never disappoints.',
    likes: 89,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'p6',
    author: 'Amara N.',
    location: 'Serengeti, Tanzania',
    images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'],
    title: 'Safari mornings in Serengeti',
    description: 'Witnessed the great migration at dawn. 500,000 wildebeest crossing the Mara River — nothing prepares you for the scale of it.',
    likes: 217,
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const setup = async () => {
      const cachedPosts = await getCachedPosts();
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
          comments: JSON.parse(cp.comments),
          createdAt: cp.createdAt,
        }));
        setPosts(loadedPosts);
      }
    };
    setup();
  }, []);

  const addPost = (post: Omit<Post, 'comments'> & { comments?: Comment[] }) => {
    const newPost = { ...post, comments: post.comments ?? [] };
    setPosts((prev) => [newPost, ...prev]);
    const cached: CachedPost = {
      id: newPost.id,
      author: newPost.author,
      location: newPost.location || null,
      images: JSON.stringify(newPost.images),
      title: newPost.title,
      description: newPost.description,
      likes: newPost.likes,
      comments: JSON.stringify(newPost.comments),
      createdAt: newPost.createdAt,
    };
    saveCachedPost(cached);
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

  const addComment = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, toggleLike, likedPosts, addComment }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}
