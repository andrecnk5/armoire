import { FontAwesome } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function CatalogoHeader({ destino, rotulo }: { destino: Href; rotulo: string }) {
  const router = useRouter();

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(destino);
    }
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        onPress={voltar}
        style={styles.voltar}
      >
        <FontAwesome name="arrow-left" size={16} color="#FFF" />
        <Text style={styles.texto}>{rotulo}</Text>
      </TouchableOpacity>
      <Image
        source={require('@/assets/images/armoire/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Armoire Central"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111',
  },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, flexShrink: 1 },
  texto: { color: '#FFF', fontSize: 12, flexShrink: 1 },
  logo: { width: 80, height: 35 },
});
