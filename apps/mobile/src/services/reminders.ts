import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { displayPetName, type PetMood } from '../game/pet';
import { tr } from '../i18n';

/**
 * Recordatorios locales escritos por la mascota (en inglés fácil + español).
 * Se programan los próximos 7 días a la hora elegida; si hoy ya practicaste,
 * el de hoy se omite. Funcionan en Expo Go (iOS/Android); en web no hay notificaciones.
 */

export const REMINDERS_SUPPORTED = Platform.OS !== 'web';

const MESSAGES = (pet: string, streak: number): Array<{ title: string; body: string }> => [
  { title: `${pet}: I'm hungry… for English!`, body: 'Solo 5 minutos y me das de comer. ¿Jugamos?' },
  { title: `${pet} learned a new slang word`, body: 'Entra a ver el Daily Drop de hoy antes que nadie.' },
  {
    title: streak > 0 ? `Don't let our ${streak}-day streak go out!` : 'Let’s start a streak today!',
    body: streak > 0 ? `Tu fuego de ${streak} días te espera. Una misión y listo.` : 'Una sola misión enciende tu llama.',
  },
  { title: `${pet} is bored at home…`, body: 'Gana estrellas en un minijuego y decoremos la casa.' },
  { title: 'Psst… your league is moving!', body: 'Tus rivales están sumando XP. ¡No te quedes atrás!' },
  { title: `${pet}: Can we talk in English?`, body: 'Graba 60 segundos de speaking y mi orbe brillará.' },
  { title: 'Weekly event is live!', body: 'Hay palabras y un premio exclusivo esta semana.' },
];

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

let handlerSet = false;

export async function scheduleReminders(params: {
  enabled: boolean;
  hour: number;
  petName: string;
  streak: number;
  practicedToday: boolean;
  mood?: PetMood;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!REMINDERS_SUPPORTED) return { ok: false, reason: 'Las notificaciones funcionan en la app del teléfono.' };
  try {
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerSet = true;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!params.enabled) return { ok: true };
    if (!(await ensurePermission())) return { ok: false, reason: 'Activa las notificaciones en los ajustes del teléfono.' };

    const pet = displayPetName(params.petName);
    const msgs = MESSAGES(pet, params.streak);
    const now = new Date();
    for (let d = 0; d < 7; d++) {
      const at = new Date(now);
      at.setDate(now.getDate() + d);
      at.setHours(params.hour, 0, 0, 0);
      if (at.getTime() <= now.getTime()) continue;
      if (d === 0 && params.practicedToday) continue;
      const msg = msgs[(at.getDate() + d) % msgs.length]!;
      await Notifications.scheduleNotificationAsync({
        content: { title: msg.title, body: tr(msg.body) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'No se pudieron programar los recordatorios.' };
  }
}
