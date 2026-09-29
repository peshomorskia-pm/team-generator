import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  cardTitle: string;
  cardDescription: string;
  ctaText: string;
  ctaTo: string;
  ctaIcon: LucideIcon;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: MainIcon,
  cardTitle,
  cardDescription,
  ctaText,
  ctaTo,
  ctaIcon: CtaIcon,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <MainIcon className="w-8 h-8" />
        </div>

        <div className="mb-4 flex justify-center">
          <Badge variant="amber" icon={Clock}>
            В процес на разработка
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {cardTitle}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
          {cardDescription}
        </p>

        <Link
          to={ctaTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
        >
          <CtaIcon className="w-4 h-4" />
          <span>{ctaText}</span>
        </Link>
      </div>
    </div>
  );
};

PlaceholderPage.displayName = 'PlaceholderPage';
