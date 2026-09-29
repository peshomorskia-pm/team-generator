import { Dices, Home, Trophy, Users, Swords } from 'lucide-react';
import { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { href: '/', name: 'Начало', icon: Home, end: true },
  { href: '/generator', name: 'Генератор', icon: Dices, end: false },
  { href: '/players', name: 'Играчи', icon: Users, end: false },
  { href: '/matches', name: 'Мачове', icon: Swords, end: false },
  { href: '/rankings', name: 'Класиране', icon: Trophy, end: false },
];
