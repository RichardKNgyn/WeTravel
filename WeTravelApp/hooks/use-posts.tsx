import { createContext, ReactNode, useContext, useState } from 'react';

export type Comment = {
  id: string;
  user: string;
  text: string;
  likes?: number;
  replies: Comment[];
};

export type Post = {
  id: string;
  title: string;
  description: string;
  location: string;
  images: string[];
  author: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Post) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  addReply: (postId: string, commentId: string, text: string) => void;
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
    comments: [
  {
    id: "c1",
    user: "Liam",
    text: "This view is unreal 😍",
    likes: 2,
    replies: [
      {
        id: "r1",
        user: "Sophia",
        text: "Right?? Santorini sunsets never disappoint.",
        likes: 1,
        replies: [],
      },
    ],
  },
  {
    id: "c2",
    user: "Ethan",
    text: "Adding this to my bucket list.",
    likes: 0,
    replies: [],
  },
  {
    id: "c3",
    user: "Olivia",
    text: "How crowded was it?",
    likes: 0,
    replies: [],
  },
],
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
    comments: [
  {
    id: "c4",
    user: "Ava",
    text: "Kyoto is magical in the fall 🍁",
    likes: 3,
    replies: [
      {
        id: "r2",
        user: "Noah",
        text: "Totally agree. The temples are stunning.",
        likes: 1,
        replies: [],
      },
    ],
  },
  {
    id: "c5",
    user: "Lucas",
    text: "Nishiki Market is elite.",
    likes: 1,
    replies: [],
  },
  {
    id: "c6",
    user: "Mia",
    text: "How was the cycling experience?",
    likes: 0,
    replies: [],
  },
],
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
    comments: [
  {
    id: "c7",
    user: "Harper",
    text: "The migration is on my dream list.",
    likes: 4,
    replies: [
      {
        id: "r3",
        user: "Elijah",
        text: "Same here. The scale must be insane.",
        likes: 2,
        replies: [],
      },
    ],
  },
  {
    id: "c8",
    user: "Amelia",
    text: "Safari mornings hit different.",
    likes: 1,
    replies: [],
  },
  {
    id: "c9",
    user: "Benjamin",
    text: "Did you see any lions?",
    likes: 0,
    replies: [],
  },
],
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

  const addComment = (postId: string, text: string) => {
  setPosts(prev =>
    prev.map(post =>
      post.id === postId
        ? {
            ...post,
            comments: [
              ...(post.comments ?? []),
              {
                id: Date.now().toString(),
                user: "You",
                text,
                likes: 0,
                replies: [],
              },
            ],
          }
        : post
    )
  );
};

const addReply = (postId: string, commentId: string, text: string) => {
  const addReplyRecursive = (comments: Comment[]): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [
            ...(comment.replies ?? []),
            {
              id: Date.now().toString(),
              user: "You",
              text,
              likes: 0,
              replies: [],
            },
          ],
        };
      }

      return {
        ...comment,
        replies: addReplyRecursive(comment.replies ?? []),
      };
    });
  };

  setPosts(prev =>
    prev.map(post =>
      post.id === postId
        ? {
            ...post,
            comments: addReplyRecursive(post.comments),
          }
        : post
    )
  );
};

  return (
    <PostsContext.Provider value={{ posts, addPost, toggleLike, likedPosts, addComment, addReply }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error('usePosts must be used within PostsProvider');
  return ctx;
}