import { createNavigationContainerRef } from '@react-navigation/native';
import type { Screen } from '../context/GameContext';

/**
 * Pila nativa: la raíz ("tabs") muestra la pestaña activa y cada pantalla de detalle se apila
 * encima. Así el botón Atrás de Android y el gesto de deslizar de iOS funcionan de forma nativa.
 */
export type RootStackParamList = {
  tabs: undefined;
  screen: { screen: Screen };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Pantalla visible según el estado de la pila. */
export function currentNavScreen(): Screen {
  if (!navigationRef.isReady()) return { name: 'tabs' };
  const route = navigationRef.getCurrentRoute();
  if (route?.name === 'screen' && route.params && 'screen' in route.params) {
    return (route.params as { screen: Screen }).screen;
  }
  return { name: 'tabs' };
}
