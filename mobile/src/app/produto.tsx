import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatalogoHeader } from '@/components/catalogo-header';
import { formatarPreco, produtos } from '@/data/produtos';

export default function Produto() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const produto = typeof id === 'string' ? produtos.find((item) => item.id === id) : undefined;
  const { width } = useWindowDimensions();
  const larguraConteudo = Math.min(width, 1100) - 40;
  const larguraImagem = width >= 768 ? (larguraConteudo - 28) / 2 : larguraConteudo;

  return (
    <SafeAreaView style={styles.container}>
      <CatalogoHeader destino="/produtos" rotulo="Voltar ao catálogo" />
      {!produto ? (
        <View style={styles.ausente}>
          <Text accessibilityRole="header" style={styles.titulo}>Produto não encontrado</Text>
          <Text style={styles.texto}>Volte ao catálogo e escolha um dos produtos disponíveis para demonstração.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.conteudo}>
          <View style={[styles.produto, width >= 768 && styles.produtoAmplo]}>
            <View style={[styles.galeria, width >= 768 && styles.coluna]}>
              {produto.imagens.map((imagem, index) => (
                <Image
                  key={index}
                  source={imagem}
                  style={[styles.imagem, { height: larguraImagem / 0.8 }]}
                  resizeMode="contain"
                  accessibilityLabel={`${produto.nome}, imagem ${index + 1} de ${produto.imagens.length}`}
                />
              ))}
            </View>
            <View style={[styles.informacoes, width >= 768 && styles.coluna]}>
              <Text style={styles.categoria}>{produto.categoria}</Text>
              <Text accessibilityRole="header" style={styles.titulo}>{produto.nome}</Text>
              <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
              <Text style={styles.aviso}>
                Demonstração com dados locais. Preço de referência, sem consulta a estoque ou venda neste aplicativo.
              </Text>
              <Text style={styles.texto}>{produto.descricao}</Text>
              <Text style={styles.subtitulo}>COMPOSIÇÃO</Text>
              {produto.composicao.map((item) => <Text key={item} style={styles.item}>{item}</Text>)}
              <Text style={styles.subtitulo}>TAMANHOS NO CATÁLOGO</Text>
              <Text style={styles.item}>{produto.tamanhos.join(' · ')}</Text>
              <Text style={styles.subtitulo}>CORES NO CATÁLOGO</Text>
              <Text style={styles.item}>{produto.cores.map((cor) => cor.nome).join(' · ')}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  scroll: { backgroundColor: '#FFF' },
  conteudo: { padding: 20, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  produto: { gap: 28 },
  produtoAmplo: { flexDirection: 'row', alignItems: 'flex-start' },
  galeria: { gap: 16 },
  coluna: { flex: 1 },
  imagem: { width: '100%', backgroundColor: '#F4F4F2' },
  informacoes: { minWidth: 0 },
  categoria: { fontSize: 11, color: '#777', marginBottom: 8 },
  titulo: { fontSize: 28, fontWeight: '500', color: '#111' },
  preco: { fontSize: 22, color: '#111', marginTop: 16 },
  aviso: { fontSize: 12, lineHeight: 19, color: '#666', marginTop: 16 },
  texto: { fontSize: 14, lineHeight: 23, color: '#444', marginTop: 20 },
  subtitulo: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: '#111', marginTop: 28, marginBottom: 10 },
  item: { fontSize: 13, lineHeight: 22, color: '#666' },
  ausente: { flex: 1, padding: 24, backgroundColor: '#FFF' },
});
