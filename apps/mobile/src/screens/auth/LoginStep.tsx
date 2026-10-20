import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CEFR_LEVEL_META } from '@lingopulse/shared';
import { Text, TextInput } from '../../i18n';
import { useGame, type PlayerAccount } from '../../context/GameContext';
import { AnimatedMiniFlame } from '../../components/FireStreakCard';
import { Pet3D } from '../../components/Pet3D';
import { haptic, PressableScale, Reveal } from '../../components/motion';
import { Button, ui } from '../../components/ui';
import { Glyph } from '../../components/Glyph';
import { levelFromXp, normalizePet, SPECIES, type PetConfig } from '../../game/pet';
import { SHADOW, THEME, TYPE } from '../../theme/colors';
import { AnimatedShowcaseBackdrop } from './AuthBackdrop';
import { styles } from './authStyles';

/**
 * Acceso de un jugador que ya existe en el dispositivo: tarjetas de perfil (con PIN si lo
 * tiene) o entrada manual con @usuario.
 */
export function LoginStep({
  fallbackPet,
  onBack,
  onCreateNew,
}: {
  fallbackPet: PetConfig;
  onBack: () => void;
  onCreateNew: () => void;
}) {
  const { accounts, loginWithAccount, loginWithCredentials } = useGame();
  const [selectedAccount, setSelectedAccount] = useState<PlayerAccount | null>(accounts[0] ?? null);
  const [showManualLogin, setShowManualLogin] = useState(accounts.length === 0);
  const [loginInput, setLoginInput] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [reactKey, setReactKey] = useState(0);

  const handleQuickAccountSelect = (acc: PlayerAccount) => {
    setLoginError(null);
    setSelectedAccount(acc);
    if (!acc.pin) {
      haptic('success');
      loginWithAccount(acc.id);
    } else {
      setLoginInput(acc.handle);
      setLoginPin('');
    }
  };

  const handleManualLogin = () => {
    setLoginError(null);
    if (selectedAccount && (!loginInput.trim() || loginInput === selectedAccount.handle)) {
      const res = loginWithAccount(selectedAccount.id, loginPin);
      if (!res.ok) setLoginError(res.error ?? 'No se pudo iniciar sesión.');
      else haptic('success');
      return;
    }
    const res = loginWithCredentials(loginInput, loginPin);
    if (!res.ok) setLoginError(res.error ?? 'No se pudo iniciar sesión.');
    else haptic('success');
  };

  const previewAcc = selectedAccount ?? accounts[0] ?? null;
  const previewPet: PetConfig = previewAcc
    ? normalizePet({
        name: previewAcc.petSummary.name,
        species: previewAcc.petSummary.species,
        bodyColor: previewAcc.petSummary.bodyColor,
        bellyColor: '#FFF5D6',
        eyeStyle: 'sparkle',
        accessory: 'crown',
      })
    : fallbackPet;

  return (
    <View style={{ flex: 1 }}>
      <AnimatedShowcaseBackdrop variant="pastel" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.openCanvasContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNavRow}>
          <PressableScale onPress={onBack} style={styles.roundNavBtn} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={20} color={THEME.ink} />
          </PressableScale>
          <Text style={styles.navPillLabel}>BIENVENIDO DE VUELTA</Text>
          <View style={{ width: 42 }} />
        </View>

        <Reveal index={0} style={styles.centerHeroBlock}>
          <Pet3D
            config={previewPet}
            mood="happy"
            size={165}
            reactKey={reactKey}
            onTap={() => setReactKey((k) => k + 1)}
            backgroundColor="transparent"
          />
          <Text style={styles.openCanvasTitle}>Elige tu isla de jugador</Text>
          <Text style={styles.openCanvasSubtitle}>Toca tu perfil para retomar tus islas del nivel elegido y tu racha.</Text>
        </Reveal>

        {accounts.length > 0 ? (
          <Reveal index={1} style={{ width: '100%', gap: 10 }}>
            {accounts.map((acc) => {
              const isSelected = selectedAccount?.id === acc.id;
              const playerLvl = levelFromXp(acc.statsSummary.xp);
              const spMeta = SPECIES.find((sp) => sp.id === acc.petSummary.species) ?? SPECIES[0]!;
              return (
                <PressableScale
                  key={acc.id}
                  onPress={() => handleQuickAccountSelect(acc)}
                  style={[styles.floatingAccountPill, isSelected && styles.floatingAccountPillSelected, SHADOW.card]}
                >
                  <View style={[styles.accountPetOrb, { backgroundColor: acc.petSummary.bodyColor }]}>
                    <Glyph name={spMeta.glyph} size={37} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={ui.row}>
                      <Text style={styles.accountName}>{acc.playerName}</Text>
                      <View style={[styles.accountLevelChip, { backgroundColor: `${CEFR_LEVEL_META[acc.statsSummary.level].color}20` }]}>
                        <Text style={[styles.accountLevelChipText, { color: CEFR_LEVEL_META[acc.statsSummary.level].color }]}>
                          Islas {acc.statsSummary.level}
                        </Text>
                      </View>
                      {acc.pin ? <Ionicons name="lock-closed" size={13} color={THEME.ink3} /> : null}
                    </View>
                    <Text style={styles.accountSub}>
                      {acc.petSummary.name} · Nv. {playerLvl} · {acc.statsSummary.xp} XP
                    </Text>
                  </View>
                  <View style={styles.accountFlameBox}>
                    <AnimatedMiniFlame lit={acc.statsSummary.streak > 0} size={26} />
                    <Text style={styles.accountFlameDays}>{acc.statsSummary.streak}d</Text>
                  </View>
                </PressableScale>
              );
            })}

            {selectedAccount?.pin ? (
              <View style={styles.openPinSheet}>
                <Text style={TYPE.headline}>PIN de {selectedAccount.playerName}</Text>
                <TextInput
                  value={loginPin}
                  onChangeText={setLoginPin}
                  placeholder="Ingresa tu PIN"
                  placeholderTextColor={THEME.ink3}
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={8}
                  style={styles.pillInput}
                />
                {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
                <Button label={`Entrar como ${selectedAccount.playerName}`} icon="arrow-forward" variant="gold" onPress={handleManualLogin} />
              </View>
            ) : null}
          </Reveal>
        ) : null}

        <Reveal index={2} style={{ width: '100%', gap: 12 }}>
          {accounts.length > 0 && !showManualLogin ? (
            <Button label="Ingresar con otro @usuario" icon="key-outline" variant="secondary" onPress={() => setShowManualLogin(true)} />
          ) : (
            <View style={styles.openFormBox}>
              <TextInput
                value={loginInput}
                onChangeText={(t) => {
                  setLoginInput(t);
                  setLoginError(null);
                }}
                placeholder="Tu nombre o @usuario"
                placeholderTextColor={THEME.ink3}
                autoCapitalize="none"
                style={styles.pillInput}
              />
              <TextInput
                value={loginPin}
                onChangeText={(t) => {
                  setLoginPin(t);
                  setLoginError(null);
                }}
                placeholder="PIN (dejar vacío si no tienes)"
                placeholderTextColor={THEME.ink3}
                secureTextEntry
                style={styles.pillInput}
              />
              {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
              <Button label="Entrar a mi cuenta" icon="arrow-forward" variant="primary" onPress={handleManualLogin} />
            </View>
          )}
          <Button label="Crear nuevo jugador y compañero 3D" icon="sparkles" variant="ghost" onPress={onCreateNew} />
        </Reveal>
      </ScrollView>
    </View>
  );
}
