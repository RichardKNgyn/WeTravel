import { PostsProvider } from "@/hooks/use-posts";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <PostsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PostsProvider>
  );
}