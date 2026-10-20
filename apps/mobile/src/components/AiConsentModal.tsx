import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../i18n';
import { answerAiConsent, useAiConsentRequested } from '../services/aiConsent';
import { THEME } from '../theme/colors';

/** Pide permiso antes del primer envío de voz/texto a servicios de IA (App Store 5.1.2 / Play Data safety). */
export function AiConsentModal() {
  const visible = useAiConsentRequested();
  if (!visible) return null;
  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => answerAiConsent(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="sparkles" size={26} color="#7B5CFF" />
          </View>
          <Text style={styles.title}>¿Corregimos tu inglés con IA?</Text>
          <Text style={styles.body}>
            Para darte puntuación de pronunciación y comentarios, enviaremos tu grabación o tu texto a nuestro servidor y a
            proveedores de IA (Google Gemini, Microsoft Azure Speech, Deepgram y Anthropic Claude). Solo se usan para
            corregirte: no hay anuncios ni venta de datos y el audio no se guarda.
          </Text>
          <Text style={styles.small}>Puedes retirar este permiso cuando quieras en Ajustes. Sin él, la app usa el corrector sin conexión.</Text>
          <Pressable onPress={() => answerAiConsent(true)} style={styles.yes} accessibilityRole="button">
            <Text style={styles.yesText}>Aceptar y continuar</Text>
          </Pressable>
          <Pressable onPress={() => answerAiConsent(false)} style={styles.no} accessibilityRole="button">
            <Text style={styles.noText}>Ahora no</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,22,48,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 22, gap: 12, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F2EEFF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21, fontWeight: '900', color: THEME.ink, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 21, color: THEME.ink2, textAlign: 'center' },
  small: { fontSize: 12.5, color: THEME.ink3, textAlign: 'center' },
  yes: { alignSelf: 'stretch', backgroundColor: THEME.blue, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  yesText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  no: { paddingVertical: 8 },
  noText: { color: THEME.ink2, fontWeight: '700', fontSize: 15 },
});
