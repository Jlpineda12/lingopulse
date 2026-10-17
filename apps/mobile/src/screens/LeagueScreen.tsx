import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { Glyph } from '../components/Glyph';
import { Reveal } from '../components/motion';
import { ShareButton } from '../components/ShareCard';
import { Button, ScreenHeader } from '../components/ui';
import { eventTimeLeft } from '../game/events';
import { DEMOTE, LEAGUE_SIZE, LEAGUE_TIERS, PROMOTE, zoneFor } from '../game/league';
import { THEME, TYPE } from '../theme/colors';

/** Liga semanal: 20 jugadores, top 5 sube, últimos 5 bajan. */
export function LeagueScreen() {
  const { goBack, league, progress, dismissLeagueResult } = useGame();
  const tier = LEAGUE_TIERS[league.tier] ?? LEAGUE_TIERS[0]!;
  const left = eventTimeLeft();
  const result = progress.leagueResult;
  const zone = zoneFor(league.myRank);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={tier.nameEs} subtitle={`Termina en ${left.days} d ${left.hours} h`} onBack={goBack} />

      {result ? (
        <Reveal index={0}>
          <View style={[styles.result, { backgroundColor: result.zone === 'promote' ? '#E9FAF0' : result.zone === 'demote' ? '#FFF0F3' : '#EEF2FA' }]}>
            <Glyph name={result.zone === 'promote' ? 'rocket' : result.zone === 'demote' ? 'face-sad' : 'medal-silver'} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={TYPE.headline}>
                {result.zone === 'promote'
                  ? `¡Subiste a ${LEAGUE_TIERS[result.toTier]?.nameEs}!`
                  : result.zone === 'demote'
                    ? `Bajaste a ${LEAGUE_TIERS[result.toTier]?.nameEs}`
                    : `Te mantuviste en ${LEAGUE_TIERS[result.toTier]?.nameEs}`}
              </Text>
              <Text style={TYPE.footnote}>La semana pasada quedaste #{result.rank}.</Text>
            </View>
            <Button label="OK" small variant="secondary" onPress={dismissLeagueResult} />
          </View>
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <LinearGradient colors={[tier.soft, '#FFFFFF']} style={styles.header}>
          <Glyph name={tier.glyph} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={TYPE.caption}>Tu posición</Text>
            <Text style={[styles.rank, { color: tier.color }]}>#{league.myRank}</Text>
            <Text style={TYPE.footnote}>
              {league.weekXp} XP esta semana ·{' '}
              {zone === 'promote' ? 'zona de ascenso' : zone === 'demote' ? 'zona de descenso' : 'zona segura'}
            </Text>
          </View>
          <ShareButton data={{ kind: 'league', rank: league.myRank, leagueName: tier.nameEs }} />
        </LinearGradient>
      </Reveal>

      <View style={styles.tiers}>
        {LEAGUE_TIERS.map((t) => (
          <View key={t.id} style={[styles.tierDot, t.id === league.tier && { borderColor: t.color, backgroundColor: t.soft }, t.id > league.tier && { opacity: 0.4 }]}>
            <Glyph name={t.id > league.tier ? 'lock' : t.glyph} size={26} />
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {league.entries.map((e, i) => {
          const rank = i + 1;
          const z = zoneFor(rank);
          return (
            <View key={e.id}>
              {rank === PROMOTE + 1 ? <ZoneLine label="Zona de ascenso arriba" color={THEME.green} /> : null}
              {rank === LEAGUE_SIZE - DEMOTE + 1 ? <ZoneLine label="Zona de descenso abajo" color={THEME.red} /> : null}
              <View style={[styles.row, e.isUser && { backgroundColor: tier.soft, borderColor: tier.color }]}>
                <Text style={[styles.pos, z === 'promote' && { color: THEME.green }, z === 'demote' && { color: THEME.red }]}>{rank}</Text>
                <Glyph name={`species-${e.species}`} size={34} />
                <Text style={[styles.name, e.isUser && { fontWeight: '900' }]} numberOfLines={1}>
                  {e.isUser ? `${e.name} (tú)` : e.name}
                </Text>
                <Text style={styles.xp}>{e.xp} XP</Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[TYPE.footnote, { textAlign: 'center' }]}>
        Por ahora los rivales son de práctica (simulados). Cuando conectemos cuentas en línea serán jugadores reales de tu nivel.
      </Text>
    </View>
  );
}

function ZoneLine({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.zone}>
      <View style={[styles.zoneLine, { backgroundColor: color }]} />
      <Text style={[styles.zoneText, { color }]}>{label}</Text>
      <View style={[styles.zoneLine, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130, gap: 14 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 5,
  },
  rank: { fontSize: 40, fontWeight: '900', letterSpacing: -1.2, lineHeight: 44 },
  tiers: { flexDirection: 'row', justifyContent: 'space-between' },
  tierDot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
  },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pos: { width: 22, fontSize: 15, fontWeight: '900', color: THEME.ink2, textAlign: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: THEME.ink },
  xp: { fontSize: 14, fontWeight: '800', color: THEME.ink2, fontVariant: ['tabular-nums'] },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  zoneLine: { flex: 1, height: 2, borderRadius: 1, opacity: 0.5 },
  zoneText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
