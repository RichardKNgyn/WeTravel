export type Post = {
  id: string;
  user: string;
  location?: string;
  image: string;
  caption: string;
  likes: number;
};

export const POSTS: Post[] = [
  {
    id: "1",
    user: "Angelo Pineda",
    location: "Peru",
    image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80",
    caption: "Random llama encounter 🦙 unreal vibes.",
    likes: 128,
  },
  {
    id: "2",
    user: "Maya Chen",
    location: "Jordan",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
    caption: "Desert heat + ancient stones = main character energy 🏜️",
    likes: 302,
  },
  {
    id: "3",
    user: "Sam Rivera",
    location: "LA",
    image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80",
    caption: "City nights. Camera roll going crazy 📸",
    likes: 87,
  },
];
