import React, { useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { useGame } from '../context/GameContext';
import {
  COLLECTIONS,
  FURNITURE,
  HOUSE_TIERS,
  OUTFITS,
  ACCESSORIES,
  type CollectionId,
  type FurnitureSlot,
} from '../game/pet';
import { THEME, TYPE } from '../theme/colors';
import { Glyph } from './Glyph';
import { AnimatedBar, PressableScale, usePop } from './motion';
import { Button } from './ui';
import { ShareButton } from './ShareCard';

const SLOT_LABEL: Record<FurnitureSlot | 'all', string> = {
  all: 'Todo',
  bed: 'Cama',
  floor: 'Piso',
  light: 'Luz',
  wall: 'Pared',
  corner: 'Rincón',
  special: 'Especial',
};

const SLOT_GLYPH: Record<FurnitureSlot | 'all', string> = {
  all: 'house',
  bed: 'bed',
  floor: 'rug',
  light: 'lamp',
  wall: 'poster',
  corner: 'plant',
  special: 'chest',
};

/** Moneda o estrella pequeña con cantidad. */
export function Price({ coins, stars, muted }: { coins?: number; stars?: number; muted?: boolean }) {
  return (
    <View style={styles.priceRow}>
      {coins ? (
        <View style={styles.priceRow}>
          <Glyph name="coin" size={16} />
          <Text style={[styles.priceText, muted && { color: THEME.ink3 }]}>{coins}</Text>
        </View>
      ) : null}
      {stars ? (
        <View style={styles.priceRow}>
          <Glyph name="star" size={16} />
          <Text style={[styles.priceText, muted && { color: THEME.ink3 }]}>{stars}</Text>
        </View>
      ) : null}
      {!coins && !stars ? <Text style={[styles.priceText, { color: THEME.green }]}>Gratis</Text> : null}
    </View>
  );
}

export function HouseSection({ onNotice }: { onNotice: (msg: string) => void }) {
  const { house, progress, upgradeHouse, buyOrPlaceFurniture, removeFurniture, openScreen, pet, playerLevel } = useGame();
  const [slotFilter, setSlotFilter] = useState<FurnitureSlot | 'all'>('all');
  const pop = usePop();
  const tier = HOUSE_TIERS.find((t) => t.tier === house.tier) ?? HOUSE_TIERS[0]!;
  const next = HOUSE_TIERS.find((t) => t.tier === house.tier + 1);
  const stars = progress.stars ?? 0;
  const items = FURNITURE.filter((f) => slotFilter === 'all' || f.slot === slotFilter);

  const collectionProgress = (Object.keys(COLLECTIONS) as CollectionId[]).map((id) => {
    const furniture = FURNITURE.filter((f) => f.collection === id);
    const outfits = OUTFITS.filter((o) => o.collection === id);
    const hats = ACCESSORIES.filter((a) => a.collection === id);
    const total = furniture.length + outfits.length + hats.length;
    const owned =
      furniture.filter((f) => house.owned.includes(f.id)).length +
      outfits.filter((o) => (progress.ownedOutfits ?? []).includes(o.id)).length +
      hats.filter((h) => playerLevel >= h.unlockLevel).length;
    return { id, total, owned };
  });

  return (
    <View style={{ gap: 14 }}>
      {/* Casa actual y mejora */}
      <View style={styles.tierCard}>
        <View style={styles.tierRow}>
          <Glyph name={tier.glyph} size={58} tile="#FFFFFF" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={TYPE.caption}>Tu casa · nivel {tier.tier + 1} de {HOUSE_TIERS.length}</Text>
            <Text style={TYPE.title2}>{tier.nameEs}</Text>
            <Text style={TYPE.footnote}>{tier.descEs}</Text>
            {house.tier > 0 ? <View style={{ alignSelf: 'flex-start', marginTop: 4 }}><ShareButton data={{ kind: 'house', houseName: tier.nameEs }} /></View> : null}
          </View>
        </View>
        <View style={styles.tierSteps}>
          {HOUSE_TIERS.map((t) => (
            <View key={t.id} style={[styles.tierStep, t.tier <= house.tier && styles.tierStepDone]}>
              <Glyph name={t.glyph} size={26} />
            </View>
          ))}
        </View>
        {next ? (
          <View style={styles.nextBox}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={TYPE.headline}>Siguiente: {next.nameEs}</Text>
              <View style={{ gap: 4 }}>
                <View style={styles.reqRow}>
                  <Glyph name="coin" size={16} />
                  <Text style={styles.reqText}>
                    {Math.min(progress.coins, next.coinCost)}/{next.coinCost} monedas
                  </Text>
                </View>
                <AnimatedBar value={progress.coins / next.coinCost} colors={['#FFE082', '#D99B26']} height={6} />
                <View style={styles.reqRow}>
                  <Glyph name="star" size={16} />
                  <Text style={styles.reqText}>
                    {Math.min(stars, next.starCost)}/{next.starCost} estrellas de minijuegos
                  </Text>
                </View>
                <AnimatedBar value={stars / next.starCost} colors={['#FFE08A', '#FFB800']} height={6} />
              </View>
            </View>
            <Animated.View style={pop.style}>
              <Glyph name={next.glyph} size={64} />
            </Animated.View>
          </View>
        ) : (
          <Text style={[TYPE.footnote, { color: THEME.green }]}>¡Tienes la casa más alta! Eres leyenda.</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {next ? (
            <Button
              label="Mejorar casa"
              icon="hammer"
              variant="gold"
              onPress={() => {
                const res = upgradeHouse();
                if (res.ok) {
                  pop.pop();
                  onNotice(`¡Bienvenidos a ${next.nameEs}! ${pet.name} está feliz con su nuevo hogar.`);
                } else onNotice(res.reason ?? '');
              }}
              style={{ flex: 1 }}
            />
          ) : null}
          <Button
            label="Ganar estrellas"
            icon="game-controller"
            variant="primary"
            onPress={() => openScreen({ name: 'minigame' })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      {/* Tienda de muebles */}
      <View style={{ gap: 10 }}>
        <View style={styles.shopHeader}>
          <Text style={TYPE.title2}>Muebles</Text>
          <View style={styles.wallet}>
            <Price coins={progress.coins} />
            <Price stars={stars} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {(Object.keys(SLOT_LABEL) as Array<FurnitureSlot | 'all'>).map((slot) => {
            const active = slotFilter === slot;
            const available = slot === 'all' || tier.slots.includes(slot);
            return (
              <PressableScale
                key={slot}
                hapticKind="select"
                onPress={() => setSlotFilter(slot)}
                style={[styles.slotChip, active && styles.slotChipActive, !available && { opacity: 0.5 }]}
              >
                <View style={styles.priceRow}>
                  <Glyph name={SLOT_GLYPH[slot]} size={20} />
                  <Text style={[styles.slotChipText, active && { color: '#FFFFFF' }]}>{SLOT_LABEL[slot]}</Text>
                </View>
              </PressableScale>
            );
          })}
        </ScrollView>
        <View style={styles.grid}>
          {items.map((item) => {
            const owned = house.owned.includes(item.id);
            const placed = house.placed[item.slot] === item.id;
            const tierLocked = house.tier < item.minTier;
            const slotLocked = !tier.slots.includes(item.slot);
            const lockTier = HOUSE_TIERS.find((t) => t.tier === item.minTier);
            const col = item.collection ? COLLECTIONS[item.collection] : null;
            return (
              <PressableScale
                key={item.id}
                hapticKind="medium"
                onPress={() => {
                  if (placed) {
                    removeFurniture(item.slot);
                    onNotice(`Guardaste ${item.nameEs}.`);
                    return;
                  }
                  const res = buyOrPlaceFurniture(item.id);
                  if (res.ok) onNotice(res.boughtNow ? `¡Compraste ${item.nameEs}! Ya está en tu casa.` : `Colocaste ${item.nameEs}.`);
                  else onNotice(res.reason ?? '');
                }}
                style={[styles.item, placed && styles.itemPlaced, (tierLocked || slotLocked) && { opacity: 0.55 }]}
              >
                {col ? (
                  <View style={[styles.colBadge, { backgroundColor: col.color }]}>
                    <Glyph name={col.glyph} size={14} />
                  </View>
                ) : null}
                <Glyph name={tierLocked ? 'lock' : item.glyph} size={52} tile={placed ? '#FFFFFF' : '#F3F6FC'} />
                <Text style={[styles.itemName, placed && { color: '#FFFFFF' }]} numberOfLines={2}>
                  {item.nameEs}
                </Text>
                {tierLocked ? (
                  <Text style={[styles.lockText, placed && { color: '#FFFFFF' }]} numberOfLines={1}>
                    Requiere {lockTier?.nameEs}
                  </Text>
                ) : placed ? (
                  <Text style={[styles.lockText, { color: '#FFFFFF' }]}>Colocado · tocar para guardar</Text>
                ) : owned ? (
                  <Text style={[styles.lockText, { color: THEME.green }]}>Tuyo · colocar</Text>
                ) : (
                  <Price coins={item.cost} stars={item.starCost} />
                )}
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* Colecciones */}
      <View style={{ gap: 10 }}>
        <Text style={TYPE.title2}>Colecciones</Text>
        {collectionProgress.map((c) => {
          const meta = COLLECTIONS[c.id];
          return (
            <View key={c.id} style={styles.collection}>
              <Glyph name={meta.glyph} size={44} tile={meta.color} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={styles.shopHeader}>
                  <Text style={TYPE.headline}>{meta.labelEs}</Text>
                  <Text style={styles.reqText}>
                    {c.owned}/{c.total}
                  </Text>
                </View>
                <Text style={TYPE.footnote}>{meta.descEs}</Text>
                <AnimatedBar value={c.total ? c.owned / c.total : 0} colors={[meta.color, meta.color]} height={6} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tierCard: {
    backgroundColor: '#FFF8E6',
    borderRadius: 26,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: '#F6D98B',
    borderBottomWidth: 5,
    borderBottomColor: '#E9C46A',
  },
  tierRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tierSteps: { flexDirection: 'row', gap: 6 },
  tierStep: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    opacity: 0.45,
  },
  tierStepDone: { backgroundColor: '#FFFFFF', opacity: 1, borderWidth: 2, borderColor: '#F6D98B' },
  nextBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 12 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: 13, fontWeight: '700', color: THEME.ink2 },
  shopHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wallet: { flexDirection: 'row', gap: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 13, fontWeight: '800', color: THEME.ink },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
  slotChipActive: { backgroundColor: THEME.blue, borderColor: THEME.blue, borderBottomColor: '#0055B8' },
  slotChipText: { fontSize: 13, fontWeight: '800', color: THEME.ink2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: {
    width: 104,
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 5,
  },
  itemPlaced: { backgroundColor: THEME.green, borderColor: THEME.green, borderBottomColor: '#168A4C' },
  itemName: { fontSize: 12, fontWeight: '800', color: THEME.ink, textAlign: 'center', minHeight: 30 },
  lockText: { fontSize: 10, fontWeight: '700', color: THEME.ink3, textAlign: 'center' },
  colBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  collection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
});
