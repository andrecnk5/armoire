import { useRouter } from 'expo-router';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatalogoHeader } from '@/components/catalogo-header';
import { formatarPreco, produtos } from '@/data/produtos';

export default function Produtos() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const colunas = width < 360 ? 1 : width < 768 ? 2 : 3;
  const larguraCard = (Math.min(width, 1100) - 40 - (colunas - 1) * 16) / colunas;

  return (
    <SafeAreaView style={styles.container}>
      <CatalogoHeader destino="/" rotulo="Voltar ao início" />
      <FlatList
        key={colunas}
        data={produtos}
        keyExtractor={(item) => item.id}
        numColumns={colunas}
        style={styles.lista}
        contentContainerStyle={styles.conteudo}
        columnWrapperStyle={colunas > 1 ? styles.linha : undefined}
        ListHeaderComponent={
          <View style={styles.introducao}>
            <Text style={styles.overline}>ARMOIRE CENTRAL</Text>
            <Text accessibilityRole="header" style={styles.titulo}>NOSSA COLEÇÃO</Text>
            <Text style={styles.aviso}>
              Catálogo demonstrativo com dados locais da Armoire Central. Preços de referência, sem consulta a estoque ou venda neste aplicativo.
            </Text>
            <Text style={styles.contagem}>{produtos.length} produtos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Ver ${item.nome}, ${item.categoria}, ${formatarPreco(item.preco)}`}
            style={[styles.card, { width: larguraCard }]}
            onPress={() => router.push({ pathname: '/produto', params: { id: item.id } })}
          >
            <Image source={item.imagens[0]} style={[styles.imagem, { height: larguraCard / 0.8 }]} resizeMode="contain" />
            <Text style={styles.categoria}>{item.categoria}</Text>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.preco}>{formatarPreco(item.preco)}</Text>
            <Text style={styles.detalhes}>VER DETALHES</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  lista: { backgroundColor: '#FFF', width: '100%', maxWidth: 1100, alignSelf: 'center' },
  conteudo: { padding: 20 },
  linha: { gap: 16 },
  introducao: { marginBottom: 28 },
  overline: { fontSize: 10, letterSpacing: 3, color: '#777', marginBottom: 10 },
  titulo: { fontSize: 28, fontWeight: '500', color: '#111' },
  aviso: { fontSize: 12, lineHeight: 19, color: '#666', marginTop: 14 },
  contagem: { fontSize: 11, color: '#777', marginTop: 16 },
  card: { marginBottom: 28 },
  imagem: { width: '100%', backgroundColor: '#F4F4F2' },
  categoria: { fontSize: 11, color: '#777', marginTop: 12 },
  nome: { fontSize: 16, fontWeight: '500', color: '#111', marginTop: 5 },
  preco: { fontSize: 14, color: '#111', marginTop: 8 },
  detalhes: { fontSize: 10, letterSpacing: 1.5, color: '#111', marginTop: 12 },
});
