import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { Pet3D } from '../components/Pet3D';
import { Glyph } from '../components/Glyph';
import { HouseSection, Price } from '../components/HouseSection';
import { ActivityRings, AnimatedBar, PressableScale, Reveal } from '../components/motion';
import { Badge, Button, Card, Eyebrow, ui, type IconName } from '../components/ui';
import {
  ACCESSORIES,
  BELLY_COLORS,
  BLUSH_STYLES,
  BODY_COLORS,
  BODY_SCALES,
  BROW_STYLES,
  EYE_STYLES,
  FOODS,
  HABITAT_PROPS,
  HOUSE_TIERS,
  levelProgress,
  MOOD_META,
  moodMessage,
  MOUTH_STYLES,
  OUTFITS,
  PERSONALITIES,
  randomizeTomodachiPet,
  SPECIES,
  SPECIES_PRESET_COLORS,
  STREAK_SURPRISE_GIFTS,
  SUGGESTED_CATCHPHRASES,
  VOICE_PRESETS,
  type PetMood,
} from '../game/pet';
import {
  HabitatPropIllustration,
  StreakSurpriseGiftsSection,
  TomodachiDreamModal,
} from '../components/GameVfx';
import { GRADIENTS, petTint, SHADOW, THEME, TYPE, type GradientKey } from '../theme/colors';
import { NEED_RINGS } from './HomeScreen';

const LIVE_EMOTION_BUTTONS: Array<{
  mood: PetMood;
  label: string;
  triggerHint: string;
}> = [
  { mood: 'happy', label: 'Feliz', triggerHint: 'Estado base' },
  { mood: 'love', label: 'Cariño', triggerHint: 'Al acariciar' },
  { mood: 'eating', label: 'Comer', triggerHint: 'Al alimentar' },
  { mood: 'celebrate', label: 'Victoria', triggerHint: 'Al acertar' },
  { mood: 'angry', label: 'Enojo', triggerHint: '1er fallo' },
  { mood: 'rage', label: 'Ira', triggerHint: '2+ fallos' },
  { mood: 'sleepy', label: 'Dormid@', triggerHint: 'Baja energía' },
];

type CreatorTab = 'body' | 'face' | 'soul' | 'hats' | 'outfit' | 'habitat';
type PetSection = 'care' | 'house' | 'style' | 'gifts';

const PET_SECTIONS: Array<{ id: PetSection; label: string; glyph: string; hint: string }> = [
  { id: 'care', label: 'Cuidar', glyph: 'heart', hint: 'Necesidades, comida, juegos y reacciones.' },
  { id: 'house', label: 'Casa', glyph: 'house', hint: 'Mejora su hogar y decóralo con muebles.' },
  { id: 'style', label: 'Estilo', glyph: 'outfit-vest', hint: 'Cambia especie, rostro, ropa, gorros y voz.' },
  { id: 'gifts', label: 'Premios', glyph: 'gift', hint: 'Regalos que se desbloquean con tu racha.' },
];

