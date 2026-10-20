import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '../../i18n';
import { Pet3D } from '../../components/Pet3D';
import { MiiCreator } from '../../components/MiiCreator';
import { Glyph } from '../../components/Glyph';
import { haptic, PressableScale, Reveal } from '../../components/motion';
import { Chip, ui } from '../../components/ui';
import { randomizeTomodachiPet, SPECIES, SPECIES_PRESET_COLORS, type PetConfig, type PetSpecies } from '../../game/pet';
import { petTint, SHADOW, THEME } from '../../theme/colors';
import { styles } from './authStyles';
import { babble } from '../../services/babble';

/** Nombre sugerido para cada amigo (el jugador puede cambiarlo cuando quiera). */
const NAME_FOR: Record<PetSpecies, string> = {
  puff: 'Puffy',
  cat: 'Michi',
  dragon: 'Draco',
  bear: 'Bruno',
  bunny: 'Lumi',
  fox: 'Kiko',
  shark: 'Finn',
  penguin: 'Pingo',
  frog: 'Rana',
  panda: 'Bambú',
  chick: 'Pío',
  hamster: 'Mochi',
  axolotl: 'Axel',
};
const MORE_NAMES = ['Puffy', 'Mochi', 'Lumo', 'Kiko', 'Bruma', 'Nube'];

/**
 * Elegir compañero en dos toques: tocar un amigo (se presenta al instante) y confirmar.
 * El nombre viene sugerido; el creador completo queda como opción para quien quiera más.
 */
