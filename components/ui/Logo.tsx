import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

const iconSizes = {
  sm: 40,
  md: 64,
  lg: 88,
};

const textSizes = {
  sm: 'text-lg font-bold',
  md: 'text-2xl font-bold',
  lg: 'text-3xl font-bold',
};

const TERRACOTTA = '#C1694F';
const WHITE = '#FFFFFF';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
}

/**
 * Marca do ControleObra: casa branca sobre fundo terracotta arredondado.
 * Renderizada como SVG vetorial (nítida em qualquer tamanho). A fonte única
 * da marca é assets/logo.svg — mantenha os dois em sincronia ao alterar o design.
 */
function LogoMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect width={512} height={512} rx={116} fill={TERRACOTTA} />
      <Polygon points="256,124 424,274 88,274" fill={WHITE} />
      <Rect x={140} y={256} width={232} height={150} rx={18} fill={WHITE} />
      <Rect x={230} y={318} width={52} height={88} rx={12} fill={TERRACOTTA} />
    </Svg>
  );
}

export function Logo({ size = 'md', showText = true, subtitle }: LogoProps) {
  const iconSize = iconSizes[size];

  return (
    <View className="items-center">
      <LogoMark size={iconSize} />
      {showText && (
        <Text
          className={`${textSizes[size]} text-sand-900 dark:text-sand-50 mt-3`}
        >
          ControleObra
        </Text>
      )}
      {subtitle && (
        <Text className="text-sand-500 dark:text-sand-400 text-base mt-1 text-center">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
