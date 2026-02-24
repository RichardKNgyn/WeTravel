import { createContext, ReactNode, useContext, useState } from "react";

export type Comment = {
  id: string;
  user: string;
  text: string;
  likes?: number;
  replies: Comment[];
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
  addPost: (post: Omit<Post, "comments"> & { comments?: Comment[] }) => void;
  toggleLike: (postId: string) => void;
  likedPosts: Set<string>;
  addComment: (postId: string, text: string) => void;
  addReply: (postId: string, commentId: string, text: string) => void;
};

const INITIAL_POSTS: Post[] = [
{
id: "p1",
author: "Angelo Pineda",
location: "Peru",
images: [
"https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80",
],
title: "Random llama encounter",
description:
"🦙 Unreal vibes in the mountains. This little guy walked right up to me on the trail.",
likes: 128,
createdAt: new Date().toISOString(),
comments: [
{
id: "c1",
user: "Maya Chen",
text: "Omg I need to go here 😭",
likes: 2,
replies: [
{
id: "r1",
user: "Sam Rivera",
text: "Same!! Peru is insane.",
likes: 1,
replies: [],
},
],
},
{
id: "c2",
user: "Elijah",
text: "The mountains look unreal 🔥",
likes: 3,
replies: [],
},
{
id: "c3",
user: "Olivia",
text: "How long was the hike?",
likes: 0,
replies: [],
},
],
},

{
id: "p2",
author: "Maya Chen",
location: "Jordan",
images: [
"https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
],
title: "Desert heat + ancient stones",
description:
"Main character energy 🏜️ Petra absolutely lived up to the hype.",
likes: 302,
createdAt: new Date().toISOString(),
comments: [
{
id: "c4",
user: "Angelo Pineda",
text: "Petra is unreal 🔥",
likes: 5,
replies: [
{
id: "r2",
user: "Maya Chen",
text: "It was even better in person.",
likes: 2,
replies: [],
},
],
},
{
id: "c5",
user: "Karla R.",
text: "Adding this to my bucket list.",
likes: 1,
replies: [],
},
{
id: "c6",
user: "Lucas",
text: "The lighting is crazy good.",
likes: 0,
replies: [],
},
{
id: "c7",
user: "Sophia",
text: "How hot was it?",
likes: 0,
replies: [],
},
],
},

{
id: "p3",
author: "Sam Rivera",
location: "Los Angeles, CA",
images: [
"https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80",
],
title: "City nights",
description:
"Camera roll going crazy 📸 LA hits different after dark.",
likes: 87,
createdAt: new Date().toISOString(),
comments: [
{
id: "c8",
user: "Maya Chen",
text: "LA hits different at night.",
likes: 2,
replies: [],
},
{
id: "c9",
user: "Ethan",
text: "This skyline is unreal.",
likes: 1,
replies: [
{
id: "r3",
user: "Sam Rivera",
text: "Downtown view never disappoints.",
likes: 0,
replies: [],
},
],
},
{
id: "c10",
user: "Ava",
text: "Where in LA is this?",
likes: 0,
replies: [],
},
],
},

{
id: "p4",
author: "Olivia Brooks",
location: "Tokyo, Japan",
images: [
"https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
],
title: "Neon dreams in Tokyo",
description:
"Shibuya crossing at night feels like stepping into the future.",
likes: 214,
createdAt: new Date().toISOString(),
comments: [
{
id: "c11",
user: "Lucas",
text: "Tokyo is on my list.",
likes: 3,
replies: [
{
id: "r4",
user: "Olivia Brooks",
text: "You HAVE to go at night.",
likes: 1,
replies: [],
},
],
},
{
id: "c12",
user: "Mia",
text: "The neon lights look insane.",
likes: 0,
replies: [],
},
{
id: "c13",
user: "Noah",
text: "Is it as crowded as it looks?",
likes: 0,
replies: [],
},
],
},

{
id: "p5",
author: "Ethan Cole",
location: "Iceland",
images: [
"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
],
title: "Chasing waterfalls",
description:
"Iceland waterfalls hit different. Cold, powerful, unforgettable.",
likes: 176,
createdAt: new Date().toISOString(),
comments: [
{
id: "c14",
user: "Sophia",
text: "Iceland is magical.",
likes: 2,
replies: [],
},
{
id: "c15",
user: "Maya Chen",
text: "Did you hike behind it?",
likes: 1,
replies: [
{
id: "r5",
user: "Ethan Cole",
text: "Yes! Got completely soaked 😂",
likes: 1,
replies: [],
},
],
},
{
id: "c16",
user: "Angelo Pineda",
text: "This is insane.",
likes: 0,
replies: [],
},
],
},
];

const PostsContext = createContext<PostsContextType | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const addPost = (
    post: Omit<Post, "comments"> & { comments?: Comment[] }
  ) => {
    setPosts((prev) => [
      { ...post, comments: post.comments ?? [] },
      ...prev,
    ]);
  };

  const toggleLike = (postId: string) => {
  setLikedPosts((prev) => {
    const next = new Set(prev);
    const isLiked = next.has(postId);

    if (isLiked) {
      next.delete(postId);
    } else {
      next.add(postId);
    }

    // update likes at same time
    setPosts((postsPrev) =>
      postsPrev.map((p) =>
        p.id === postId
          ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    return next;
  });
};

  const addComment = (postId: string, text: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
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

  const addReply = (
    postId: string,
    commentId: string,
    text: string
  ) => {
    const addReplyRecursive = (
      comments: Comment[]
    ): Comment[] =>
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [
              ...comment.replies,
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
          replies: addReplyRecursive(comment.replies),
        };
      });

    setPosts((prev) =>
      prev.map((post) =>
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
    <PostsContext.Provider
      value={{
        posts,
        addPost,
        toggleLike,
        likedPosts,
        addComment,
        addReply,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx)
    throw new Error(
      "usePosts must be used within PostsProvider"
    );
  return ctx;
}