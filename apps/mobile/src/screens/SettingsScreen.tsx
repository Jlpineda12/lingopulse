import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '../i18n';
import { useGame } from '../context/GameContext';
import { Card, Eyebrow, ScreenHeader, ui } from '../components/ui';
import { PressableScale } from '../components/motion';
import { hasAiConsent, revokeAiConsent } from '../services/aiConsent';
import { THEME, TYPE } from '../theme/colors';

/** Correo de soporte que aparece en la ficha de las tiendas y en la política de privacidad. */
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '';

function Row({
  icon,
  label,
  hint,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} hapticKind="select" style={styles.row} accessibilityLabel={label}>
      <View style={[styles.rowIcon, danger && { backgroundColor: '#FFE8EC' }]}>
        <Ionicons name={icon} size={18} color={danger ? THEME.red : THEME.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: THEME.red }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={THEME.ink3} />
    </PressableScale>
  );
}

/** Ajustes: cuenta, privacidad, permisos de IA, tutorial y eliminación de datos (requisito de las tiendas). */
export function SettingsScreen() {
  const { goBack, currentAccount, logout, deleteAccount, replayTutorial, openScreen, setTab } = useGame();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    void hasAiConsent().then(setConsent);
  }, []);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={ui.screen}>
      <ScreenHeader title="Ajustes" subtitle={currentAccount ? `${currentAccount.playerName} · ${currentAccount.handle}` : undefined} onBack={goBack} icon="settings" gradient="daily" />

      <Card style={{ gap: 4 }}>
        <Eyebrow icon="person">Tu cuenta</Eyebrow>
        <Row
          icon="school-outline"
          label="Ver el tutorial otra vez"
          onPress={() => {
            replayTutorial();
            goBack();
            setTab('home');
          }}
        />
        <Row icon="people-outline" label="Cambiar de jugador" hint="Tu progreso queda guardado en este dispositivo." onPress={logout} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Eyebrow icon="shield-checkmark">Privacidad</Eyebrow>
        <Row icon="document-text-outline" label="Política de privacidad" onPress={() => openScreen({ name: 'privacy' })} />
        <Row
          icon="sparkles-outline"
          label={consent ? 'Retirar permiso de IA' : 'Permiso de IA: no concedido'}
          hint={
            consent
              ? 'Tu voz y tus textos se envían a servicios de IA solo para corregirlos. Si lo retiras, se usa el corrector sin conexión.'
              : 'Te lo pediremos la próxima vez que uses speaking o writing con IA.'
          }
          onPress={() => {
            if (consent) void revokeAiConsent().then(() => setConsent(false));
          }}
        />
        {SUPPORT_EMAIL ? (
          <Row icon="mail-outline" label="Contactar soporte" hint={SUPPORT_EMAIL} onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        ) : null}
      </Card>

      <Card style={{ gap: 10 }}>
        <Eyebrow icon="trash" color={THEME.red}>Eliminar cuenta</Eyebrow>
        <Text style={TYPE.footnote}>
          Borra tu jugador, tu progreso, tu mascota y tus ajustes de este dispositivo. No se puede deshacer. No guardamos copias de tus datos en nuestros servidores.
        </Text>
        {!confirming ? (
          <Row icon="trash-outline" label="Eliminar mi cuenta y mis datos" danger onPress={() => setConfirming(true)} />
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={[TYPE.callout, { fontWeight: '700' }]}>Escribe ELIMINAR para confirmar</Text>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              placeholder="ELIMINAR"
              placeholderTextColor={THEME.ink3}
              style={styles.input}
            />
            <View style={ui.row}>
              <PressableScale onPress={() => { setConfirming(false); setTyped(''); }} style={[styles.btn, { backgroundColor: THEME.fill }]}>
                <Text style={[styles.btnText, { color: THEME.ink }]}>Cancelar</Text>
              </PressableScale>
              <PressableScale
                disabled={typed.trim().toUpperCase() !== 'ELIMINAR' || !currentAccount}
                onPress={() => {
                  if (!currentAccount) return;
                  void revokeAiConsent();
                  deleteAccount(currentAccount.id);
                }}
                style={[styles.btn, { backgroundColor: THEME.red, opacity: typed.trim().toUpperCase() === 'ELIMINAR' ? 1 : 0.4 }]}
              >
                <Text style={styles.btnText}>Eliminar para siempre</Text>
              </PressableScale>
            </View>
          </View>
        )}
      </Card>

      <Text style={styles.version}>LingoPulse {version}</Text>
    </View>
  );
}

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'Qué datos usamos',
    body: 'Tu nombre de jugador, alias, PIN opcional, nivel, progreso, racha y la configuración de tu mascota se guardan solo en este dispositivo. No necesitas correo ni teléfono para usar LingoPulse.',
  },
  {
    title: 'Voz y textos para la IA',
    body: 'Cuando haces actividades de speaking o writing con corrección inteligente, y solo si lo aceptas, enviamos tu grabación o tu texto a nuestro servidor. Este los reenvía a proveedores de IA (Google Gemini, Microsoft Azure Speech, Deepgram y Anthropic Claude) únicamente para transcribir y darte retroalimentación. El audio se guarda en memoria como máximo 10 minutos y no se usa para publicidad ni para entrenar modelos propios.',
  },
  {
    title: 'Lo que no hacemos',
    body: 'No mostramos anuncios, no vendemos datos, no usamos rastreadores de terceros ni compartimos información con redes sociales.',
  },
  {
    title: 'Micrófono',
    body: 'El micrófono solo se activa cuando tocas el botón de grabar. Puedes quitar el permiso en los ajustes del teléfono en cualquier momento.',
  },
  {
    title: 'Tus decisiones',
    body: 'Puedes retirar el permiso de IA en Ajustes (la app seguirá funcionando con el corrector sin conexión) y eliminar tu cuenta y todos tus datos desde Ajustes → Eliminar cuenta.',
  },
  {
    title: 'Edad',
    body: 'LingoPulse está pensado para mayores de 13 años. Si eres menor, usa la app con permiso de tu madre, padre o tutor.',
  },
];

export function PrivacyScreen() {
  const { goBack } = useGame();
  return (
    <View style={ui.screen}>
      <ScreenHeader title="Política de privacidad" subtitle="Resumen claro de cómo cuidamos tus datos" onBack={goBack} icon="shield-checkmark" gradient="daily" />
      {SECTIONS.map((sec) => (
        <Card key={sec.title} style={{ gap: 6 }}>
          <Text style={[TYPE.headline]}>{sec.title}</Text>
          <Text style={TYPE.body}>{sec.body}</Text>
        </Card>
      ))}
      {SUPPORT_EMAIL ? <Text style={styles.version}>Dudas: {SUPPORT_EMAIL}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15.5, fontWeight: '700', color: THEME.ink },
  rowHint: { fontSize: 12.5, color: THEME.ink2, marginTop: 2 },
  input: { borderWidth: 1.5, borderColor: THEME.fill2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: THEME.ink },
  btn: { flex: 1, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  version: { textAlign: 'center', color: THEME.ink3, fontSize: 12, marginTop: 4 },
});
