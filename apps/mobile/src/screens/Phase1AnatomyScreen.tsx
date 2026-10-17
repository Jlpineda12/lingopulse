import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../theme/colors';

export function Phase1AnatomyScreen() {
  const {
    lesson,
    locale,
    speakWithPip,
    addVoicedFuelMs,
    markPhaseCompleted,
    setActiveStep,
    setPipMessage,
  } = useAppState();

  const { anatomy } = lesson.publicContent;
  const [hasPracticedRepeat, setHasPracticedRepeat] = useState(false);

  const handleRepeatShadowing = () => {
    setHasPracticedRepeat(true);
    addVoicedFuelMs(4000); // +4s de calentamiento de voz
    setPipMessage(
      '¡Buen calentamiento! Notaste cómo el pronombre "it" va justo entre "put" y "off".'
    );
  };

  const handleContinue = () => {
    markPhaseCompleted('anatomy');
    setActiveStep('input');
  };

  return (
    <View style={styles.container}>
      {/* Cabecera de lección */}
      <View style={styles.card}>
        <View style={styles.tagRow}>
          <View style={styles.phaseBadge}>
            <Text style={styles.phaseBadgeText}>FASE 1 · ANATOMÍA Y ESCUCHA MODELO</Text>
          </View>
          <Text style={styles.localeTag}>
            {locale === 'en-GB' ? '🇬🇧 UK Model' : '🇺🇸 US Model'}
          </Text>
        </View>

        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.topicSubtitle}>{lesson.realLifeTopic}</Text>

        {/* Tarjeta del objetivo léxico principal */}
        <View style={styles.targetHeroBox}>
          <View style={styles.targetHeader}>
            <View>
              <Text style={styles.targetCanonical}>{anatomy.targetExpression}</Text>
              <Text style={styles.targetIpa}>{anatomy.ipa}</Text>
            </View>
            <Pressable
              onPress={() => speakWithPip(anatomy.modelSentence)}
              style={styles.audioPlayBtn}
            >
              <Text style={styles.audioPlayBtnText}> Escuchar Modelo</Text>
            </Pressable>
          </View>
          <Text style={styles.meaningEn}>Meaning: {anatomy.meaningEn}</Text>
        </View>

        {/* Regla funcional y gramatical */}
        <View style={styles.ruleBox}>
          <Text style={styles.sectionTitle}> Regla Funcional y Anclaje Gramatical</Text>
          <Text style={styles.ruleText}>{anatomy.functionalRule}</Text>
          <View style={styles.dialectTipBox}>
            <Text style={styles.dialectTipText}> {anatomy.dialectTip}</Text>
          </View>
        </View>

        {/* Oración modelo en contexto */}
        <View style={styles.exampleCard}>
          <Text style={styles.sectionTitle}> Ejemplo Contextual</Text>
          <Text style={styles.modelEn}>“{anatomy.modelSentence}”</Text>
          <Text style={styles.modelEs}>{anatomy.modelTranslationEs}</Text>

          <View style={styles.miniExamplesList}>
            {anatomy.examples.map((ex, idx) => (
              <Pressable
                key={idx}
                onPress={() => speakWithPip(ex.en)}
                style={styles.miniExampleItem}
              >
                <Text style={styles.miniExampleEn}> {ex.en}</Text>
                <Text style={styles.miniExampleEs}>{ex.es}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Expresiones de repaso en la sesión */}
        <View style={styles.reviewBox}>
          <Text style={styles.sectionTitle}> Expresiones de Repaso en esta Sesión</Text>
          <View style={styles.reviewRow}>
            {anatomy.reviewTargets.map((rt, idx) => (
              <View key={idx} style={styles.reviewPill}>
                <Text style={styles.reviewExpr}>{rt.expression}</Text>
                <Text style={styles.reviewMeaning}>{rt.meaningEs}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Botones de acción: Repetir en voz alta y pasar a Fase 2 */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleRepeatShadowing}
            style={[
              styles.repeatBtn,
              hasPracticedRepeat && styles.repeatBtnDone,
            ]}
          >
            <Text
              style={[
                styles.repeatBtnText,
                hasPracticedRepeat && { color: COLORS.emerald },
              ]}
            >
              {hasPracticedRepeat
                ? '✓ Repetición grabada (+4s Combustible)'
                : 'Repetir oración modelo en voz alta'}
            </Text>
          </Pressable>

          <Pressable onPress={handleContinue} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>
              Continuar a Fase 2: Reading & Listening →
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 14,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseBadge: {
    backgroundColor: COLORS.accentSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  localeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  topicSubtitle: {
    fontSize: 13,
    color: COLORS.inkSecondary,
    marginTop: -6,
  },
  targetHeroBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetCanonical: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.accentBlue,
  },
  targetIpa: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inkSecondary,
  },
  audioPlayBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  audioPlayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  meaningEn: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.inkPrimary,
  },
  ruleBox: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ruleText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.inkPrimary,
  },
  dialectTipBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dialectTipText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#92400E',
    fontWeight: '600',
  },
  exampleCard: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 8,
  },
  modelEn: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.inkPrimary,
    lineHeight: 22,
  },
  modelEs: {
    fontSize: 13,
    color: COLORS.inkSecondary,
  },
  miniExamplesList: {
    marginTop: 6,
    gap: 6,
  },
  miniExampleItem: {
    backgroundColor: COLORS.cardSurface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  miniExampleEn: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  miniExampleEs: {
    fontSize: 12,
    color: COLORS.inkSecondary,
  },
  reviewBox: {
    gap: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewPill: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.purpleSoftBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  reviewExpr: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.purple,
  },
  reviewMeaning: {
    fontSize: 11,
    color: COLORS.inkSecondary,
  },
  actionsRow: {
    gap: 10,
    marginTop: 4,
  },
  repeatBtn: {
    backgroundColor: COLORS.cardMuted,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  repeatBtnDone: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderColor: COLORS.emerald,
  },
  repeatBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  primaryBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
