import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

/**
 * Íconos propios estilo "sticker" Nintendo/Duolingo (contorno de tinta, dos tonos y brillo).
 * Reemplazan a los emojis en toda la app para que el estilo sea consistente en iOS, Android y web.
 *
 * - Objetos: comida, muebles, accesorios, monedas, trofeos…
 * - Caritas paramétricas (`face-*`, `brow-*`, `mouth-*`, `blush-*`, `species-*`): dibujan
 *   exactamente la parte que se elige en el creador de personajes.
 */

const INK = '#1E2436';
const SW = 2.6; // grosor del contorno (en un lienzo de 48)

const P = {
  stroke: INK,
  strokeWidth: SW,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

const Shine = ({ x, y, rx = 3.2, ry = 2 }: { x: number; y: number; rx?: number; ry?: number }) => (
  <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#FFFFFF" opacity={0.75} transform={`rotate(-30 ${x} ${y})`} />
);

/* ------------------------------------------------------------------ */
/* Caritas paramétricas                                                */
/* ------------------------------------------------------------------ */

type Ears = 'none' | 'cat' | 'bear' | 'bunny' | 'dragon' | 'fox' | 'shark' | 'slim';
type Eyes = 'dot' | 'happy' | 'closed' | 'angry' | 'heart' | 'star' | 'wink' | 'big' | 'cool' | 'x';
type Brow = 'none' | 'soft' | 'bold' | 'hero' | 'worried' | 'raised' | 'dot' | 'unibrow' | 'slit' | 'short';
type Mouth = 'smile' | 'cat' | 'grin' | 'smirk' | 'o' | 'tongue' | 'fangs' | 'pout' | 'wavy' | 'kiss' | 'flat' | 'frown' | 'chew' | 'open';
type Cheeks = 'none' | 'pink' | 'peach' | 'freckles' | 'star' | 'hearts' | 'bandaid' | 'whiskers' | 'stripes' | 'dimples';
type Extra = 'none' | 'zzz' | 'anger' | 'steam' | 'hearts' | 'sparkles' | 'sweat' | 'drool' | 'confetti';

export interface FaceSpec {
  skin?: string;
  ears?: Ears;
  eyes?: Eyes;
  brow?: Brow;
  mouth?: Mouth;
  cheeks?: Cheeks;
  extra?: Extra;
}

function FaceGlyph({ skin = '#FFD9B8', ears = 'none', eyes = 'dot', brow = 'none', mouth = 'smile', cheeks = 'pink', extra = 'none' }: FaceSpec) {
  const headRy = ears === 'slim' ? 17 : 15.5;
  const cy = ears === 'bunny' ? 28 : 27;
  const earsEl = (() => {
    switch (ears) {
      case 'cat':
        return (
          <>
            <Polygon points="9,18 11,4 21,13" fill={skin} {...P} />
            <Polygon points="39,18 37,4 27,13" fill={skin} {...P} />
            <Polygon points="12,14 13,8 17,12" fill="#FF9EBB" />
            <Polygon points="36,14 35,8 31,12" fill="#FF9EBB" />
          </>
        );
      case 'fox':
        return (
          <>
            <Polygon points="8,20 9,3 22,13" fill="#FF8A3D" {...P} />
            <Polygon points="40,20 39,3 26,13" fill="#FF8A3D" {...P} />
            <Polygon points="11,15 11.5,8 17,12.5" fill="#FFF3E0" />
            <Polygon points="37,15 36.5,8 31,12.5" fill="#FFF3E0" />
          </>
        );
      case 'bear':
        return (
          <>
            <Circle cx={11} cy={14} r={6} fill={skin} {...P} />
            <Circle cx={37} cy={14} r={6} fill={skin} {...P} />
            <Circle cx={11} cy={14} r={2.6} fill="#FF9EBB" />
            <Circle cx={37} cy={14} r={2.6} fill="#FF9EBB" />
          </>
        );
      case 'bunny':
        return (
          <>
            <Ellipse cx={17} cy={9} rx={4.5} ry={10} fill={skin} {...P} transform="rotate(-10 17 9)" />
            <Ellipse cx={31} cy={9} rx={4.5} ry={10} fill={skin} {...P} transform="rotate(10 31 9)" />
            <Ellipse cx={17} cy={9} rx={2} ry={6.5} fill="#FF9EBB" transform="rotate(-10 17 9)" />
            <Ellipse cx={31} cy={9} rx={2} ry={6.5} fill="#FF9EBB" transform="rotate(10 31 9)" />
          </>
        );
      case 'dragon':
        return (
          <>
            <Polygon points="15,14 13,3 20,11" fill="#F4C44E" {...P} />
            <Polygon points="33,14 35,3 28,11" fill="#F4C44E" {...P} />
          </>
        );
      case 'shark':
        return <Path d="M24 14 L30 2 Q33 9 32 15 Z" fill="#5B8DEF" {...P} />;
      default:
        return null;
    }
  })();

  const eyeY = cy - 2;
  const eyesEl = (() => {
    const L = 18.5;
    const R = 29.5;
    switch (eyes) {
      case 'happy':
        return (
          <>
            <Path d={`M${L - 3} ${eyeY + 1} Q${L} ${eyeY - 3} ${L + 3} ${eyeY + 1}`} fill="none" {...P} />
            <Path d={`M${R - 3} ${eyeY + 1} Q${R} ${eyeY - 3} ${R + 3} ${eyeY + 1}`} fill="none" {...P} />
          </>
        );
      case 'closed':
        return (
          <>
            <Path d={`M${L - 3} ${eyeY} Q${L} ${eyeY + 3} ${L + 3} ${eyeY}`} fill="none" {...P} />
            <Path d={`M${R - 3} ${eyeY} Q${R} ${eyeY + 3} ${R + 3} ${eyeY}`} fill="none" {...P} />
          </>
        );
      case 'angry':
        return (
          <>
            <Ellipse cx={L} cy={eyeY + 1} rx={2.2} ry={2.6} fill={INK} />
            <Ellipse cx={R} cy={eyeY + 1} rx={2.2} ry={2.6} fill={INK} />
            <Line x1={L - 4} y1={eyeY - 5} x2={L + 3} y2={eyeY - 2} {...P} />
            <Line x1={R + 4} y1={eyeY - 5} x2={R - 3} y2={eyeY - 2} {...P} />
          </>
        );
      case 'x':
        return (
          <>
            <Path d={`M${L - 2.5} ${eyeY - 2.5} L${L + 2.5} ${eyeY + 2.5} M${L + 2.5} ${eyeY - 2.5} L${L - 2.5} ${eyeY + 2.5}`} {...P} />
            <Path d={`M${R - 2.5} ${eyeY - 2.5} L${R + 2.5} ${eyeY + 2.5} M${R + 2.5} ${eyeY - 2.5} L${R - 2.5} ${eyeY + 2.5}`} {...P} />
          </>
        );
      case 'heart':
        return (
          <>
            <Path d={`M${L} ${eyeY + 3} l-3.2 -3.4 a2 2 0 0 1 3.2 -2.4 a2 2 0 0 1 3.2 2.4 z`} fill="#FF4F81" stroke={INK} strokeWidth={1.4} />
            <Path d={`M${R} ${eyeY + 3} l-3.2 -3.4 a2 2 0 0 1 3.2 -2.4 a2 2 0 0 1 3.2 2.4 z`} fill="#FF4F81" stroke={INK} strokeWidth={1.4} />
          </>
        );
      case 'star':
        return (
          <>
            <Polygon points={star(L, eyeY, 3.6, 1.6)} fill="#FFC94D" stroke={INK} strokeWidth={1.3} />
            <Polygon points={star(R, eyeY, 3.6, 1.6)} fill="#FFC94D" stroke={INK} strokeWidth={1.3} />
          </>
        );
      case 'wink':
        return (
          <>
            <Ellipse cx={L} cy={eyeY} rx={2.4} ry={3.4} fill={INK} />
            <Circle cx={L - 0.8} cy={eyeY - 1.3} r={0.9} fill="#FFFFFF" />
            <Path d={`M${R - 3} ${eyeY + 1} Q${R} ${eyeY - 3} ${R + 3} ${eyeY + 1}`} fill="none" {...P} />
          </>
        );
      case 'big':
        return (
          <>
            {[L, R].map((x) => (
              <G key={x}>
                <Ellipse cx={x} cy={eyeY} rx={3.4} ry={4.6} fill={INK} />
                <Ellipse cx={x} cy={eyeY + 1.6} rx={2.4} ry={2.2} fill="#3F7BFF" />
                <Circle cx={x - 1.1} cy={eyeY - 1.8} r={1.4} fill="#FFFFFF" />
              </G>
            ))}
          </>
        );
      case 'cool':
        return <Rect x={13} y={eyeY - 3.5} width={22} height={6} rx={3} fill={INK} />;
      default:
        return (
          <>
            {[L, R].map((x) => (
              <G key={x}>
                <Ellipse cx={x} cy={eyeY} rx={2.4} ry={3.4} fill={INK} />
                <Circle cx={x - 0.8} cy={eyeY - 1.3} r={0.9} fill="#FFFFFF" />
              </G>
            ))}
          </>
        );
    }
  })();

  const browY = eyeY - 6.5;
  const browEl = (() => {
    const L = 18.5;
    const R = 29.5;
    const b = { ...P, strokeWidth: 2.2, fill: 'none' };
    switch (brow) {
      case 'soft':
        return (
          <>
            <Path d={`M${L - 3} ${browY} Q${L} ${browY - 1.6} ${L + 3} ${browY}`} {...b} />
            <Path d={`M${R - 3} ${browY} Q${R} ${browY - 1.6} ${R + 3} ${browY}`} {...b} />
          </>
        );
      case 'bold':
        return (
          <>
            <Rect x={L - 4} y={browY - 2.2} width={8} height={3.4} rx={1.7} fill={INK} />
            <Rect x={R - 4} y={browY - 2.2} width={8} height={3.4} rx={1.7} fill={INK} />
          </>
        );
      case 'hero':
        return (
          <>
            <Line x1={L - 4} y1={browY - 2} x2={L + 3} y2={browY + 1} {...b} strokeWidth={2.8} />
            <Line x1={R + 4} y1={browY - 2} x2={R - 3} y2={browY + 1} {...b} strokeWidth={2.8} />
          </>
        );
      case 'worried':
        return (
          <>
            <Line x1={L - 3} y1={browY + 1} x2={L + 3} y2={browY - 2} {...b} />
            <Line x1={R + 3} y1={browY + 1} x2={R - 3} y2={browY - 2} {...b} />
          </>
        );
      case 'raised':
        return (
          <>
            <Path d={`M${L - 3} ${browY} Q${L} ${browY - 3} ${L + 3} ${browY}`} {...b} />
            <Path d={`M${R - 3} ${browY - 2} Q${R} ${browY - 5} ${R + 3} ${browY - 2}`} {...b} />
          </>
        );
      case 'dot':
        return (
          <>
            <Circle cx={L} cy={browY - 0.5} r={1.7} fill={INK} />
            <Circle cx={R} cy={browY - 0.5} r={1.7} fill={INK} />
          </>
        );
      case 'unibrow':
        return <Path d={`M${L - 4} ${browY} Q24 ${browY - 2.5} ${R + 4} ${browY}`} {...b} strokeWidth={3} />;
      case 'slit':
        return (
          <>
            <Path d={`M${L - 3} ${browY} L${L - 0.5} ${browY - 0.6} M${L + 1} ${browY - 0.8} L${L + 3} ${browY - 1}`} {...b} />
            <Path d={`M${R - 3} ${browY - 1} L${R + 3} ${browY}`} {...b} />
          </>
        );
      case 'short':
        return (
          <>
            <Line x1={L - 1.5} y1={browY} x2={L + 1.5} y2={browY} {...b} />
            <Line x1={R - 1.5} y1={browY} x2={R + 1.5} y2={browY} {...b} />
          </>
        );
      default:
        return null;
    }
  })();

  const my = cy + 6;
  const mouthEl = (() => {
    const m = { ...P, strokeWidth: 2.2 };
    switch (mouth) {
      case 'cat':
        return <Path d={`M19 ${my - 1} Q21.5 ${my + 2} 24 ${my - 1} Q26.5 ${my + 2} 29 ${my - 1}`} fill="none" {...m} />;
      case 'grin':
        return (
          <>
            <Path d={`M18 ${my - 2} Q24 ${my + 6} 30 ${my - 2} Z`} fill="#FFFFFF" {...m} />
            <Line x1={24} y1={my - 2} x2={24} y2={my + 1.6} stroke={INK} strokeWidth={1.2} />
          </>
        );
      case 'smirk':
        return <Path d={`M20 ${my} Q25 ${my + 2} 29 ${my - 2.5}`} fill="none" {...m} />;
      case 'o':
      case 'open':
        return <Ellipse cx={24} cy={my + 0.5} rx={3} ry={mouth === 'o' ? 3.4 : 2.6} fill="#5A1A33" {...m} />;
      case 'tongue':
        return (
          <>
            <Path d={`M19 ${my - 1} Q24 ${my + 3} 29 ${my - 1}`} fill="none" {...m} />
            <Path d={`M22 ${my + 0.6} Q24 ${my + 5} 26 ${my + 0.6}`} fill="#FF6F91" {...m} strokeWidth={1.6} />
          </>
        );
      case 'fangs':
        return (
          <>
            <Path d={`M18.5 ${my - 1} Q24 ${my + 3.5} 29.5 ${my - 1}`} fill="none" {...m} />
            <Polygon points={`20.5,${my} 22,${my + 3} 23,${my + 0.8}`} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
            <Polygon points={`27.5,${my} 26,${my + 3} 25,${my + 0.8}`} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
          </>
        );
      case 'pout':
        return <Path d={`M20.5 ${my + 1.5} Q24 ${my - 2} 27.5 ${my + 1.5}`} fill="none" {...m} />;
      case 'frown':
        return <Path d={`M19.5 ${my + 2} Q24 ${my - 2.5} 28.5 ${my + 2}`} fill="none" {...m} />;
      case 'wavy':
        return <Path d={`M18.5 ${my} q2 -2 4 0 t4 0 t4 0`} fill="none" {...m} />;
      case 'kiss':
        return <Path d={`M23 ${my - 3} q3 1.2 0 2.5 q3 1.2 0 2.6`} fill="none" {...m} />;
      case 'flat':
        return <Line x1={20.5} y1={my} x2={27.5} y2={my} {...m} />;
      case 'chew':
        return <Path d={`M19 ${my} Q21 ${my + 3} 24 ${my} Q27 ${my + 3} 29 ${my}`} fill="#FFB27A" {...m} />;
      default:
        return <Path d={`M19 ${my - 1} Q24 ${my + 4} 29 ${my - 1}`} fill="none" {...m} />;
    }
  })();

  const cheekY = cy + 3;
  const cheeksEl = (() => {
    switch (cheeks) {
      case 'pink':
      case 'peach':
        return (
          <>
            <Ellipse cx={13} cy={cheekY} rx={3.4} ry={2} fill={cheeks === 'pink' ? '#FF7AA2' : '#FFAE7A'} opacity={0.7} />
            <Ellipse cx={35} cy={cheekY} rx={3.4} ry={2} fill={cheeks === 'pink' ? '#FF7AA2' : '#FFAE7A'} opacity={0.7} />
          </>
        );
      case 'freckles':
        return (
          <G fill="#B9733F">
            {[11, 13.5, 12.2, 34.5, 37, 35.8].map((x, i) => (
              <Circle key={i} cx={x} cy={cheekY + (i % 3 === 2 ? 1.8 : 0)} r={0.9} />
            ))}
          </G>
        );
      case 'star':
        return (
          <>
            <Polygon points={star(13, cheekY, 2.8, 1.2)} fill="#FFC94D" />
            <Polygon points={star(35, cheekY, 2.8, 1.2)} fill="#FFC94D" />
          </>
        );
      case 'hearts':
        return (
          <>
            <Path d={`M13 ${cheekY + 2} l-2.4 -2.4 a1.4 1.4 0 0 1 2.4 -1.8 a1.4 1.4 0 0 1 2.4 1.8 z`} fill="#FF4F81" />
            <Path d={`M35 ${cheekY + 2} l-2.4 -2.4 a1.4 1.4 0 0 1 2.4 -1.8 a1.4 1.4 0 0 1 2.4 1.8 z`} fill="#FF4F81" />
          </>
        );
      case 'bandaid':
        return (
          <G transform={`rotate(-20 34 ${cheekY})`}>
            <Rect x={29.5} y={cheekY - 2} width={9} height={4} rx={1.6} fill="#F6C89B" stroke={INK} strokeWidth={1.2} />
            <Rect x={32.6} y={cheekY - 1.2} width={2.8} height={2.4} fill="#E9A974" />
          </G>
        );
      case 'whiskers':
        return (
          <G stroke={INK} strokeWidth={1.3} strokeLinecap="round">
            <Line x1={6} y1={cheekY - 1} x2={13} y2={cheekY} />
            <Line x1={6} y1={cheekY + 2} x2={13} y2={cheekY + 1.5} />
            <Line x1={42} y1={cheekY - 1} x2={35} y2={cheekY} />
            <Line x1={42} y1={cheekY + 2} x2={35} y2={cheekY + 1.5} />
          </G>
        );
      case 'stripes':
        return (
          <G stroke="#FF5A5F" strokeWidth={1.8} strokeLinecap="round">
            <Line x1={10} y1={cheekY - 1.5} x2={15} y2={cheekY - 1.5} />
            <Line x1={10} y1={cheekY + 1.5} x2={15} y2={cheekY + 1.5} />
            <Line x1={33} y1={cheekY - 1.5} x2={38} y2={cheekY - 1.5} />
            <Line x1={33} y1={cheekY + 1.5} x2={38} y2={cheekY + 1.5} />
          </G>
        );
      case 'dimples':
        return (
          <G fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round">
            <Path d={`M15 ${cheekY + 2} q1 1 2 0`} />
            <Path d={`M31 ${cheekY + 2} q1 1 2 0`} />
          </G>
        );
      default:
        return null;
    }
  })();

  const extraEl = (() => {
    switch (extra) {
      case 'zzz':
        return (
          <G stroke={INK} strokeWidth={1.6} fill="none" strokeLinejoin="round">
            <Path d="M36 6 h5 l-5 5 h5" />
            <Path d="M41 14 h3.5 l-3.5 3.5 h3.5" />
          </G>
        );
      case 'anger':
        return (
          <G stroke="#FF3B30" strokeWidth={2.2} strokeLinecap="round" fill="none">
            <Path d="M35 6 q2 3 5 0 M35 6 q-1 3 2 5 M40 6 q1 3 -2 5" />
          </G>
        );
      case 'steam':
        return (
          <G fill="#E2E8F4" stroke={INK} strokeWidth={1.4}>
            <Circle cx={9} cy={9} r={3.4} />
            <Circle cx={39} cy={8} r={4} />
            <Circle cx={43} cy={13} r={2.4} />
          </G>
        );
      case 'hearts':
        return (
          <>
            <Path d="M40 12 l-3.6 -3.6 a2 2 0 0 1 3.6 -2.6 a2 2 0 0 1 3.6 2.6 z" fill="#FF4F81" stroke={INK} strokeWidth={1.2} />
            <Path d="M8 9 l-2.6 -2.6 a1.5 1.5 0 0 1 2.6 -1.9 a1.5 1.5 0 0 1 2.6 1.9 z" fill="#FF9EBB" stroke={INK} strokeWidth={1.1} />
          </>
        );
      case 'sparkles':
        return (
          <>
            <Polygon points={star(40, 8, 4, 1.5)} fill="#FFC94D" stroke={INK} strokeWidth={1.1} />
            <Polygon points={star(8, 10, 3, 1.1)} fill="#FFC94D" stroke={INK} strokeWidth={1} />
          </>
        );
      case 'confetti':
        return (
          <G>
            <Rect x={6} y={6} width={3} height={5} fill="#FF4F81" transform="rotate(25 7 8)" />
            <Rect x={38} y={5} width={3} height={5} fill="#4FACFE" transform="rotate(-20 39 7)" />
            <Circle cx={43} cy={14} r={1.8} fill="#FFC94D" />
            <Circle cx={5} cy={16} r={1.6} fill="#22B567" />
          </G>
        );
      case 'sweat':
        return <Path d="M38 13 q-3 4 0 6 q3 -2 0 -6z" fill="#7FD3FF" stroke={INK} strokeWidth={1.2} />;
      case 'drool':
        return <Path d={`M27 ${my + 2} q-1 4 1 5 q2 -1 -1 -5z`} fill="#7FD3FF" stroke={INK} strokeWidth={1} />;
      default:
        return null;
    }
  })();

  return (
    <>
      {earsEl}
      <Ellipse cx={24} cy={cy} rx={ears === 'slim' ? 13 : 16.5} ry={headRy} fill={skin} {...P} />
      {ears === 'fox' ? <Path d={`M24 ${cy + 1} Q16 ${cy + 4} 15 ${cy + 11} Q24 ${cy + 16} 33 ${cy + 11} Q32 ${cy + 4} 24 ${cy + 1}Z`} fill="#FFF3E0" /> : null}
      {ears === 'shark' ? <Path d={`M12 ${cy + 4} Q24 ${cy + 16} 36 ${cy + 4}`} fill="#EAF4FF" /> : null}
      <Shine x={16} y={cy - 9} rx={4} ry={2.2} />
      {cheeksEl}
      {browEl}
      {eyesEl}
      {mouthEl}
      {extraEl}
    </>
  );
}

function star(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return pts.join(' ');
}

/* ------------------------------------------------------------------ */
/* Objetos                                                             */
/* ------------------------------------------------------------------ */

const OBJECTS: Record<string, () => React.ReactElement> = {
  coin: () => (
    <>
      <Circle cx={24} cy={25} r={16} fill="#E0A21E" {...P} />
      <Circle cx={24} cy={23} r={16} fill="#FFD34D" {...P} />
      <Circle cx={24} cy={23} r={10.5} fill="none" stroke="#E0A21E" strokeWidth={2.4} />
      <Path d="M24 16 v14 M20.5 19.5 h5 a2.6 2.6 0 0 1 0 5.2 h-4 a2.6 2.6 0 0 0 0 5.2 h5" fill="none" stroke="#B67700" strokeWidth={2.2} strokeLinecap="round" />
      <Shine x={16} y={14} />
    </>
  ),
  gem: () => (
    <>
      <Polygon points="12,18 18,9 30,9 36,18 24,40" fill="#4FD1FF" {...P} />
      <Polygon points="12,18 36,18 24,40" fill="#1FA2E8" />
      <Path d="M12 18 H36 M18 9 L22 18 L24 40 M30 9 L26 18" fill="none" {...P} strokeWidth={1.8} />
      <Shine x={19} y={13} rx={2.4} ry={1.4} />
    </>
  ),
  star: () => (
    <>
      <Polygon points={star(24, 25, 18, 8)} fill="#FFC94D" {...P} />
      <Polygon points={star(24, 25, 10, 4.5)} fill="#FFE08A" />
      <Shine x={18} y={19} rx={2.6} ry={1.6} />
    </>
  ),
  flame: () => (
    <>
      <Path d="M24 6 C30 14 38 18 36 30 C35 38 29 43 24 43 C17 43 11 38 12 29 C13 22 18 22 19 15 C22 18 24 20 24 6Z" fill="#FF7A1A" {...P} />
      <Path d="M24 22 C28 27 31 29 30 34 C29 38 27 40 24 40 C20 40 18 37 18 34 C18 30 22 29 24 22Z" fill="#FFD34D" />
      <Shine x={17} y={27} rx={2} ry={3.4} />
    </>
  ),
  trophy: () => (
    <>
      <Path d="M14 9 H34 V20 C34 27 30 31 24 31 C18 31 14 27 14 20Z" fill="#FFC94D" {...P} />
      <Path d="M14 12 H8 C8 19 11 22 15 22 M34 12 H40 C40 19 37 22 33 22" fill="none" {...P} />
      <Rect x={21} y={31} width={6} height={5} fill="#E0A21E" {...P} />
      <Rect x={15} y={36} width={18} height={6} rx={2} fill="#8B5A2B" {...P} />
      <Shine x={19} y={14} />
    </>
  ),
  gift: () => (
    <>
      <Rect x={9} y={20} width={30} height={21} rx={3} fill="#FF4F81" {...P} />
      <Rect x={7} y={14} width={34} height={8} rx={2.5} fill="#FF7A9E" {...P} />
      <Rect x={21} y={14} width={6} height={27} fill="#FFC94D" {...P} />
      <Path d="M24 14 C18 5 12 9 16 14 M24 14 C30 5 36 9 32 14" fill="none" {...P} />
      <Shine x={13} y={25} />
    </>
  ),
  chest: () => (
    <>
      <Path d="M8 22 Q8 10 24 10 Q40 10 40 22 Z" fill="#B7743A" {...P} />
      <Rect x={8} y={22} width={32} height={18} rx={2} fill="#9A5B2A" {...P} />
      <Rect x={8} y={21} width={32} height={4} fill="#FFC94D" {...P} />
      <Rect x={21} y={21} width={6} height={9} rx={1.5} fill="#FFC94D" {...P} />
      <Polygon points="16,9 19,4 22,9" fill="#4FD1FF" stroke={INK} strokeWidth={1.4} />
      <Shine x={14} y={15} />
    </>
  ),
  house: () => (
    <>
      <Polygon points="6,24 24,8 42,24" fill="#FF6B6B" {...P} />
      <Rect x={10} y={23} width={28} height={19} fill="#FFE9C7" {...P} />
      <Rect x={20} y={30} width={8} height={12} rx={1.5} fill="#8B5A2B" {...P} />
      <Rect x={13} y={27} width={5} height={5} fill="#7FD3FF" stroke={INK} strokeWidth={1.6} />
      <Rect x={30} y={27} width={5} height={5} fill="#7FD3FF" stroke={INK} strokeWidth={1.6} />
      <Rect x={31} y={10} width={4} height={8} fill="#B7743A" {...P} />
    </>
  ),
  hammer: () => (
    <>
      <Rect x={21.5} y={18} width={5} height={24} rx={2} fill="#B7743A" {...P} transform="rotate(35 24 30)" />
      <Rect x={10} y={8} width={22} height={10} rx={2.5} fill="#AAB6CC" {...P} transform="rotate(35 21 13)" />
      <Shine x={14} y={10} rx={2.4} ry={1.2} />
    </>
  ),
  lock: () => (
    <>
      <Path d="M16 21 V15 a8 8 0 0 1 16 0 V21" fill="none" {...P} strokeWidth={3.4} />
      <Rect x={11} y={20} width={26} height={21} rx={5} fill="#FFC94D" {...P} />
      <Circle cx={24} cy={29} r={2.6} fill={INK} />
      <Rect x={23} y={30} width={2} height={5} fill={INK} />
    </>
  ),
  check: () => (
    <>
      <Circle cx={24} cy={24} r={17} fill="#22B567" {...P} />
      <Path d="M15.5 24.5 L21.5 30.5 L33 18" fill="none" stroke="#FFFFFF" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  sparkle: () => (
    <>
      <Path d="M24 5 C25.5 17 31 22.5 43 24 C31 25.5 25.5 31 24 43 C22.5 31 17 25.5 5 24 C17 22.5 22.5 17 24 5Z" fill="#FFE08A" {...P} />
      <Path d="M38 6 C38.5 9 39.5 10 42 10.5 C39.5 11 38.5 12 38 15 C37.5 12 36.5 11 34 10.5 C36.5 10 37.5 9 38 6Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.3} />
    </>
  ),
  heart: () => (
    <>
      <Path d="M24 41 L9 26 C3 19 8 9 16 10 C20 10.5 22.5 13 24 16 C25.5 13 28 10.5 32 10 C40 9 45 19 39 26 Z" fill="#FF4F81" {...P} />
      <Shine x={15} y={17} rx={3.6} ry={2.2} />
    </>
  ),
  bolt: () => (
    <>
      <Polygon points="27,4 10,27 22,27 19,44 38,19 26,19" fill="#FFD34D" {...P} />
      <Shine x={22} y={14} rx={1.6} ry={3} />
    </>
  ),
  moon: () => (
    <>
      <Path d="M32 8 A17 17 0 1 0 40 32 A13 13 0 1 1 32 8Z" fill="#B9A7FF" {...P} />
      <Circle cx={20} cy={30} r={2.4} fill="#9B87F5" />
      <Circle cx={26} cy={36} r={1.6} fill="#9B87F5" />
      <Polygon points={star(38, 12, 3.4, 1.4)} fill="#FFE08A" stroke={INK} strokeWidth={1.1} />
    </>
  ),
  bulb: () => (
    <>
      <Path d="M24 5 C14 5 9 13 11 21 C12.5 26 17 28 17 33 H31 C31 28 35.5 26 37 21 C39 13 34 5 24 5Z" fill="#FFE08A" {...P} />
      <Rect x={17} y={33} width={14} height={4} rx={1.5} fill="#AAB6CC" {...P} />
      <Rect x={19} y={37} width={10} height={4} rx={1.5} fill="#8F9BB3" {...P} />
      <Path d="M20 25 q4 -6 8 0" fill="none" stroke="#E0A21E" strokeWidth={2} strokeLinecap="round" />
      <Shine x={17} y={13} />
    </>
  ),
  anger: () => (
    <G stroke="#FF3B30" strokeWidth={4.4} strokeLinecap="round" fill="none">
      <Path d="M10 18 Q18 18 18 10" />
      <Path d="M30 10 Q30 18 38 18" />
      <Path d="M10 30 Q18 30 18 38" />
      <Path d="M38 30 Q30 30 30 38" />
    </G>
  ),
  balloon: () => (
    <>
      <Ellipse cx={24} cy={19} rx={12} ry={14} fill="#FF7AA2" {...P} />
      <Polygon points="22,33 26,33 24,36" fill="#FF7AA2" {...P} strokeWidth={1.6} />
      <Path d="M24 36 Q20 40 25 44" fill="none" {...P} strokeWidth={1.8} />
      <Shine x={18} y={13} rx={3} ry={4} />
    </>
  ),
  mic: () => (
    <>
      <Rect x={17} y={5} width={14} height={22} rx={7} fill="#AAB6CC" {...P} />
      <Path d="M17 14 H31 M17 19 H31" stroke={INK} strokeWidth={1.4} />
      <Path d="M12 22 C12 30 17 34 24 34 C31 34 36 30 36 22" fill="none" {...P} />
      <Path d="M24 34 V41 M17 42 H31" fill="none" {...P} />
      <Shine x={21} y={9} rx={1.6} ry={2.4} />
    </>
  ),
  megaphone: () => (
    <>
      <Polygon points="10,19 30,9 30,39 10,29" fill="#FF7A1A" {...P} />
      <Rect x={5} y={18} width={7} height={12} rx={2} fill="#FFD34D" {...P} />
      <Path d="M35 17 q4 7 0 14 M39 13 q7 11 0 22" fill="none" {...P} strokeWidth={2.2} />
    </>
  ),
  headphones: () => (
    <>
      <Path d="M9 29 V24 a15 15 0 0 1 30 0 V29" fill="none" {...P} strokeWidth={4} />
      <Rect x={6} y={25} width={10} height={15} rx={4} fill="#FF4F81" {...P} />
      <Rect x={32} y={25} width={10} height={15} rx={4} fill="#FF4F81" {...P} />
    </>
  ),
  boombox: () => (
    <>
      <Path d="M14 15 Q24 6 34 15" fill="none" {...P} />
      <Rect x={6} y={15} width={36} height={24} rx={5} fill="#4FACFE" {...P} />
      <Circle cx={15} cy={28} r={6} fill="#2B3B5C" {...P} />
      <Circle cx={33} cy={28} r={6} fill="#2B3B5C" {...P} />
      <Rect x={20} y={19} width={8} height={4} rx={1} fill="#FFE08A" stroke={INK} strokeWidth={1.2} />
      <Circle cx={15} cy={28} r={2} fill="#AAB6CC" />
      <Circle cx={33} cy={28} r={2} fill="#AAB6CC" />
    </>
  ),
  telescope: () => (
    <>
      <Rect x={8} y={12} width={28} height={9} rx={3} fill="#C9A15A" {...P} transform="rotate(-22 22 16)" />
      <Rect x={31} y={6} width={9} height={12} rx={2} fill="#8B5CF6" {...P} transform="rotate(-22 35 12)" />
      <Path d="M22 22 L14 42 M22 22 L30 42 M22 22 V42" fill="none" {...P} />
    </>
  ),
  bonsai: () => (
    <>
      <Path d="M14 34 H34 L31 43 H17 Z" fill="#C2410C" {...P} />
      <Path d="M24 34 C24 28 20 26 22 20" fill="none" stroke="#8B5A2B" strokeWidth={3.4} strokeLinecap="round" />
      <Ellipse cx={18} cy={18} rx={9} ry={6} fill="#22B567" {...P} />
      <Ellipse cx={31} cy={15} rx={8} ry={5.5} fill="#2FCB77" {...P} />
      <Ellipse cx={25} cy={9} rx={7} ry={5} fill="#22B567" {...P} />
    </>
  ),
  campfire: () => (
    <>
      <Path d="M8 40 L40 32 M8 32 L40 40" stroke="#8B5A2B" strokeWidth={5} strokeLinecap="round" />
      <Path d="M8 40 L40 32 M8 32 L40 40" stroke={INK} strokeWidth={1.2} strokeLinecap="round" opacity={0.4} />
      <Path d="M24 6 C30 13 34 17 33 25 C32 31 28 34 24 34 C19 34 15 31 15 25 C15 19 19 18 20 13 C22 16 23 17 24 6Z" fill="#FF7A1A" {...P} />
      <Path d="M24 18 C27 22 29 24 28 28 C27.5 31 26 32 24 32 C21.5 32 20 30 20 28 C20 25 23 24 24 18Z" fill="#FFD34D" />
    </>
  ),
  clear: () => (
    <>
      <Circle cx={24} cy={24} r={16} fill="#EDF1F9" {...P} strokeDasharray="4 4" />
      <Polygon points={star(24, 24, 7, 3)} fill="#FFE08A" stroke={INK} strokeWidth={1.4} />
    </>
  ),
  map: () => (
    <>
      <Polygon points="6,12 18,7 30,12 42,7 42,37 30,42 18,37 6,42" fill="#FFE9C7" {...P} />
      <Path d="M18 7 V37 M30 12 V42" stroke={INK} strokeWidth={1.6} />
      <Path d="M11 30 q6 -10 12 -4 t12 -8" fill="none" stroke="#FF4F81" strokeWidth={2} strokeDasharray="3 3" strokeLinecap="round" />
      <Path d="M33 15 l4 4 m0 -4 l-4 4" stroke="#FF3B30" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  anchor: () => (
    <>
      <Circle cx={24} cy={10} r={4} fill="none" {...P} />
      <Path d="M24 14 V40 M16 20 H32" fill="none" {...P} strokeWidth={3.2} />
      <Path d="M9 28 C10 37 17 41 24 41 C31 41 38 37 39 28" fill="none" {...P} strokeWidth={3.2} />
      <Polygon points="6,30 12,26 12,32" fill={INK} />
      <Polygon points="42,30 36,26 36,32" fill={INK} />
    </>
  ),
  sun: () => (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Rect key={a} x={22.5} y={3} width={3} height={7} rx={1.5} fill="#FFB800" stroke={INK} strokeWidth={1.2} transform={`rotate(${a} 24 24)`} />
      ))}
      <Circle cx={24} cy={24} r={11} fill="#FFD34D" {...P} />
      <Shine x={20} y={19} />
    </>
  ),
  sunset: () => (
    <>
      <Path d="M8 32 A16 16 0 0 1 40 32 Z" fill="#FF8A3D" {...P} />
      <Path d="M4 32 H44 M10 37 H38 M16 42 H32" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M24 8 V12 M10 14 l3 3 M38 14 l-3 3" stroke="#FFB800" strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  hair: () => (
    <>
      <Path d="M8 30 C6 14 16 6 26 7 C36 8 43 16 40 30 C36 24 33 20 28 19 C26 24 20 26 14 24 C12 27 10 29 8 30Z" fill="#7C4A27" {...P} />
      <Path d="M18 12 q4 -3 9 -2" fill="none" stroke="#B9733F" strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={14} y={34} width={20} height={6} rx={3} fill="#4FACFE" {...P} />
      <Path d="M17 34 V30 M21 34 V30 M25 34 V30 M29 34 V30" stroke={INK} strokeWidth={1.6} />
    </>
  ),
  shield: () => (
    <>
      <Path d="M24 4 L40 10 V22 C40 33 33 40 24 44 C15 40 8 33 8 22 V10 Z" fill="#4FACFE" {...P} />
      <Path d="M24 9 L35 13.5 V22 C35 30 30 35.5 24 38.5 Z" fill="#7FD3FF" />
      <Path d="M17 23 L22 28 L31 18" fill="none" stroke="#FFFFFF" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
      <Shine x={15} y={13} rx={2.4} ry={1.4} />
    </>
  ),
  'shield-empty': () => (
    <>
      <Path d="M24 4 L40 10 V22 C40 33 33 40 24 44 C15 40 8 33 8 22 V10 Z" fill="#E2E8F4" {...P} strokeDasharray="4 3" />
    </>
  ),
  'medal-bronze': () => medal('#E5A46A', '#B8722F'),
  'medal-silver': () => medal('#E2E8F4', '#9AA6BF'),
  'medal-gold': () => medal('#FFD34D', '#E0A21E'),
  'gem-ruby': () => (
    <>
      <Polygon points="12,18 18,9 30,9 36,18 24,40" fill="#FF4F6E" {...P} />
      <Polygon points="12,18 36,18 24,40" fill="#D4145A" />
      <Path d="M12 18 H36 M18 9 L22 18 L24 40 M30 9 L26 18" fill="none" {...P} strokeWidth={1.8} />
      <Shine x={19} y={13} rx={2.4} ry={1.4} />
    </>
  ),
  'gem-diamond': () => (
    <>
      <Polygon points="10,17 17,8 31,8 38,17 24,41" fill="#D8C4FF" {...P} />
      <Polygon points="10,17 38,17 24,41" fill="#A779FF" />
      <Path d="M10 17 H38 M17 8 L21 17 L24 41 M31 8 L27 17 M24 8 L21 17 M24 8 L27 17" fill="none" {...P} strokeWidth={1.6} />
      <Polygon points={star(37, 8, 3.4, 1.3)} fill="#FFFFFF" stroke={INK} strokeWidth={1} />
    </>
  ),
  parrot: () => (
    <>
      <Path d="M30 40 L36 46 M26 40 L28 46" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Ellipse cx={24} cy={28} rx={10} ry={13} fill="#22B567" {...P} />
      <Path d="M16 30 C10 34 12 42 18 40 Z" fill="#4FACFE" {...P} strokeWidth={2} />
      <Circle cx={24} cy={14} r={9} fill="#FF4F5E" {...P} />
      <Path d="M31 13 C38 14 37 21 31 19 Z" fill="#FFC94D" {...P} strokeWidth={2} />
      <Circle cx={26} cy={12} r={2.2} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
      <Circle cx={26.5} cy={12} r={1} fill={INK} />
    </>
  ),
  arcade: () => (
    <>
      <Path d="M12 6 H36 L38 42 H10 Z" fill="#7B5CFF" {...P} />
      <Rect x={15} y={10} width={18} height={13} rx={2} fill="#4FD1FF" stroke={INK} strokeWidth={1.8} />
      <Path d="M10 27 H38" stroke={INK} strokeWidth={2} />
      <Circle cx={18} cy={32} r={2.8} fill="#FF4F5E" stroke={INK} strokeWidth={1.4} />
      <Circle cx={27} cy={32} r={2} fill="#FFC94D" stroke={INK} strokeWidth={1.2} />
      <Circle cx={32} cy={32} r={2} fill="#22B567" stroke={INK} strokeWidth={1.2} />
      <Polygon points="20,14 26,16.5 20,19" fill="#FFFFFF" />
    </>
  ),
  lantern: () => (
    <>
      <Path d="M24 2 V8" stroke={INK} strokeWidth={2.4} />
      <Rect x={17} y={7} width={14} height={4} rx={1.5} fill="#FFC94D" {...P} strokeWidth={1.8} />
      <Ellipse cx={24} cy={24} rx={14} ry={14} fill="#FF4F5E" {...P} />
      <Path d="M17 12 Q12 24 17 36 M24 10 V38 M31 12 Q36 24 31 36" fill="none" stroke="#C2183A" strokeWidth={1.6} />
      <Rect x={17} y={37} width={14} height={4} rx={1.5} fill="#FFC94D" {...P} strokeWidth={1.8} />
      <Path d="M24 41 V46" stroke="#FFC94D" strokeWidth={2.4} strokeLinecap="round" />
      <Shine x={18} y={18} />
    </>
  ),
  suitcase: () => (
    <>
      <Path d="M18 12 V8 H30 V12" fill="none" {...P} />
      <Rect x={6} y={12} width={36} height={28} rx={5} fill="#FF8A3D" {...P} />
      <Rect x={20} y={12} width={4} height={28} fill="#8B5A2B" />
      <Circle cx={13} cy={22} r={3.4} fill="#4FACFE" stroke={INK} strokeWidth={1.2} />
      <Rect x={29} y={28} width={9} height={6} rx={1.5} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
      <Circle cx={12} cy={42} r={2} fill={INK} />
      <Circle cx={36} cy={42} r={2} fill={INK} />
    </>
  ),
  calendar: () => (
    <>
      <Rect x={7} y={10} width={34} height={32} rx={5} fill="#FFFFFF" {...P} />
      <Path d="M7 15 a5 5 0 0 1 5 -5 h24 a5 5 0 0 1 5 5 v4 H7 Z" fill="#FF4F5E" {...P} />
      <Path d="M16 6 V13 M32 6 V13" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <G fill="#FFC94D" stroke={INK} strokeWidth={1}>
        <Rect x={13} y={24} width={6} height={5} rx={1} />
        <Rect x={21} y={24} width={6} height={5} rx={1} />
        <Rect x={29} y={24} width={6} height={5} rx={1} />
        <Rect x={13} y={32} width={6} height={5} rx={1} />
      </G>
    </>
  ),
  share: () => (
    <>
      <Rect x={9} y={18} width={30} height={24} rx={6} fill="#EAF3FF" {...P} />
      <Path d="M24 30 V6 M16 13 L24 5 L32 13" fill="none" stroke="#007AFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bell: () => (
    <>
      <Path d="M24 6 C15 6 12 13 12 21 V30 L8 35 H40 L36 30 V21 C36 13 33 6 24 6Z" fill="#FFC94D" {...P} />
      <Path d="M19 39 a5 5 0 0 0 10 0" fill="#FF8A3D" {...P} />
      <Shine x={18} y={14} />
    </>
  ),
  rocket: () => (
    <>
      <Path d="M24 4 C32 10 34 20 32 30 H16 C14 20 16 10 24 4Z" fill="#FFFFFF" {...P} />
      <Circle cx={24} cy={17} r={4} fill="#4FACFE" stroke={INK} strokeWidth={1.8} />
      <Path d="M16 24 L9 32 L16 31 Z M32 24 L39 32 L32 31 Z" fill="#FF4F5E" {...P} strokeWidth={2} />
      <Path d="M19 32 C19 38 24 44 24 44 C24 44 29 38 29 32 Z" fill="#FF8A3D" {...P} strokeWidth={2} />
    </>
  ),
  /* --------------------------- Comida --------------------------- */
  apple: () => (
    <>
      <Path d="M24 15 C18 10 8 13 9 25 C10 36 17 42 24 40 C31 42 38 36 39 25 C40 13 30 10 24 15Z" fill="#FF4F5E" {...P} />
      <Path d="M24 15 C24 10 25 7 28 5" fill="none" {...P} />
      <Ellipse cx={31} cy={9} rx={5} ry={2.6} fill="#22B567" {...P} transform="rotate(-25 31 9)" />
      <Shine x={15} y={21} rx={3} ry={4.4} />
    </>
  ),
  tea: () => (
    <>
      <Path d="M8 18 H34 V30 C34 37 29 41 21 41 C13 41 8 37 8 30Z" fill="#FFFFFF" {...P} />
      <Path d="M34 21 C41 21 41 31 34 31" fill="none" {...P} />
      <Ellipse cx={21} cy={18} rx={13} ry={3} fill="#7BC67E" {...P} />
      <Path d="M16 7 q-2 4 0 7 M22 5 q-2 4 0 8 M28 7 q-2 4 0 7" fill="none" stroke="#AAB6CC" strokeWidth={2} strokeLinecap="round" />
      <Circle cx={15} cy={30} r={2} fill="#FF7AA2" />
    </>
  ),
  taco: () => (
    <>
      <Path d="M5 34 C5 18 15 10 24 10 C33 10 43 18 43 34 Z" fill="#FFC24B" {...P} />
      <Path d="M10 28 q4 -9 8 -2 q4 -9 8 -2 q4 -9 8 -2 q3 -5 5 2" fill="#22B567" {...P} strokeWidth={2} />
      <Circle cx={17} cy={26} r={2.2} fill="#FF4F5E" />
      <Circle cx={29} cy={25} r={2.2} fill="#FF4F5E" />
      <Path d="M8 34 C9 22 16 14 24 14" fill="none" stroke="#E0A21E" strokeWidth={2} />
    </>
  ),
  cake: () => (
    <>
      <Path d="M8 22 H40 V40 H8Z" fill="#FFE9C7" {...P} />
      <Path d="M8 22 H40 V27 q-4 4 -8 0 q-4 4 -8 0 q-4 4 -8 0 q-4 4 -8 0Z" fill="#FF9EBB" {...P} strokeWidth={2} />
      <Rect x={8} y={32} width={32} height={3} fill="#FF7AA2" />
      <Polygon points={star(24, 13, 7, 3)} fill="#FFC94D" {...P} strokeWidth={1.8} />
    </>
  ),
  onigiri: () => (
    <>
      <Path d="M24 6 C30 6 42 28 40 35 C38 41 10 41 8 35 C6 28 18 6 24 6Z" fill="#FFFFFF" {...P} />
      <Rect x={15} y={28} width={18} height={13} rx={2} fill="#2B3B5C" {...P} />
      <Circle cx={20} cy={21} r={1.5} fill={INK} />
      <Circle cx={28} cy={21} r={1.5} fill={INK} />
      <Path d="M22 24 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <Ellipse cx={17} cy={23} rx={2} ry={1.2} fill="#FF9EBB" />
      <Ellipse cx={31} cy={23} rx={2} ry={1.2} fill="#FF9EBB" />
    </>
  ),
  meat: () => (
    <>
      <Path d="M30 12 C40 8 46 18 40 25 C36 30 28 33 21 31 C14 29 13 21 18 16 C21 13 25 14 30 12Z" fill="#C2410C" {...P} />
      <Path d="M28 16 C34 14 38 19 35 23" fill="none" stroke="#FF8A5B" strokeWidth={2.4} strokeLinecap="round" />
      <Rect x={8} y={26} width={14} height={5} rx={2.5} fill="#FFF6E5" {...P} transform="rotate(-38 15 28)" />
      <Circle cx={7} cy={35} r={3.4} fill="#FFF6E5" {...P} />
      <Circle cx={11} cy={38} r={3.4} fill="#FFF6E5" {...P} />
    </>
  ),
  /* -------------------------- Accesorios -------------------------- */
  crown: () => (
    <>
      <Polygon points="7,36 9,14 17,24 24,10 31,24 39,14 41,36" fill="#FFC94D" {...P} />
      <Rect x={7} y={34} width={34} height={6} rx={2} fill="#E0A21E" {...P} />
      <Circle cx={24} cy={29} r={2.6} fill="#FF4F81" stroke={INK} strokeWidth={1.4} />
      <Circle cx={15} cy={30} r={1.8} fill="#4FD1FF" stroke={INK} strokeWidth={1.2} />
      <Circle cx={33} cy={30} r={1.8} fill="#4FD1FF" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  beret: () => (
    <>
      <Ellipse cx={24} cy={27} rx={18} ry={9} fill="#3B4CCA" {...P} />
      <Ellipse cx={22} cy={23} rx={12} ry={5} fill="#5B6BE0" />
      <Rect x={21} y={14} width={4} height={6} rx={2} fill="#3B4CCA" {...P} />
      <Path d="M8 31 Q24 37 40 31" fill="none" stroke="#2A388F" strokeWidth={2.2} />
    </>
  ),
  cap: () => (
    <>
      <Path d="M8 28 C8 15 16 10 24 10 C32 10 40 15 40 28 Z" fill="#FF4F81" {...P} />
      <Path d="M24 28 H44 C44 33 38 35 30 34 L24 33Z" fill="#E03A66" {...P} />
      <Circle cx={24} cy={10} r={2.4} fill="#FF4F81" {...P} strokeWidth={1.6} />
      <Path d="M24 11 V28" stroke="#E03A66" strokeWidth={1.6} />
      <Shine x={15} y={17} />
    </>
  ),
  bow: () => (
    <>
      <Path d="M24 24 L8 13 C5 20 5 28 8 35 Z" fill="#FF4F81" {...P} />
      <Path d="M24 24 L40 13 C43 20 43 28 40 35 Z" fill="#FF4F81" {...P} />
      <Rect x={19} y={19} width={10} height={10} rx={3} fill="#FF7AA2" {...P} />
    </>
  ),
  glasses: () => (
    <>
      <Circle cx={14} cy={25} r={8} fill="#CFE8FF" {...P} />
      <Circle cx={34} cy={25} r={8} fill="#CFE8FF" {...P} />
      <Path d="M22 24 Q24 21 26 24 M6 23 L2 20 M42 23 L46 20" fill="none" {...P} />
      <Shine x={11} y={21} rx={2} ry={1.2} />
      <Shine x={31} y={21} rx={2} ry={1.2} />
    </>
  ),
  wizard: () => (
    <>
      <Path d="M24 4 L36 34 H12Z" fill="#5B3FD6" {...P} />
      <Ellipse cx={24} cy={35} rx={19} ry={5} fill="#7B5CFF" {...P} />
      <Polygon points={star(24, 22, 4.4, 1.8)} fill="#FFC94D" stroke={INK} strokeWidth={1.2} />
      <Circle cx={30} cy={13} r={1.4} fill="#FFE08A" />
    </>
  ),
  halo: () => (
    <>
      <Ellipse cx={24} cy={20} rx={16} ry={6} fill="none" stroke="#FFC94D" strokeWidth={5} />
      <Ellipse cx={24} cy={20} rx={16} ry={6} fill="none" stroke={INK} strokeWidth={1.4} />
      <Path d="M17 34 q7 -6 14 0" fill="none" stroke="#FFE08A" strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  flower: () => (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <Ellipse key={a} cx={24} cy={13} rx={6} ry={8.5} fill="#FFFFFF" {...P} transform={`rotate(${a} 24 24)`} />
      ))}
      <Circle cx={24} cy={24} r={6.5} fill="#FFC94D" {...P} />
    </>
  ),
  strawhat: () => (
    <>
      <Ellipse cx={24} cy={30} rx={21} ry={8} fill="#F6D27A" {...P} />
      <Path d="M12 30 C12 17 17 12 24 12 C31 12 36 17 36 30 Z" fill="#F9DE8F" {...P} />
      <Path d="M12.5 25 H35.5 V30 H12.5Z" fill="#E63946" stroke={INK} strokeWidth={1.8} />
      <Path d="M8 32 q4 1 8 0 M32 32 q4 1 8 0 M17 17 q3 -1 6 0" fill="none" stroke="#C9A04A" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  captain: () => (
    <>
      <Path d="M4 28 C10 14 20 12 24 12 C28 12 38 14 44 28 C36 24 30 30 24 30 C18 30 12 24 4 28Z" fill="#2B3B5C" {...P} />
      <Path d="M8 27 C14 22 34 22 40 27" fill="none" stroke="#FFC94D" strokeWidth={2.4} />
      <Circle cx={24} cy={20} r={4.6} fill="#FFFFFF" {...P} strokeWidth={1.8} />
      <Path d="M24 17 V23 M21.5 19 H26.5" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M30 13 q6 -6 10 -2" fill="none" stroke="#FF4F81" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  bandana: () => (
    <>
      <Path d="M7 26 C7 14 15 9 24 9 C33 9 41 14 41 26 Z" fill="#E63946" {...P} />
      <Path d="M39 24 L46 30 L40 33 L44 39 L36 33" fill="#E63946" {...P} />
      <G fill="#FFFFFF">
        <Circle cx={16} cy={18} r={1.6} />
        <Circle cx={24} cy={15} r={1.6} />
        <Circle cx={31} cy={19} r={1.6} />
        <Circle cx={20} cy={23} r={1.3} />
      </G>
    </>
  ),
  eyepatch: () => (
    <>
      <Path d="M4 16 L44 30" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Ellipse cx={26} cy={25} rx={10} ry={8} fill="#2B3B5C" {...P} transform="rotate(18 26 25)" />
      <Path d="M22 22 l3 3 m0 -3 l-3 3" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  /* ------------------------------ Ropa ------------------------------ */
  'outfit-none': () => (
    <>
      <Path d="M14 12 L8 18 L12 23 L15 21 V40 H33 V21 L36 23 L40 18 L34 12 Q29 15 24 15 Q19 15 14 12Z" fill="#EDF1F9" {...P} strokeDasharray="4 3" />
    </>
  ),
  'outfit-vest': () => (
    <>
      <Path d="M14 10 L8 17 L12 40 H22 L22 18 Q18 14 14 10Z" fill="#E63946" {...P} />
      <Path d="M34 10 L40 17 L36 40 H26 L26 18 Q30 14 34 10Z" fill="#E63946" {...P} />
      <Path d="M22 18 V40 M26 18 V40" stroke="#FFD9B8" strokeWidth={3} />
      <Circle cx={17} cy={26} r={1.4} fill="#FFC94D" />
      <Circle cx={31} cy={26} r={1.4} fill="#FFC94D" />
    </>
  ),
  'outfit-sailor': () => (
    <>
      <Path d="M14 12 L7 19 L12 24 L15 22 V41 H33 V22 L36 24 L41 19 L34 12 Q29 15 24 15 Q19 15 14 12Z" fill="#FFFFFF" {...P} />
      <G stroke="#2563EB" strokeWidth={2.6}>
        <Line x1={15} y1={26} x2={33} y2={26} />
        <Line x1={15} y1={31} x2={33} y2={31} />
        <Line x1={15} y1={36} x2={33} y2={36} />
      </G>
      <Path d="M19 14 L24 21 L29 14" fill="#2563EB" stroke={INK} strokeWidth={1.6} />
    </>
  ),
  'outfit-coat': () => (
    <>
      <Path d="M14 10 L7 18 L11 42 H37 L41 18 L34 10 L24 22Z" fill="#2B3B5C" {...P} />
      <Path d="M14 10 L24 22 L34 10" fill="none" stroke="#FFC94D" strokeWidth={2.6} />
      <G fill="#FFC94D" stroke={INK} strokeWidth={1}>
        <Circle cx={21} cy={28} r={1.6} />
        <Circle cx={27} cy={28} r={1.6} />
        <Circle cx={21} cy={34} r={1.6} />
        <Circle cx={27} cy={34} r={1.6} />
      </G>
      <Path d="M7 18 l-3 4 M41 18 l3 4" stroke="#FFC94D" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  'outfit-hoodie': () => (
    <>
      <Path d="M14 12 L7 20 L12 25 L15 23 V41 H33 V23 L36 25 L41 20 L34 12 Q34 6 24 6 Q14 6 14 12Z" fill="#22B567" {...P} />
      <Path d="M17 13 Q24 20 31 13" fill="#178A4C" {...P} strokeWidth={1.8} />
      <Rect x={18} y={30} width={12} height={7} rx={2} fill="#178A4C" stroke={INK} strokeWidth={1.6} />
      <Path d="M21 18 v5 M27 18 v5" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  'outfit-scarf': () => (
    <>
      <Path d="M8 18 C14 24 34 24 40 18 L40 25 C34 31 14 31 8 25Z" fill="#FF7A1A" {...P} />
      <Path d="M28 26 L32 42 L38 40 L34 25" fill="#FF7A1A" {...P} />
      <Path d="M14 21 V27 M20 23 V29 M26 23 V29 M32 21 V27" stroke="#FFD34D" strokeWidth={2} />
    </>
  ),
  /* --------------------------- Muebles --------------------------- */
  bed: () => (
    <>
      <Rect x={5} y={14} width={8} height={26} rx={2} fill="#B7743A" {...P} />
      <Rect x={11} y={24} width={32} height={12} rx={3} fill="#FFFFFF" {...P} />
      <Rect x={20} y={22} width={23} height={14} rx={3} fill="#4FACFE" {...P} />
      <Ellipse cx={15} cy={24} rx={5} ry={3.4} fill="#FFE9C7" {...P} />
      <Path d="M8 36 V42 M40 36 V42" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  rug: () => (
    <>
      <Ellipse cx={24} cy={28} rx={20} ry={11} fill="#FF7AA2" {...P} />
      <Ellipse cx={24} cy={28} rx={13} ry={6.5} fill="#FFC94D" stroke={INK} strokeWidth={1.6} />
      <Ellipse cx={24} cy={28} rx={6} ry={3} fill="#4FACFE" stroke={INK} strokeWidth={1.4} />
    </>
  ),
  lamp: () => (
    <>
      <Path d="M14 22 L18 6 H30 L34 22Z" fill="#FFE08A" {...P} />
      <Rect x={22.5} y={22} width={3} height={14} fill="#8F9BB3" {...P} />
      <Ellipse cx={24} cy={39} rx={9} ry={3.4} fill="#AAB6CC" {...P} />
      <Path d="M10 26 l-3 3 M38 26 l3 3 M24 25 v-0" stroke="#FFC94D" strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  plant: () => (
    <>
      <Path d="M15 30 H33 L31 42 H17Z" fill="#FF8A5B" {...P} />
      <Path d="M24 30 C24 20 14 18 10 10 C18 10 24 16 24 30 M24 30 C24 18 32 12 39 12 C36 20 27 22 24 30 M24 30 V8" fill="#22B567" {...P} strokeWidth={2.2} />
    </>
  ),
  bookshelf: () => (
    <>
      <Rect x={8} y={5} width={32} height={38} rx={2} fill="#B7743A" {...P} />
      <Path d="M8 18 H40 M8 31 H40" stroke={INK} strokeWidth={2.2} />
      <Rect x={11} y={8} width={4} height={10} fill="#FF4F81" stroke={INK} strokeWidth={1.2} />
      <Rect x={16} y={9} width={4} height={9} fill="#4FACFE" stroke={INK} strokeWidth={1.2} />
      <Rect x={21} y={7} width={4} height={11} fill="#22B567" stroke={INK} strokeWidth={1.2} />
      <Rect x={13} y={21} width={5} height={10} fill="#FFC94D" stroke={INK} strokeWidth={1.2} />
      <Rect x={19} y={22} width={4} height={9} fill="#7B5CFF" stroke={INK} strokeWidth={1.2} />
      <Circle cx={33} cy={27} r={3} fill="#4FD1FF" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  desk: () => (
    <>
      <Rect x={5} y={22} width={38} height={6} rx={2} fill="#B7743A" {...P} />
      <Path d="M9 28 V42 M39 28 V42" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <Rect x={14} y={9} width={16} height={11} rx={2} fill="#2B3B5C" {...P} />
      <Rect x={16} y={11} width={12} height={7} rx={1} fill="#7FD3FF" />
      <Rect x={33} y={15} width={5} height={7} rx={1} fill="#FF4F81" stroke={INK} strokeWidth={1.4} />
    </>
  ),
  sofa: () => (
    <>
      <Rect x={9} y={12} width={30} height={16} rx={5} fill="#7B5CFF" {...P} />
      <Rect x={4} y={22} width={40} height={14} rx={5} fill="#9F85FF" {...P} />
      <Rect x={4} y={18} width={8} height={18} rx={4} fill="#7B5CFF" {...P} />
      <Rect x={36} y={18} width={8} height={18} rx={4} fill="#7B5CFF" {...P} />
      <Path d="M10 36 V41 M38 36 V41" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
    </>
  ),
  poster: () => (
    <>
      <Rect x={9} y={6} width={30} height={36} rx={2} fill="#FFFFFF" {...P} />
      <Rect x={12} y={9} width={24} height={20} fill="#4FACFE" />
      <Polygon points="12,29 20,18 26,25 30,21 36,29" fill="#22B567" />
      <Circle cx={30} cy={14} r={3} fill="#FFE08A" />
      <Path d="M14 34 H34 M14 38 H28" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
    </>
  ),
  aquarium: () => (
    <>
      <Rect x={6} y={10} width={36} height={28} rx={3} fill="#9FE3FF" {...P} />
      <Path d="M6 16 H42" stroke="#FFFFFF" strokeWidth={2} />
      <Path d="M14 26 q5 -5 9 0 q-4 5 -9 0 M23 26 l4 -3 v6z" fill="#FF8A3D" stroke={INK} strokeWidth={1.3} />
      <Path d="M33 38 q-2 -8 2 -14 M37 38 q2 -6 -1 -11" fill="none" stroke="#22B567" strokeWidth={2.2} strokeLinecap="round" />
      <Rect x={6} y={38} width={36} height={4} rx={1} fill="#8F9BB3" {...P} />
    </>
  ),
  wheel: () => (
    <>
      <Circle cx={24} cy={24} r={13} fill="none" stroke="#B7743A" strokeWidth={5} />
      <Circle cx={24} cy={24} r={13} fill="none" stroke={INK} strokeWidth={1.4} />
      <Circle cx={24} cy={24} r={4} fill="#FFC94D" {...P} strokeWidth={1.8} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Rect key={a} x={22.5} y={2} width={3} height={9} rx={1.5} fill="#B7743A" stroke={INK} strokeWidth={1.2} transform={`rotate(${a} 24 24)`} />
      ))}
    </>
  ),
  barrel: () => (
    <>
      <Path d="M13 6 H35 C39 16 39 32 35 42 H13 C9 32 9 16 13 6Z" fill="#B7743A" {...P} />
      <Path d="M11 14 H37 M11 34 H37" stroke="#8F9BB3" strokeWidth={3.2} />
      <Path d="M20 6 C18 18 18 30 20 42 M28 6 C30 18 30 30 28 42" fill="none" stroke="#8B5A2B" strokeWidth={1.6} />
    </>
  ),
  globe: () => (
    <>
      <Circle cx={24} cy={20} r={13} fill="#4FACFE" {...P} />
      <Path d="M16 13 q5 2 4 6 q-4 2 -3 6 M28 10 q4 4 2 8 q4 2 3 6" fill="#22B567" stroke={INK} strokeWidth={1.4} />
      <Path d="M24 33 V39 M15 41 H33" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M10 20 A14 14 0 0 0 38 20" fill="none" stroke="#C9A15A" strokeWidth={2.4} />
    </>
  ),
  hammock: () => (
    <>
      <Path d="M6 8 V42 M42 8 V42" stroke="#8B5A2B" strokeWidth={3.6} strokeLinecap="round" />
      <Path d="M6 16 C14 34 34 34 42 16" fill="#FFC94D" {...P} />
      <Path d="M10 22 q14 10 28 0" fill="none" stroke="#FF4F81" strokeWidth={2} />
    </>
  ),
  flag: () => (
    <>
      <Path d="M10 6 V44" stroke="#8B5A2B" strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M11 8 H40 L34 17 L40 26 H11Z" fill="#2B3B5C" {...P} />
      <Circle cx={24} cy={16} r={4} fill="#FFFFFF" stroke={INK} strokeWidth={1.2} />
      <Path d="M19 22 l10 -2 M19 20 l10 2" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  /* ---------------------------- Casas ---------------------------- */
  tent: () => (
    <>
      <Polygon points="24,6 42,40 6,40" fill="#22B567" {...P} />
      <Polygon points="24,14 31,40 17,40" fill="#178A4C" {...P} strokeWidth={1.8} />
      <Path d="M24 6 V3 M4 40 H44" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
    </>
  ),
  cabin: () => (
    <>
      <Polygon points="5,22 24,8 43,22" fill="#C2410C" {...P} />
      <Rect x={9} y={21} width={30} height={20} fill="#B7743A" {...P} />
      <Path d="M9 27 H39 M9 33 H39" stroke="#8B5A2B" strokeWidth={1.6} />
      <Rect x={20} y={29} width={8} height={12} fill="#8B5A2B" {...P} strokeWidth={1.8} />
      <Rect x={12} y={25} width={5} height={5} fill="#FFE08A" stroke={INK} strokeWidth={1.4} />
    </>
  ),
  cottage: () => (
    <>
      <Polygon points="4,24 24,7 44,24" fill="#4FACFE" {...P} />
      <Rect x={9} y={23} width={30} height={19} fill="#FFFFFF" {...P} />
      <Rect x={20} y={30} width={8} height={12} rx={4} fill="#FF4F81" {...P} strokeWidth={1.8} />
      <Circle cx={15} cy={30} r={3} fill="#FFE08A" stroke={INK} strokeWidth={1.4} />
      <Circle cx={33} cy={30} r={3} fill="#FFE08A" stroke={INK} strokeWidth={1.4} />
      <Path d="M9 42 q3 -4 6 0 q3 -4 6 0" fill="#22B567" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  ship: () => (
    <>
      <Path d="M23 6 V30" stroke="#8B5A2B" strokeWidth={3} />
      <Path d="M24 8 C34 12 36 22 24 28Z" fill="#FFFFFF" {...P} />
      <Path d="M22 10 C14 14 13 22 22 27Z" fill="#F4F1EA" {...P} />
      <Path d="M4 30 H44 L38 41 H10Z" fill="#B7743A" {...P} />
      <Path d="M7 35 H41" stroke="#8B5A2B" strokeWidth={1.6} />
      <Path d="M23 6 L30 4 L23 2" fill="#E63946" stroke={INK} strokeWidth={1.2} />
      <Path d="M2 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#4FACFE" strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
  castle: () => (
    <>
      <Path d="M6 42 V16 H12 V20 H16 V16 H22 V42Z" fill="#E2E8F4" {...P} />
      <Path d="M26 42 V16 H32 V20 H36 V16 H42 V42Z" fill="#E2E8F4" {...P} />
      <Rect x={16} y={24} width={16} height={18} fill="#F3F6FC" {...P} />
      <Path d="M20 42 V34 a4 4 0 0 1 8 0 V42" fill="#7B5CFF" {...P} strokeWidth={1.8} />
      <Path d="M14 16 V6 L20 9 L14 12" fill="#FF4F81" stroke={INK} strokeWidth={1.4} />
      <Ellipse cx={8} cy={44} rx={8} ry={3} fill="#FFFFFF" opacity={0.9} />
      <Ellipse cx={40} cy={44} rx={8} ry={3} fill="#FFFFFF" opacity={0.9} />
    </>
  ),
  /* --------------------------- Siluetas --------------------------- */
  'scale-normal': () => figure(1, 1),
  'scale-chibi': () => figure(1.25, 0.8),
  'scale-chubby': () => figure(1.3, 1),
  'scale-tall': () => figure(0.85, 1.25),
};

function medal(face: string, rim: string) {
  return (
    <>
      <Path d="M14 4 L20 18 M34 4 L28 18" stroke="#4FACFE" strokeWidth={5} strokeLinecap="round" />
      <Path d="M14 4 L20 18 M34 4 L28 18" stroke={INK} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
      <Circle cx={24} cy={29} r={14} fill={rim} {...P} />
      <Circle cx={24} cy={29} r={9.5} fill={face} stroke={INK} strokeWidth={1.6} />
      <Polygon points={star(24, 29, 5.5, 2.4)} fill="#FFFFFF" opacity={0.85} />
    </>
  );
}

function figure(w: number, h: number) {
  const headR = 8.5 * Math.min(1.2, w);
  const bodyW = 11 * w;
  const bodyH = 11 * h;
  const top = 44 - bodyH - headR * 2 - 3;
  return (
    <>
      <Ellipse cx={24} cy={44 - bodyH / 2 - 2} rx={bodyW} ry={bodyH / 2 + 1} fill="#FFB7CE" {...P} />
      <Circle cx={24} cy={top + headR} r={headR} fill="#FFD9B8" {...P} />
      <Circle cx={21} cy={top + headR} r={1.2} fill={INK} />
      <Circle cx={27} cy={top + headR} r={1.2} fill={INK} />
      <Path d={`M21.5 ${top + headR + 3} q2.5 2 5 0`} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Caras con nombre                                                    */
/* ------------------------------------------------------------------ */

const FACES: Record<string, FaceSpec> = {
  'face-happy': { eyes: 'happy', mouth: 'grin', extra: 'sparkles' },
  'face-ok': { eyes: 'dot', mouth: 'smile' },
  'face-hungry': { eyes: 'dot', mouth: 'open', extra: 'drool' },
  'face-sleepy': { eyes: 'closed', mouth: 'o', extra: 'zzz', cheeks: 'peach' },
  'face-sad': { eyes: 'dot', brow: 'worried', mouth: 'frown', extra: 'sweat' },
  'face-angry': { eyes: 'angry', mouth: 'frown', extra: 'anger', skin: '#FFC2A8' },
  'face-rage': { eyes: 'angry', mouth: 'fangs', extra: 'steam', skin: '#FF8A80' },
  'face-love': { eyes: 'heart', mouth: 'smile', extra: 'hearts' },
  'face-eating': { eyes: 'happy', mouth: 'chew', cheeks: 'peach' },
  'face-celebrate': { eyes: 'star', mouth: 'grin', extra: 'confetti' },
  'species-puff': { skin: '#FFB7CE', eyes: 'big' },
  'species-meeseeks': { skin: '#7FD3FF', ears: 'slim', eyes: 'dot', mouth: 'grin' },
  'species-cat': { skin: '#FFD59A', ears: 'cat', mouth: 'cat', cheeks: 'whiskers' },
  'species-dragon': { skin: '#9EE6C4', ears: 'dragon', mouth: 'fangs' },
  'species-bear': { skin: '#C9A07A', ears: 'bear' },
  'species-bunny': { skin: '#E6DCFF', ears: 'bunny' },
  'species-fox': { skin: '#FF8A3D', ears: 'fox', mouth: 'smirk', cheeks: 'none' },
  'species-shark': { skin: '#7FA8F5', ears: 'shark', mouth: 'fangs', cheeks: 'none' },
};

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export type GlyphName = string;

function render(name: string): React.ReactElement | null {
  if (OBJECTS[name]) return OBJECTS[name]!();
  if (FACES[name]) return <FaceGlyph {...FACES[name]!} />;
  if (name.startsWith('brow-')) return <FaceGlyph brow={name.slice(5) as Brow} cheeks="none" mouth="flat" />;
  if (name.startsWith('mouth-')) return <FaceGlyph mouth={name.slice(6) as Mouth} cheeks="none" />;
  if (name.startsWith('blush-')) return <FaceGlyph cheeks={name.slice(6) as Cheeks} mouth="smile" />;
  if (name.startsWith('eyes-')) {
    const map: Record<string, Eyes> = {
      round: 'dot', sparkle: 'big', happy: 'happy', wink: 'wink', fierce: 'angry', anime: 'big',
      sleepy: 'closed', heart: 'heart', cool: 'cool', starry: 'star',
    };
    return <FaceGlyph eyes={map[name.slice(5)] ?? 'dot'} cheeks="none" />;
  }
  return null;
}

/**
 * Ícono propio. `tile` dibuja una baldosa redondeada detrás (estilo sticker).
 */
export function Glyph({
  name,
  size = 28,
  tile,
  style,
}: {
  name: GlyphName;
  size?: number;
  tile?: string | boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const content = render(name) ?? OBJECTS.sparkle!();
  const svg = (
    <Svg width={tile ? size * 0.78 : size} height={tile ? size * 0.78 : size} viewBox="0 0 48 48">
      {content}
    </Svg>
  );
  if (!tile) return <View style={style}>{svg}</View>;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: typeof tile === 'string' ? tile : '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'rgba(30,36,54,0.08)',
          borderBottomWidth: 4,
          borderBottomColor: 'rgba(30,36,54,0.14)',
        },
        style,
      ]}
    >
      {svg}
    </View>
  );
}

export const GLYPH_NAMES = Object.keys(OBJECTS).concat(Object.keys(FACES));