export function PetScreen() {
  const {
    pet,
    stats,
    mood,
    progress,
    playerLevel,
    updatePet,
    feedPet,
    playWithPet,
    petThePet,
    triggerPetEmotion,
    buyOrEquipProp,
    solveDreamBubble,
    claimSurpriseGift,
    house,
    buyOrWearOutfit,
  } = useGame();
  const { speakWithPip, pipIsSpeaking } = useAppState();
  const [reactKey, setReactKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [creatorTab, setCreatorTab] = useState<CreatorTab>('face');
  const [dreamModalVisible, setDreamModalVisible] = useState(false);
  const [section, setSection] = useState<PetSection>('care');
  const nextTier = HOUSE_TIERS[house.tier + 1];
  const sectionDots: Record<PetSection, boolean> = {
    care: stats.fullness < 30 || stats.energy < 30 || stats.happiness < 30,
    house: !!nextTier && progress.coins >= nextTier.coinCost && (progress.stars ?? 0) >= nextTier.starCost,
    style: false,
    gifts: STREAK_SURPRISE_GIFTS.some((g) => !(progress.claimedGifts ?? []).includes(g.id) && progress.streak >= g.minStreak),
  };
  const lvl = levelProgress(progress.xp);
  const msg = moodMessage(pet.name, mood, pet.catchphrase);
  const tint = petTint(pet.bodyColor, 0.82);
  const speciesInfo = SPECIES_PRESET_COLORS[pet.species];
  const moodInfo = MOOD_META[mood] ?? MOOD_META.happy;
  const personalityObj =
    PERSONALITIES.find((p) => p.id === (pet.personality ?? 'energetic')) ?? PERSONALITIES[0]!;

  const act = (res: { ok: boolean; reason?: string }, okMsg: string) => {
    if (res.ok) {
      setReactKey((k) => k + 1);
      setNotice(okMsg);
    } else setNotice(res.reason ?? null);
  };

  return (
    <View style={ui.screen}>
      <Reveal index={0}>
        <View style={ui.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={TYPE.caption}>Tu compañero</Text>
            {editing ? (
              <TextInput
                value={pet.name}
                autoFocus
                onChangeText={(name) => updatePet({ name: name.slice(0, 14) })}
                onBlur={() => setEditing(false)}
                style={[TYPE.largeTitle, styles.nameInput]}
                accessibilityLabel="Nombre de la mascota"
              />
            ) : (
              <PressableScale
                onPress={() => setEditing(true)}
                hapticKind="select"
                style={{ alignSelf: 'flex-start' }}
              >
                <View style={ui.row}>
                  <Text style={TYPE.largeTitle}>{pet.name}</Text>
                  <Ionicons name="pencil" size={16} color={THEME.blue} />
                </View>
              </PressableScale>
            )}
            <View style={ui.row}>
              <Glyph name={personalityObj.glyph} size={18} />
              <Text style={styles.personalitySub}>
                Personalidad {personalityObj.labelEs} · Muletilla: “{pet.catchphrase || "Let's go!"}”
              </Text>
            </View>
          </View>
          <Badge label={`Nivel ${playerLevel}`} color={THEME.gold} bg={THEME.goldLight} icon="ribbon" />
        </View>
      </Reveal>

      <Reveal index={1}>
        <View
          style={[
            styles.stage,
            { backgroundColor: tint },
            (mood === 'angry' || mood === 'rage') && {
              borderColor: moodInfo.badgeColor,
              backgroundColor: moodInfo.badgeBg,
            },
            SHADOW.card,
          ]}
        >
          <View style={styles.stageTop}>
            <View
              style={[
                styles.moodPill,
                { backgroundColor: moodInfo.badgeBg, borderColor: moodInfo.badgeColor },
              ]}
            >
              <Glyph name={moodInfo.glyph} size={20} />
              <Text style={[styles.moodPillText, { color: moodInfo.badgeColor }]}>
                {moodInfo.labelEs}
              </Text>
            </View>
            <PressableScale
              hapticKind="select"
              onPress={() => {
                triggerPetEmotion('sleepy', 9500);
                setDreamModalVisible(true);
              }}
              style={styles.dreamTriggerPill}
            >
              <View style={ui.row}>
                <Glyph name="moon" size={18} />
                <Text style={styles.dreamTriggerText}>Espiar sueño</Text>
              </View>
            </PressableScale>
          </View>

          <Pet3D
            config={pet}
            mood={mood}
            size={320}
            aspectRatio={house.tier > 0 ? 0.82 : 0.95}
            house={{ tier: house.tier, placed: house.placed }}
            energy={stats.energy / 100}
            speaking={pipIsSpeaking}
            reactKey={reactKey}
            onTap={() => {
              petThePet();
              setReactKey((k) => k + 1);
              setNotice(`¡Acariciaste a ${pet.name}! Su humor mejoró.`);
            }}
            backgroundColor={tint}
          />
          <View style={styles.islandPedestal} />

          <PressableScale
            onPress={() => speakWithPip(msg.en)}
            hapticKind="light"
            style={styles.bubble}
          >
            <View style={ui.row}>
              <Ionicons name="volume-high" size={18} color={THEME.blue} />
              <Text style={styles.bubbleText}>
                <Text style={{ fontWeight: '800', color: moodInfo.badgeColor }}>
                  {msg.en}
                </Text>{' '}
                {msg.es.replace(/^\S+\s/, '')}
              </Text>
            </View>
          </PressableScale>
        </View>
      </Reveal>

      {notice ? (
        <View style={styles.noticeBar}>
          <Glyph name="sparkle" size={20} />
          <Text style={styles.noticeBarText}>{notice}</Text>
        </View>
      ) : null}

      {/* Secciones: una a la vez para no perderse */}
      <View style={styles.sectionBar}>
        {PET_SECTIONS.map((sec) => {
          const active = section === sec.id;
          const dot = sectionDots[sec.id];
          return (
            <PressableScale
              key={sec.id}
              hapticKind="select"
              onPress={() => setSection(sec.id)}
              style={[styles.sectionTab, active && styles.sectionTabActive]}
            >
              <View>
                <Glyph name={sec.glyph} size={30} />
                {dot ? <View style={styles.sectionDot} /> : null}
              </View>
              <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>{sec.label}</Text>
            </PressableScale>
          );
        })}
      </View>
      <Text style={styles.sectionHint}>{PET_SECTIONS.find((x) => x.id === section)?.hint}</Text>

      {section === 'care' ? (
        <Reveal key="care" index={0}>
          <View style={{ gap: 14 }}>
        <Card>
          <View style={[ui.row, { gap: 18 }]}>
            <ActivityRings
              size={118}
              stroke={13}
              values={[
                { value: stats.fullness / 100, colors: NEED_RINGS.fullness },
                { value: stats.energy / 100, colors: NEED_RINGS.energy },
                { value: stats.happiness / 100, colors: NEED_RINGS.happiness },
              ]}
            />
            <View style={{ flex: 1, gap: 10 }}>
              <Need label="Comida" value={stats.fullness} color={NEED_RINGS.fullness[1]} icon="nutrition" />
              <Need label="Energía" value={stats.energy} color={NEED_RINGS.energy[1]} icon="flash" sub="sube cuando hablas" />
              <Need label="Felicidad" value={stats.happiness} color={NEED_RINGS.happiness[1]} icon="heart" />
            </View>
          </View>
          <View style={ui.rowBetween}>
            <Text style={TYPE.footnote}>
              Nivel {lvl.level} · {lvl.current}/{lvl.needed} XP
            </Text>
            <View style={ui.row}>
              <LinearGradient colors={GRADIENTS.gold} style={styles.coin} />
              <Text style={TYPE.footnote}>{progress.coins} monedas</Text>
            </View>
          </View>
          <AnimatedBar value={lvl.ratio} colors={GRADIENTS.gold} height={6} />
        </Card>
        <Card>
          <Eyebrow icon="restaurant" color={THEME.red}>Dale de comer y juega</Eyebrow>
          <View style={styles.foodGrid}>
            {FOODS.map((f) => {
              const affordable = progress.coins >= f.cost;
              return (
                <PressableScale
                  key={f.id}
                  onPress={() => act(feedPet(f.id), `${pet.name}: “Nom nom! ${f.name} estuvo delicioso!”`)}
                  hapticKind="medium"
                  style={[styles.food, !affordable && { opacity: 0.4 }]}
                >
                  <Glyph name={f.glyph} size={50} tile="#FFFFFF" />
                  <Text style={styles.foodName}>{f.name}</Text>
                  <Price coins={f.cost} />
                </PressableScale>
              );
            })}
          </View>
          <View style={ui.row}>
            <Button
              label="Acariciar"
              icon="heart"
              variant="secondary"
              onPress={() => {
                petThePet();
                setReactKey((k) => k + 1);
                setNotice(`${pet.name} cerró los ojos feliz con tus mimos.`);
              }}
              style={{ flex: 1 }}
            />
            <Button
              label="Jugar"
              icon="football"
              variant="secondary"
              onPress={() => act(playWithPet(), `${pet.name}: “${pet.catchphrase || 'That was fun!'}”`)}
              style={{ flex: 1 }}
            />
            <Button
              label="Sueño"
              icon="moon"
              variant="secondary"
              onPress={() => {
                triggerPetEmotion('sleepy', 9500);
                setDreamModalVisible(true);
              }}
              style={{ flex: 1 }}
            />
          </View>
        {/* Barra interactiva de Emociones Tomodachi Life */}
        <View style={styles.emotionDeck}>
          <View style={styles.emotionDeckHeader}>
            <Text style={styles.emotionDeckTitle}>
              Reacciones · tócalas para verlas
            </Text>
          </View>
          <View style={styles.emotionBtnRow}>
            {LIVE_EMOTION_BUTTONS.map((eb) => {
              const isCurrent = mood === eb.mood;
              const meta = MOOD_META[eb.mood];
              return (
                <PressableScale
                  key={eb.mood}
                  hapticKind="select"
                  onPress={() => {
                    if (eb.mood === 'love') {
                      petThePet();
                    } else {
                      triggerPetEmotion(eb.mood, 5500);
                    }
                    setReactKey((k) => k + 1);
                  }}
                  style={[
                    styles.emotionChip,
                    isCurrent && {
                      backgroundColor: meta.badgeColor,
                      borderColor: meta.badgeColor,
                    },
                  ]}
                >
                  <Glyph name={meta.glyph} size={26} />
                  <Text
                    style={[
                      styles.emotionChipLabel,
                      isCurrent && { color: '#FFFFFF', fontWeight: '900' },
                    ]}
                  >
                    {eb.label}
                  </Text>
                  <Text
                    style={[
                      styles.emotionChipSub,
                      isCurrent && { color: 'rgba(255,255,255,0.88)' },
                    ]}
                  >
                    {eb.triggerHint}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
          <Text style={TYPE.footnote}>
            Tu mascota reacciona sola mientras practicas: si fallas se enoja, si aciertas celebra, y si duerme puedes espiar su burbuja de sueño en inglés.
          </Text>
        </Card>
          </View>
        </Reveal>
      ) : null}

      {section === 'house' ? (
        <Reveal key="house" index={0}>
        <HouseSection
          onNotice={(m) => {
            setReactKey((k) => k + 1);
            setNotice(m);
          }}
        />
        </Reveal>
      ) : null}

      {section === 'style' ? (
        <Reveal key="style" index={0}>
        <Card>
          <View style={ui.rowBetween}>
            <Eyebrow icon="sparkles" color={THEME.blue}>
              Look de {pet.name}
            </Eyebrow>
            <PressableScale
              hapticKind="medium"
              onPress={() => {
                const randomized = randomizeTomodachiPet(pet.name);
                updatePet(randomized);
                triggerPetEmotion('celebrate', 3500);
                setReactKey((k) => k + 1);
                setNotice('¡Look, rostro y voz Tomodachi generados al azar!');
              }}
              style={styles.diceBtn}
            >
              <Text style={styles.diceBtnText}>Sorpréndeme</Text>
            </PressableScale>
          </View>

          {/* Pestañas del Estudio de Creación */}
          <View style={styles.creatorTabsRow}>
            {(
              [
                { id: 'face', label: 'Rostro', glyph: 'face-happy' },
                { id: 'body', label: 'Cuerpo', glyph: 'scale-normal' },
                { id: 'outfit', label: 'Ropa', glyph: 'outfit-vest' },
                { id: 'hats', label: 'Gorros', glyph: 'strawhat' },
                { id: 'soul', label: 'Voz', glyph: 'mic' },
                { id: 'habitat', label: 'Isla', glyph: 'campfire' },
              ] as const
            ).map((t) => {
              const active = creatorTab === t.id;
              return (
                <PressableScale
                  key={t.id}
                  hapticKind="select"
                  onPress={() => setCreatorTab(t.id)}
                  style={[styles.creatorTabPill, active && styles.creatorTabPillActive]}
                >
                  <Glyph name={t.glyph} size={24} />
                  <Text
                    style={[
                      styles.creatorTabText,
                      active && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {creatorTab === 'body' ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Especie 3D ({speciesInfo.taglineEs})</Text>
              <View style={styles.speciesGrid}>
                {SPECIES.map((sp) => {
                  const active = pet.species === sp.id;
                  const preset = SPECIES_PRESET_COLORS[sp.id];
                  const locked = playerLevel < sp.unlockLevel;
                  return (
                    <PressableScale
                      key={sp.id}
                      hapticKind="select"
                      disabled={locked}
                      onPress={() => {
                        updatePet({
                          species: sp.id,
                          bodyColor: preset.bodyColor,
                          bellyColor: preset.bellyColor,
                        });
                        setReactKey((k) => k + 1);
                      }}
                      style={[styles.speciesCard, active && styles.speciesCardActive, locked && { opacity: 0.5 }]}
                    >
                      <View
                        style={[
                          styles.speciesIconCircle,
                          { backgroundColor: active ? '#FFFFFF' : preset.bodyColor },
                        ]}
                      >
                        <Glyph name={locked ? 'lock' : sp.glyph} size={36} />
                      </View>
                      <Text
                        style={[styles.speciesLabel, active && { color: '#FFFFFF' }]}
                        numberOfLines={1}
                      >
                        {sp.label}
                      </Text>
                      <Text
                        style={[
                          styles.speciesSub,
                          active && { color: 'rgba(255,255,255,0.88)' },
                        ]}
                        numberOfLines={1}
                      >
                        {locked ? `Nivel ${sp.unlockLevel}` : sp.subtitleEs}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Complexión física 3D</Text>
              <View style={styles.optionGrid}>
                {BODY_SCALES.map((bs) => {
                  const active = (pet.bodyScale ?? 'normal') === bs.id;
                  return (
                    <PressableScale
                      key={bs.id}
                      hapticKind="select"
                      onPress={() => updatePet({ bodyScale: bs.id })}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={bs.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {bs.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Color principal del cuerpo</Text>
              <View style={ui.rowWrap}>
                {BODY_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    active={pet.bodyColor === c}
                    onPress={() => updatePet({ bodyColor: c })}
                  />
                ))}
              </View>

              <Text style={styles.label}>Color de zapatos, pancita y detalles</Text>
              <View style={ui.rowWrap}>
                {BELLY_COLORS.map((c) => (
                  <Swatch
                    key={c}
                    color={c}
                    active={pet.bellyColor === c}
                    onPress={() => updatePet({ bellyColor: c })}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {creatorTab === 'face' ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Expresión de ojos 3D</Text>
              <View style={styles.optionGrid}>
                {EYE_STYLES.map((e) => (
                  <OptionTile
                    key={e.id}
                    glyph={`eyes-${e.id}`}
                    label={e.label}
                    active={pet.eyeStyle === e.id}
                    onPress={() => updatePet({ eyeStyle: e.id })}
                  />
                ))}
              </View>

              <Text style={styles.label}>Cejas expresivas 3D</Text>
              <View style={styles.optionGrid}>
                {BROW_STYLES.map((b) => {
                  const active = (pet.browStyle ?? 'soft') === b.id;
                  return (
                    <PressableScale
                      key={b.id}
                      hapticKind="select"
                      onPress={() => updatePet({ browStyle: b.id })}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={b.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {b.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Forma de boca 3D</Text>
              <View style={styles.optionGrid}>
                {MOUTH_STYLES.map((m) => {
                  const active = (pet.mouthStyle ?? 'smile') === m.id;
                  return (
                    <PressableScale
                      key={m.id}
                      hapticKind="select"
                      onPress={() => updatePet({ mouthStyle: m.id })}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={m.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Mejillas, Pecas y Estrellitas 3D</Text>
              <View style={styles.optionGrid}>
                {BLUSH_STYLES.map((bl) => {
                  const active = (pet.blushStyle ?? 'pink') === bl.id;
                  return (
                    <PressableScale
                      key={bl.id}
                      hapticKind="select"
                      onPress={() => updatePet({ blushStyle: bl.id })}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={bl.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {bl.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}

          {creatorTab === 'soul' ? (
            <View style={{ gap: 12 }}>
              <Text style={styles.label}>Personalidad Tomodachi (afecta sus reacciones)</Text>
              <View style={styles.optionGrid}>
                {PERSONALITIES.map((p) => {
                  const active = (pet.personality ?? 'energetic') === p.id;
                  return (
                    <PressableScale
                      key={p.id}
                      hapticKind="select"
                      onPress={() =>
                        updatePet({
                          personality: p.id,
                        })
                      }
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={p.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {p.labelEs}
                      </Text>
                      <Text
                        style={[
                          styles.speciesSub,
                          active && { color: 'rgba(255,255,255,0.88)' },
                        ]}
                        numberOfLines={2}
                      >
                        {p.descEs}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Sintetizador de Voz (Tono y Velocidad)</Text>
              <View style={styles.optionGrid}>
                {VOICE_PRESETS.map((vp) => {
                  const active =
                    Math.abs((pet.voicePitch ?? 1.1) - vp.pitch) < 0.08 &&
                    Math.abs((pet.voiceRate ?? 1.0) - vp.rate) < 0.08;
                  return (
                    <PressableScale
                      key={vp.id}
                      hapticKind="select"
                      onPress={() => {
                        updatePet({ voicePitch: vp.pitch, voiceRate: vp.rate });
                        speakWithPip(
                          `Hi! I am ${pet.name}. ${pet.catchphrase || "Let's go!"}`
                        );
                      }}
                      style={[styles.option, active && styles.optionActive]}
                    >
                      <Glyph name={vp.glyph} size={34} />
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {vp.labelEs}
                      </Text>
                      <Text
                        style={[
                          styles.speciesSub,
                          active && { color: 'rgba(255,255,255,0.85)' },
                        ]}
                      >
                        Tono {vp.pitch}x · Vel {vp.rate}x
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>

              <Text style={styles.label}>Muletilla en Inglés (Catchphrase al celebrar o enojarse)</Text>
              <View style={styles.catchphraseInputWrap}>
                <TextInput
                  value={pet.catchphrase ?? "Let's go!"}
                  onChangeText={(txt) => updatePet({ catchphrase: txt.slice(0, 28) })}
                  placeholder="Ej. Oh yeah!, Easy peasy!, Booyah!"
                  placeholderTextColor={THEME.ink3}
                  style={styles.catchphraseInput}
                />
                <PressableScale
                  hapticKind="light"
                  onPress={() =>
                    speakWithPip(
                      `Hi! My name is ${pet.name}, and I always say: ${pet.catchphrase || "Let's go!"}`
                    )
                  }
                  style={styles.testVoiceBtn}
                >
                  <Ionicons name="volume-high" size={16} color="#FFFFFF" />
                  <Text style={styles.testVoiceBtnText}>Probar Voz</Text>
                </PressableScale>
              </View>

              <View style={ui.rowWrap}>
                {SUGGESTED_CATCHPHRASES.map((phrase) => {
                  const active = pet.catchphrase === phrase;
                  return (
                    <PressableScale
                      key={phrase}
                      hapticKind="select"
                      onPress={() => updatePet({ catchphrase: phrase })}
                      style={[
                        styles.phraseChip,
                        active && { backgroundColor: THEME.blue, borderColor: THEME.blue },
                      ]}
                    >
                      <Text
                        style={[
                          styles.phraseChipText,
                          active && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        “{phrase}”
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}

          {creatorTab === 'hats' ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Sombrero o accesorio 3D</Text>
              <View style={styles.optionGrid}>
                {ACCESSORIES.map((a) => {
                  const locked = playerLevel < a.unlockLevel;
                  return (
                    <OptionTile
                      key={a.id}
                      glyph={locked ? 'lock' : a.glyph}
                      label={locked ? `Nivel ${a.unlockLevel}` : a.label}
                      active={pet.accessory === a.id}
                      disabled={locked}
                      onPress={() => updatePet({ accessory: a.id })}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          {creatorTab === 'outfit' ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Ropa 3D (la compras una vez y te la pones cuando quieras)</Text>
              <View style={styles.optionGrid}>
                {OUTFITS.map((o) => {
                  const owned = o.cost === 0 || (progress.ownedOutfits ?? []).includes(o.id);
                  const wearing = (pet.outfit ?? 'none') === o.id;
                  return (
                    <PressableScale
                      key={o.id}
                      hapticKind="select"
                      onPress={() => {
                        const res = buyOrWearOutfit(o.id);
                        if (res.ok) {
                          setReactKey((k) => k + 1);
                          setNotice(res.boughtNow ? `¡Compraste ${o.label}!` : `${pet.name} se puso ${o.label}.`);
                        } else setNotice(res.reason ?? null);
                      }}
                      style={[styles.option, wearing && styles.optionActive]}
                    >
                      <Glyph name={o.glyph} size={40} />
                      <Text style={[styles.optionText, wearing && { color: '#FFFFFF', fontWeight: '800' }]}>
                        {o.label}
                      </Text>
                      {owned ? (
                        <Text style={[styles.speciesSub, wearing && { color: 'rgba(255,255,255,0.9)' }]}>
                          {wearing ? 'Puesto' : 'Tuyo'}
                        </Text>
                      ) : (
                        <Price coins={o.cost} />
                      )}
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}

          {creatorTab === 'habitat' ? (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>
                Isla Casa / Santuario Decorativo 3D (aparece junto a {pet.name} en la roca Cairn)
              </Text>
              <View style={styles.habitatGrid}>
                {HABITAT_PROPS.map((prop) => {
                  const isEquipped = (pet.habitatProp ?? 'campfire') === prop.id;
                  const isUnlocked =
                    prop.cost === 0 || (progress.unlockedProps ?? []).includes(prop.id);
                  return (
                    <PressableScale
                      key={prop.id}
                      hapticKind="select"
                      onPress={() => {
                        const res = buyOrEquipProp(prop.id);
                        if (res.ok) {
                          setReactKey((k) => k + 1);
                          setNotice(
                            `Colocaste ${prop.nameEs} en el santuario 3D de ${pet.name}.`
                          );
                        } else {
                          setNotice(res.reason ?? null);
                        }
                      }}
                      style={[
                        styles.habitatCard,
                        isEquipped && styles.habitatCardActive,
                      ]}
                    >
                      <HabitatPropIllustration propId={prop.id} size={46} />
                      <Text
                        style={[
                          styles.habitatLabel,
                          isEquipped && { color: '#FFFFFF' },
                        ]}
                        numberOfLines={1}
                      >
                        {prop.nameEs}
                      </Text>
                      <Text
                        style={[
                          styles.speciesSub,
                          isEquipped && { color: 'rgba(255,255,255,0.9)' },
                        ]}
                        numberOfLines={2}
                      >
                        {prop.descEs}
                      </Text>
                      <View
                        style={[
                          styles.habitatPriceBadge,
                          isEquipped
                            ? { backgroundColor: '#FFFFFF' }
                            : isUnlocked
                              ? { backgroundColor: '#DCFCE7' }
                              : { backgroundColor: '#FEF3C7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.habitatPriceText,
                            isEquipped
                              ? { color: THEME.blue }
                              : isUnlocked
                                ? { color: '#15803D' }
                                : { color: '#92400E' },
                          ]}
                        >
                          {isEquipped
                            ? 'En la isla'
                            : isUnlocked
                              ? 'Colocar gratis'
                              : `${prop.cost} monedas`}
                        </Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}
        </Card>
        </Reveal>
      ) : null}

      {section === 'gifts' ? (
        <Reveal key="gifts" index={0}>
        <Card>
          <StreakSurpriseGiftsSection
            onNotice={(msg) => {
              setReactKey((k) => k + 1);
              setNotice(msg);
            }}
          />
        </Card>
        </Reveal>
      ) : null}

      <TomodachiDreamModal
        visible={dreamModalVisible}
        onClose={() => setDreamModalVisible(false)}
      />
    </View>
  );
}

function Need({
  label,
  value,
  color,
  icon,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  icon: IconName;
  sub?: string;
}) {
  return (
    <View>
      <View style={ui.rowBetween}>
        <View style={ui.row}>
          <Ionicons name={icon} size={15} color={color} />
          <Text style={styles.needLabel}>{label}</Text>
        </View>
        <Text style={[styles.needValue, value < 25 && { color: THEME.red }]}>
          {Math.round(value)}%
        </Text>
      </View>
      {sub ? <Text style={[TYPE.footnote, { fontSize: 11, marginLeft: 21 }]}>{sub}</Text> : null}
    </View>
  );
}

function OptionTile({
  glyph,
  label,
  active,
  onPress,
  disabled,
}: {
  glyph: string;
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hapticKind="select"
      style={[styles.option, active && styles.optionActive, disabled && { opacity: 0.5 }]}
    >
      <Glyph name={glyph} size={34} />
      <Text
        style={[styles.optionText, active && { color: '#FFFFFF', fontWeight: '700' }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function Swatch({
  color,
  active,
  onPress,
}: {
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      hapticKind="select"
      scaleTo={0.85}
      accessibilityLabel={`Color ${color}`}
    >
      <View style={[styles.swatchRing, active && { borderColor: THEME.blue }]}>
        <View style={[styles.swatch, { backgroundColor: color }]}>
          {active ? <Ionicons name="checkmark" size={16} color={THEME.ink} /> : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  noticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF6FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#C5DFFF',
  },
  noticeBarText: { flex: 1, fontSize: 13, fontWeight: '700', color: THEME.ink },
  sectionBar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 6,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 5,
  },
  sectionTab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 16 },
  sectionTabActive: { backgroundColor: '#EAF3FF', borderWidth: 2, borderColor: THEME.blue },
  sectionTabText: { fontSize: 12, fontWeight: '800', color: THEME.ink2 },
  sectionTabTextActive: { color: THEME.blue, fontWeight: '900' },
  sectionDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: THEME.red,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sectionHint: { fontSize: 13, fontWeight: '600', color: THEME.ink2, textAlign: 'center', marginTop: -6 },
  nameInput: { borderBottomWidth: 2, borderBottomColor: THEME.blue, paddingVertical: 0 },
  personalitySub: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.ink2,
    marginTop: 2,
  },
  stage: {
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 16,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  stageTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  moodPillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  dreamTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderBottomWidth: 3,
  },
  dreamTriggerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6D28D9',
  },
  hint: { fontSize: 12, color: THEME.ink2, fontWeight: '700' },
  islandPedestal: {
    marginTop: -22,
    marginBottom: 8,
    width: 170,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 181, 103, 0.35)',
  },
  emotionDeck: {
    alignSelf: 'stretch',
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(30,36,54,0.08)',
  },
  emotionDeckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emotionDeckTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.ink2,
  },
  emotionBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionChip: {
    minWidth: 74,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#F4F7FC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  emotionChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 1,
  },
  emotionChipSub: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.ink3,
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 14,
    alignSelf: 'stretch',
  },
  bubbleText: { flex: 1, fontSize: 14, lineHeight: 19, color: THEME.ink },
  needLabel: { fontSize: 14, color: THEME.ink, fontWeight: '600' },
  needValue: { fontSize: 14, color: THEME.ink, fontWeight: '700', fontVariant: ['tabular-nums'] },
  coin: { width: 13, height: 13, borderRadius: 7 },
  coinSmall: { width: 11, height: 11, borderRadius: 6 },
  foodGrid: { flexDirection: 'row', gap: 10 },
  food: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 20, backgroundColor: THEME.fill },
  foodName: { fontSize: 12, fontWeight: '600', color: THEME.ink2 },
  foodCost: { fontSize: 13, fontWeight: '700', color: THEME.gold },
  notice: { fontSize: 14, fontWeight: '700', color: THEME.blue },
  diceBtn: {
    backgroundColor: '#FFF3D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#F5B841',
  },
  diceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A16207',
  },
  creatorTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  creatorTabPill: {
    flex: 1,
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: THEME.fill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  creatorTabPillActive: {
    backgroundColor: THEME.blue,
    borderColor: THEME.blue,
  },
  creatorTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.ink2,
  },
  label: { ...TYPE.caption, marginTop: 6 },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesCard: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: THEME.fill,
    borderWidth: 1.5,
    borderColor: '#E2E9F5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#CBD6EC',
  },
  speciesCardActive: {
    backgroundColor: THEME.blue,
    borderColor: THEME.blue,
    borderBottomColor: '#0055B8',
  },
  speciesIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speciesLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
  },
  speciesSub: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.ink2,
    textAlign: 'center',
  },
  habitatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitatCard: {
    width: '47%',
    minWidth: 142,
    flexGrow: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: '#FAFBFD',
    borderWidth: 2,
    borderColor: '#1E2436',
    borderBottomWidth: 4,
  },
  habitatCardActive: {
    backgroundColor: THEME.blue,
    borderColor: '#1E2436',
    borderBottomColor: '#1E2436',
  },
  habitatLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.ink,
  },
  habitatPriceBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  habitatPriceText: {
    fontSize: 10,
    fontWeight: '900',
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minWidth: 88,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: THEME.fill,
    borderBottomWidth: 3,
    borderBottomColor: '#D5DFEE',
  },
  optionActive: {
    backgroundColor: THEME.blue,
    borderBottomColor: '#0055B8',
  },
  optionText: { fontSize: 12, fontWeight: '600', color: THEME.ink },
  catchphraseInputWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  catchphraseInput: {
    flex: 1,
    backgroundColor: THEME.fill,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
    borderWidth: 1.5,
    borderColor: '#DCE5F2',
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.blue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  testVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  phraseChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: THEME.fill,
    borderWidth: 1,
    borderColor: '#DCE5F2',
  },
  phraseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.ink2,
  },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2.5, borderColor: 'transparent' },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(30, 36, 54, 0.08)',
  },
});
