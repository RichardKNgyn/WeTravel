import { PostsProvider } from "@/hooks/use-posts";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <PostsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="post/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </PostsProvider>
  );
}