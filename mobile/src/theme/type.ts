/**
 * Archivo, one family, weights 400 to 900 (docs/design-system.md, "Type").
 * In React Native each weight is its own font family, so pick it with font(weight)
 * instead of fontWeight.
 */
import { Archivo_400Regular } from '@expo-google-fonts/archivo/400Regular';
import { Archivo_500Medium } from '@expo-google-fonts/archivo/500Medium';
import { Archivo_600SemiBold } from '@expo-google-fonts/archivo/600SemiBold';
import { Archivo_700Bold } from '@expo-google-fonts/archivo/700Bold';
import { Archivo_800ExtraBold } from '@expo-google-fonts/archivo/800ExtraBold';
import { Archivo_900Black } from '@expo-google-fonts/archivo/900Black';

export const fontAssets = {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
};

export type Weight = 400 | 500 | 600 | 700 | 800 | 900;

const family: Record<Weight, keyof typeof fontAssets> = {
  400: 'Archivo_400Regular',
  500: 'Archivo_500Medium',
  600: 'Archivo_600SemiBold',
  700: 'Archivo_700Bold',
  800: 'Archivo_800ExtraBold',
  900: 'Archivo_900Black',
};

export const font = (weight: Weight) => ({ fontFamily: family[weight] });

/** Letter-spacing in RN is in points, not em: em × font size. */
export const tracking = (em: number, size: number) => ({ letterSpacing: em * size });
