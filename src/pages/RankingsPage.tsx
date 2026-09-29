import React from 'react';
import { Trophy, Dices } from 'lucide-react';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';

export const RankingsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Класиране"
      description="Таблица на лидерите, статистика и индивидуални постижения"
      icon={Trophy}
      cardTitle="Класирането очаква своите първи шампиони"
      cardDescription="Скоро тук ще намерите пълна класация на играчите според спечелените мачове, голове, точки и обективен коефициент на ефективност."
      ctaText="Премини към Генератора"
      ctaTo="/generator"
      ctaIcon={Dices}
    />
  );
};
