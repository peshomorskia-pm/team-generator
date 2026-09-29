import React from 'react';
import { Swords, Dices } from 'lucide-react';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';

export const MatchesPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Мачове"
      description="Следене на срещи, резултати и история на двубоите"
      icon={Swords}
      cardTitle="Модулът за мачове очаква старт"
      cardDescription="Скоро тук ще можете да организирате мачове между генерираните отбори, да записвате резултати и да преглеждате архив на изиграните двубои."
      ctaText="Генерирай отбори за мач"
      ctaTo="/generator"
      ctaIcon={Dices}
    />
  );
};
