import React from 'react';
import { Users, Dices } from 'lucide-react';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';

export const PlayersPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Играчи"
      description="Управление на постоянни профили и списъци с участници"
      icon={Users}
      cardTitle="Управлението на играчи очаква старт"
      cardDescription="Скоро тук ще можете да запазвате регулярни списъци с играчи, да редактирате техните индивидуални умения и да следите участията им."
      ctaText="Премини към Генератора"
      ctaTo="/generator"
      ctaIcon={Dices}
    />
  );
};
