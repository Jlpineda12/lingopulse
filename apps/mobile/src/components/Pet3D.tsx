import React, { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import type { PetConfig, PetMood } from '../game/pet';
import { createPetScene, type PetSceneHandle } from '../pet3d/petScene';
import type { HouseSceneOptions } from '../pet3d/petHouse';
import { haptic } from './motion';

/**
 * Mascota 3D en web (canvas WebGL) y en iOS/Android (expo-gl, funciona en Expo Go).
 * Arrastra para girarla 360°, tócala para que salte de alegría.
 */
interface Pet3DProps {
  config: PetConfig;
  mood: PetMood;
  size?: number;
  speaking?: boolean;
  /** 0–1: brillo del orbe de voz. */
  energy?: number;
  /** Cambia este número para disparar una reacción de alegría. */
  reactKey?: number;
  onTap?: () => void;
  /** Color de fondo en nativo (expo-gl no siempre admite transparencia). */
  backgroundColor?: string;
  /** Casa de la mascota (nivel y muebles colocados). */
  house?: HouseSceneOptions;
  /** Alto/ancho del lienzo (por defecto 0.95). */
  aspectRatio?: number;
}

// Three.js llama a estas funciones de expo-gl que no implementa; silenciamos el ruido.
if (Platform.OS !== 'web') {
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('EXGL')) return;
    warn(...args);
  };
  const log = console.log;
  console.log = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('EXGL')) return;
    log(...args);
  };
}

export function Pet3D({
  config,
  mood,
  size = 180,
  speaking = false,
  energy = 0.7,
  reactKey = 0,
  onTap,
  backgroundColor = '#FFFFFF',
  house,
  aspectRatio = 0.95,
}: Pet3DProps) {
  const height = Math.round(size * aspectRatio);
  const handleRef = useRef<PetSceneHandle | null>(null);
  const live = useRef({ mood, speaking, energy });
  live.current = { mood, speaking, energy };
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const configKey = JSON.stringify(config) + (house ? JSON.stringify(house) : '');
  const mountRef = useRef<View | null>(null);

  useEffect(() => {
    handleRef.current?.setMood(mood);
  }, [mood]);
  useEffect(() => {
    handleRef.current?.setSpeaking(speaking);
  }, [speaking]);
  useEffect(() => {
    handleRef.current?.setEnergy(energy);
  }, [energy]);
  useEffect(() => {
    if (reactKey > 0) handleRef.current?.joy();
  }, [reactKey]);

  const attach = (h: PetSceneHandle) => {
    h.setMood(live.current.mood);
    h.setSpeaking(live.current.speaking);
    h.setEnergy(live.current.energy);
    handleRef.current = h;
  };

  // Gestos (nativo): arrastrar gira, tocar alegra
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4,
        onPanResponderTerminationRequest: () => true,
        onPanResponderMove: (_e, g) => {
          const h = handleRef.current as (PetSceneHandle & { _last?: { x: number; y: number } }) | null;
          if (!h) return;
          const last = h._last ?? { x: 0, y: 0 };
          h.drag(g.dx - last.x, g.dy - last.y);
          h._last = { x: g.dx, y: g.dy };
        },
        onPanResponderRelease: (_e, g) => {
          const h = handleRef.current as (PetSceneHandle & { _last?: { x: number; y: number } }) | null;
          if (h) {
            h._last = undefined;
            h.release();
          }
          if (Math.abs(g.dx) + Math.abs(g.dy) < 8) {
            handleRef.current?.joy();
            haptic('medium');
            onTapRef.current?.();
          }
        },
        onPanResponderTerminate: () => handleRef.current?.release(),
      }),
    []
  );

  // ---------------------------- Web: canvas ----------------------------
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const container = mountRef.current as unknown as HTMLElement | null;
    if (!container || typeof document === 'undefined') return;
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      width: `${size}px`,
      height: `${height}px`,
      display: 'block',
      cursor: 'grab',
      touchAction: 'pan-y',
    });
    container.innerHTML = '';
    container.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.setSize(size, height, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const h = createPetScene(config, size / height, { house });
    attach(h);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let moved = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = 0;
      canvas.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      h.drag(dx, dy);
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = 'grab';
      h.release();
      if (moved < 8) {
        h.joy();
        onTapRef.current?.();
      }
    };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      h.update(dt, (now - t0) / 1000);
      renderer.render(h.scene, h.camera);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      h.dispose();
      renderer.dispose();
      if (handleRef.current === h) handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey, size, height]);

  // ------------------------ Nativo: expo-gl ------------------------
  const nativeCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => nativeCleanup.current?.(), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    nativeCleanup.current?.();
    const w = gl.drawingBufferWidth;
    const hgt = gl.drawingBufferHeight;
    const fakeCanvas = {
      width: w,
      height: hgt,
      style: {},
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      clientWidth: w,
      clientHeight: hgt,
      getContext: () => gl,
    };
    const renderer = new THREE.WebGLRenderer({
      canvas: fakeCanvas as unknown as HTMLCanvasElement,
      context: gl as unknown as WebGLRenderingContext,
      antialias: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(w, hgt, false);
    renderer.setClearColor(new THREE.Color(backgroundColor), 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const h = createPetScene(config, w / hgt, { house });
    attach(h);

    let raf = 0;
    let last = Date.now();
    const t0 = last;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      h.update(dt, (now - t0) / 1000);
      renderer.render(h.scene, h.camera);
      gl.endFrameEXP();
    };
    loop();

    nativeCleanup.current = () => {
      alive = false;
      cancelAnimationFrame(raf);
      h.dispose();
      if (handleRef.current === h) handleRef.current = null;
    };
  };

  if (Platform.OS === 'web') {
    return <View ref={mountRef} style={{ width: size, height }} />;
  }

  return (
    <View style={{ width: size, height }} {...pan.panHandlers}>
      <GLView
        key={`${configKey}-${backgroundColor}`}
        style={{ width: size, height }}
        onContextCreate={onContextCreate}
        msaaSamples={4}
      />
    </View>
  );
}
