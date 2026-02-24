import { Stack } from "expo-router";
import { PostsProvider } from "@/hooks/use-posts";

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
