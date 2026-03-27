import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  color: string;
}

const SLIDES: OnboardingItem[] = [
  {
    id: '1',
    icon: 'home',
    title: 'Organize sua Obra',
    description:
      'Gerencie todos os itens da sua reforma organizados por cômodo. De pisos a eletrodomésticos, tudo em um só lugar.',
    color: '#C1694F',
  },
  {
    id: '2',
    icon: 'users',
    title: 'Planeje em Casal',
    description:
      'Compartilhe o projeto com seu parceiro(a). Atualizações em tempo real para vocês decidirem juntos.',
    color: '#5B7553',
  },
  {
    id: '3',
    icon: 'dollar-sign',
    title: 'Controle Financeiro',
    description:
      'Acompanhe orçamentos, compare preços e registre pagamentos. Exporte relatórios em PDF a qualquer momento.',
    color: '#3B82F6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  }

  function handleSkip() {
    router.replace('/(auth)/login');
  }

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-10">
      <View
        className="w-28 h-28 rounded-3xl items-center justify-center mb-8"
        style={{ backgroundColor: item.color + '20' }}
      >
        <Feather name={item.icon} size={56} color={item.color} />
      </View>
      <Text className="text-sand-900 text-2xl font-bold text-center mb-4">
        {item.title}
      </Text>
      <Text className="text-sand-500 text-base text-center leading-6">
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-cream">
      <View className="flex-row justify-end px-6 pt-14">
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-sand-500 text-base font-medium">Pular</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        className="flex-1"
      />

      <View className="px-8 pb-12">
        <View className="flex-row justify-center mb-8">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full mx-1 ${
                index === currentIndex ? 'w-8 bg-terracotta-500' : 'w-2 bg-sand-300'
              }`}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          className="bg-terracotta-500 py-4 rounded-xl items-center"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-base">
            {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
