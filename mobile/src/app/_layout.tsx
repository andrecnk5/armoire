import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Esconde a barra nativa para usarmos a customizada
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="produtos" />
      <Stack.Screen name="produto" />
    </Stack>
  );
}