export function PetQuickPicker({
  draft,
  onChangeDraft,
  petName,
  onChangePetName,
  playerName,
  onChangePlayerName,
  pin,
  onChangePin,
  onSpeak,
  onBack,
  onNext,
}: {
  draft: PetConfig;
  onChangeDraft: (next: PetConfig) => void;
  petName: string;
  onChangePetName: (n: string) => void;
  playerName: string;
  onChangePlayerName: (n: string) => void;
  pin: string;
  onChangePin: (p: string) => void;
  onSpeak: (text: string, pitch: number, rate: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [reactKey, setReactKey] = useState(0);
  const [customize, setCustomize] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const shownName = petName.trim() || NAME_FOR[draft.species];
  const preview: PetConfig = { ...draft, name: shownName };

  const pick = (id: PetSpecies) => {
    const preset = SPECIES_PRESET_COLORS[id];
    haptic('select');
    onChangeDraft({ ...draft, species: id, bodyColor: preset.bodyColor, bellyColor: preset.bellyColor, catchphrase: preset.defaultCatchphrase, voicePitch: preset.defaultPitch });
    if (!nameTouched) onChangePetName(NAME_FOR[id]);
    setReactKey((k) => k + 1);
    // Se presenta en su idioma (balbuceo con su tono de voz)
    babble(`Hi! I'm ${nameTouched ? shownName : NAME_FOR[id]}!`, { pitch: preset.defaultPitch });
  };

  return (
    <View style={{ flex: 1, backgroundColor: petTint(draft.bodyColor, 0.88) }}>
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
          <Text style={styles.navPillLabel}>PASO 1 DE 2</Text>
          <PressableScale
            onPress={() => {
              haptic('success');
              const r = randomizeTomodachiPet(petName);
              onChangeDraft(r);
              setReactKey((k) => k + 1);
            }}
            style={styles.roundNavBtn}
            accessibilityLabel="Sorpréndeme"
          >
            <Ionicons name="shuffle" size={20} color={THEME.ink} />
          </PressableScale>
        </View>

        <Reveal index={0} style={styles.centerHeroBlock}>
          <Pet3D config={preview} mood="happy" size={230} reactKey={reactKey} onTap={() => setReactKey((k) => k + 1)} backgroundColor="transparent" />
          <Text style={styles.openCanvasTitle}>Elige a tu amigo</Text>
          <Text style={styles.openCanvasSubtitle}>Nacerá de un huevo y crecerá contigo mientras practicas inglés.</Text>
        </Reveal>

        <Reveal index={1} style={{ width: '100%' }}>
          <View style={[ui.rowWrap, { justifyContent: 'center', gap: 10 }]}>
            {SPECIES.map((sp) => {
              const active = draft.species === sp.id;
              return (
                <PressableScale
                  key={sp.id}
                  onPress={() => pick(sp.id)}
                  scaleTo={0.9}
                  hapticKind={null}
                  style={[styles.speciesQuickOrb, active && styles.speciesQuickOrbActive, { width: 58, height: 58 }]}
                  accessibilityLabel={sp.label}
                >
                  <Glyph name={sp.glyph} size={40} />
                </PressableScale>
              );
            })}
          </View>
        </Reveal>

        <Reveal index={2} style={{ width: '100%', gap: 10 }}>
          <TextInput
            value={petName}
            onChangeText={(t) => {
              setNameTouched(true);
              onChangePetName(t.slice(0, 14));
            }}
            placeholder={`Nombre de tu amigo (${NAME_FOR[draft.species]})`}
            placeholderTextColor={THEME.ink3}
            style={[styles.pillInput, styles.pillInputCentered]}
          />
          <View style={[ui.rowWrap, { justifyContent: 'center' }]}>
            {[NAME_FOR[draft.species], ...MORE_NAMES.filter((n) => n !== NAME_FOR[draft.species])].slice(0, 6).map((n) => (
              <Chip
                key={n}
                label={n}
                active={petName === n}
                onPress={() => {
                  setNameTouched(true);
                  onChangePetName(n);
                  setReactKey((k) => k + 1);
                }}
              />
            ))}
          </View>
          <TextInput
            value={playerName}
            onChangeText={(t) => onChangePlayerName(t.slice(0, 24))}
            placeholder="¿Y tú cómo te llamas? (opcional)"
            placeholderTextColor={THEME.ink3}
            style={styles.pillInput}
          />
        </Reveal>

        <View style={[ui.rowWrap, { justifyContent: 'center', gap: 8 }]}>
          <PressableScale onPress={() => setCustomize((v) => !v)} style={styles.optionalToggle}>
            <Ionicons name={customize ? 'chevron-up' : 'color-palette-outline'} size={15} color={THEME.ink2} />
            <Text style={styles.optionalToggleText}>{customize ? 'Ocultar el creador' : 'Personalizar a fondo (opcional)'}</Text>
          </PressableScale>
          <PressableScale onPress={() => setMoreOptions((v) => !v)} style={styles.optionalToggle}>
            <Ionicons name={pin ? 'lock-closed' : 'lock-open-outline'} size={15} color={THEME.ink2} />
            <Text style={styles.optionalToggleText}>PIN (si compartes el dispositivo)</Text>
          </PressableScale>
        </View>

        {moreOptions ? (
          <TextInput
            value={pin}
            onChangeText={(t) => onChangePin(t.replace(/\D/g, '').slice(0, 8))}
            placeholder="PIN de 4 dígitos"
            placeholderTextColor={THEME.ink3}
            secureTextEntry
            keyboardType="number-pad"
            style={styles.pillInput}
          />
        ) : null}

        {customize ? (
          <MiiCreator
            pet={preview}
            onChangePet={(patch) => onChangeDraft({ ...draft, ...patch })}
            playerLevel={1}
            showPreview={false}
            onSpeakSample={(text, pitch, rate) => onSpeak(`Hi! I am ${shownName}. ${text}`, pitch, rate)}
          />
        ) : null}
        <View style={{ height: 84 }} />
      </ScrollView>
      {/* Botón fijo abajo: el segundo toque siempre a la vista */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingBottom: 18, paddingTop: 10, alignItems: 'center' }}>
        <PressableScale onPress={onNext} scaleTo={0.96} style={[styles.primaryToonCta, SHADOW.float, { maxWidth: 440 }]}>
          <Text style={styles.primaryToonCtaText}>¡Elijo a {shownName}!</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </PressableScale>
      </View>
    </View>
  );
}
