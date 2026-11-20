import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Home() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <View style={styles.container}>
      {/* BARRA SUPERIOR */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>
          FRETE GRÁTIS PARA TODO BRASIL EM COMPRAS ACIMA DE R$499
        </Text>
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image
            source={require('@/assets/images/armoire/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="search" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="user-o" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/produtos')}
          >
            <FontAwesome name="shopping-bag" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setMenuVisible(true)}
          >
            <FontAwesome name="bars" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MENU MODAL (Menu Sanduíche) */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.menuLateral}>
            <View style={styles.menuTopo}>
              <Text style={styles.menuTopoTitle}>MENU</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <FontAwesome name="close" size={22} color="#111" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuLinks}>
              <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/'); }}>
                <Text style={styles.menuLinkText}>INÍCIO</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMenuVisible(false); router.push('/produtos'); }}>
                <Text style={styles.menuLinkText}>PRODUTOS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Text style={styles.menuLinkText}>QUEM SOMOS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Text style={styles.menuLinkText}>FALE CONOSCO</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuInferior}>
              <Text style={styles.menuInferiorTitle}>ARMOIRE CENTRAL</Text>
              <Text style={styles.menuInferiorSub}>PADRÃO BÁSICO. LEGADO ETERNO.</Text>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Image
            source={require('@/assets/images/armoire/banneraf.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroOverline}>ARMOIRE CENTRAL</Text>
            <Text style={styles.heroTitle}>
              PADRÃO BÁSICO.{'\n'}LEGADO ETERNO.
            </Text>
            <Text style={styles.heroSub}>
              Peças essenciais com qualidade impecável e elegância que atravessa gerações.
            </Text>
            <TouchableOpacity
              style={styles.btnColecao}
              onPress={() => router.push('/produtos')}
            >
              <Text style={styles.btnColecaoText}>CONHEÇA A COLEÇÃO</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INTRODUÇÃO */}
        <View style={styles.introSection}>
          <Text style={styles.introOverline}>ARMOIRE CENTRAL</Text>
          <Text style={styles.introTitle}>
            ESSENCIAL.{'\n'}SOFISTICADO.{'\n'}ATEMPORAL.
          </Text>
          <Text style={styles.introSub}>
            Uma seleção criada para quem entende que estilo não precisa ser excessivo.
          </Text>
        </View>

        {/* DESTAQUE */}
        <View style={styles.destaqueSection}>
          <Image
            source={require('@/assets/images/armoire/bannerpd.png')}
            style={styles.destaqueImage}
            resizeMode="cover"
          />
          <View style={styles.destaqueContent}>
            <Text style={styles.destaqueOverline}>NOVA COLEÇÃO</Text>
            <Text style={styles.destaqueTitle}>
              O ESSENCIAL{'\n'}EM NOVA FORMA.
            </Text>
            <Text style={styles.destaqueSub}>
              Descubra peças desenvolvidas para acompanhar todos os momentos.
            </Text>
            <TouchableOpacity style={styles.btnColecaoDark}>
              <Text style={styles.btnColecaoDarkText}>CONHEÇA-NOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIAS */}
        <View style={styles.categoriasSection}>
          <View style={styles.tituloSecao}>
            <Text style={styles.secaoOverline}>EXPLORE</Text>
            <Text style={styles.secaoTitle}>NOSSAS PRINCIPAIS CATEGORIAS</Text>
          </View>

          <View style={styles.categoriasGrid}>
            <TouchableOpacity style={styles.categoriaCard} onPress={() => router.push('/produtos')}>
              <Image source={require('@/assets/images/armoire/categoria-polo.png')} style={styles.categoriaImg} />
              <View style={styles.categoriaOverlay}>
                <Text style={styles.categoriaTitle}>CAMISETAS & POLOS</Text>
                <Text style={styles.categoriaSub}>EXPLORAR</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoriaCard} onPress={() => router.push('/produtos')}>
              <Image source={require('@/assets/images/armoire/categoria-camisa.png')} style={styles.categoriaImg} />
              <View style={styles.categoriaOverlay}>
                <Text style={styles.categoriaTitle}>CAMISAS</Text>
                <Text style={styles.categoriaSub}>EXPLORAR</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoriaCard} onPress={() => router.push('/produtos')}>
              <Image source={require('@/assets/images/armoire/categoria-calca.png')} style={styles.categoriaImg} />
              <View style={styles.categoriaOverlay}>
                <Text style={styles.categoriaTitle}>CALÇAS & BERMUDAS</Text>
                <Text style={styles.categoriaSub}>EXPLORAR</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.categoriaCard} onPress={() => router.push('/produtos')}>
              <Image source={require('@/assets/images/armoire/categoria-acessorios.png')} style={styles.categoriaImg} />
              <View style={styles.categoriaOverlay}>
                <Text style={styles.categoriaTitle}>ACESSÓRIOS</Text>
                <Text style={styles.categoriaSub}>EXPLORAR</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* BENEFÍCIOS */}
        <View style={styles.beneficiosGrid}>
          <View style={styles.beneficioItem}>
            <FontAwesome name="diamond" size={20} color="#222" />
            <Text style={styles.beneficioTitle}>QUALIDADE PREMIUM</Text>
            <Text style={styles.beneficioSub}>Materiais selecionados.</Text>
          </View>
          <View style={styles.beneficioItem}>
            <FontAwesome name="shield" size={20} color="#222" />
            <Text style={styles.beneficioTitle}>COMPRA SEGURA</Text>
            <Text style={styles.beneficioSub}>Ambiente protegido.</Text>
          </View>
          <View style={styles.beneficioItem}>
            <FontAwesome name="truck" size={20} color="#222" />
            <Text style={styles.beneficioTitle}>FRETE GRÁTIS</Text>
            <Text style={styles.beneficioSub}>Acima de R$499.</Text>
          </View>
          <View style={styles.beneficioItem}>
            <FontAwesome name="refresh" size={20} color="#222" />
            <Text style={styles.beneficioTitle}>TROCA FÁCIL</Text>
            <Text style={styles.beneficioSub}>Até 7 dias.</Text>
          </View>
        </View>

        {/* NEWSLETTER */}
        <View style={styles.newsletterSection}>
          <Text style={styles.newsOverline}>ARMOIRE CENTRAL</Text>
          <Text style={styles.newsTitle}>ENTRE PARA O{'\n'}UNIVERSO ARMOIRE.</Text>
          <Text style={styles.newsSub}>
            Receba novidades, lançamentos e conteúdos exclusivos.
          </Text>
          <View style={styles.newsForm}>
            <TextInput
              style={styles.newsInput}
              placeholder="Seu melhor e-mail"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity style={styles.newsButton}>
              <Text style={styles.newsButtonText}>INSCREVER-SE</Text>
              <FontAwesome name="arrow-right" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Image
            source={require('@/assets/images/armoire/logoinv.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <View style={styles.footerCol}>
            <Text style={styles.footerColTitle}>ARMOIRE CENTRAL</Text>
            <Text style={styles.footerLink}>Quem somos</Text>
            <Text style={styles.footerLink}>Nossa história</Text>
            <Text style={styles.footerLink}>Contato</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerColTitle}>ATENDIMENTO</Text>
            <Text style={styles.footerLink}>Fale conosco</Text>
            <Text style={styles.footerLink}>Trocas e devoluções</Text>
            <Text style={styles.footerLink}>Política de privacidade</Text>
          </View>
          <Text style={styles.footerCopy}>© 2026 Armoire Central</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: {
    backgroundColor: '#111',
    paddingVertical: 8,
    alignItems: 'center',
  },
  topBarText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#111',
  },
  logo: { width: 80, height: 35 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  iconButton: { padding: 4 },
  
  // Hero
  heroSection: { height: 500, position: 'relative', justifyContent: 'flex-end', padding: 24 },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroContent: { zIndex: 2 },
  heroOverline: { color: '#FFF', fontSize: 10, letterSpacing: 3, marginBottom: 10 },
  heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '600', lineHeight: 36 },
  heroSub: { color: '#EEE', fontSize: 13, marginVertical: 16, lineHeight: 20 },
  btnColecao: {
    borderWidth: 1,
    borderColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  btnColecaoText: { color: '#FFF', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },

  // Intro
  introSection: { padding: 50, alignItems: 'center', textAlign: 'center' },
  introOverline: { fontSize: 10, letterSpacing: 3, color: '#777', marginBottom: 15 },
  introTitle: { fontSize: 28, fontWeight: '500', textAlign: 'center', lineHeight: 32 },
  introSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 20 },

  // Destaque
  destaqueSection: { backgroundColor: '#F4F4F2' },
  destaqueImage: { width: '100%', height: 350 },
  destaqueContent: { padding: 30 },
  destaqueOverline: { fontSize: 10, letterSpacing: 2, color: '#777', marginBottom: 10 },
  destaqueTitle: { fontSize: 26, fontWeight: '500', lineHeight: 30 },
  destaqueSub: { fontSize: 13, color: '#666', marginVertical: 15, lineHeight: 20 },
  btnColecaoDark: {
    borderWidth: 1,
    borderColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  btnColecaoDarkText: { color: '#111', fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },

  // Categorias
  categoriasSection: { padding: 20, marginVertical: 20 },
  tituloSecao: { alignItems: 'center', marginBottom: 25 },
  secaoOverline: { fontSize: 10, letterSpacing: 3, color: '#777', marginBottom: 5 },
  secaoTitle: { fontSize: 18, fontWeight: '500' },
  categoriasGrid: { gap: 15 },
  categoriaCard: { height: 250, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  categoriaImg: { width: '100%', height: '100%' },
  categoriaOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
  },
  categoriaTitle: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  categoriaSub: { color: '#FFF', fontSize: 9, letterSpacing: 2, marginTop: 4 },

  // Beneficios
  beneficiosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E7E7E7',
  },
  beneficioItem: { width: '50%', alignItems: 'center', padding: 15 },
  beneficioTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 10 },
  beneficioSub: { fontSize: 11, color: '#777', marginTop: 4 },

  // Newsletter
  newsletterSection: { backgroundColor: '#111', padding: 35, alignItems: 'center' },
  newsOverline: { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  newsTitle: { color: '#FFF', fontSize: 26, fontWeight: '500', textAlign: 'center', lineHeight: 30 },
  newsSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center', marginVertical: 15 },
  newsForm: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    marginTop: 10,
    width: '100%',
  },
  newsInput: { flex: 1, height: 45, color: '#FFF', fontSize: 12 },
  newsButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  newsButtonText: { color: '#FFF', fontSize: 9, fontWeight: '600', letterSpacing: 1 },

  // Footer
  footer: { padding: 30, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E5E5' },
  footerLogo: { width: 130, height: 40, marginBottom: 20 },
  footerCol: { marginBottom: 20 },
  footerColTitle: { fontSize: 9, fontWeight: '600', letterSpacing: 2, marginBottom: 10 },
  footerLink: { color: '#777', fontSize: 12, marginBottom: 6 },
  footerCopy: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderColor: '#E8E8E8', color: '#999', fontSize: 10 },

  // Modal Menu
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuLateral: { backgroundColor: '#FFF', height: '80%', padding: 25 },
  menuTopo: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#E8E8E8', paddingBottom: 15 },
  menuTopoTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  menuLinks: { marginTop: 30, gap: 20 },
  menuLinkText: { fontSize: 18, fontWeight: '500', color: '#111' },
  menuInferior: { marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderColor: '#E8E8E8' },
  menuInferiorTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  menuInferiorSub: { fontSize: 9, color: '#777', marginTop: 4 },
});