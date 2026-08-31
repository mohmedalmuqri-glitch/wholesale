import type { Category, Product } from './types';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-biscuits', name: 'عالم البسكويت', color: '#059669', createdAt: Date.now() - 5000 },
  { id: 'cat-drinks', name: 'المشروبات والعصائر', color: '#0d9488', createdAt: Date.now() - 4000 },
  { id: 'cat-grains', name: 'الحبوب والأرز', color: '#0891b2', createdAt: Date.now() - 3000 },
  { id: 'cat-oils', name: 'الزيوت والسمن', color: '#65a30d', createdAt: Date.now() - 2000 },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'بسكويت بالشوكولاتة - كرتون',
    categoryId: 'cat-biscuits',
    price: 48,
    image: '',
    description: 'كرتون 24 قطعة بسكويت محشو بالشوكولاتة',
    createdAt: Date.now() - 1500,
    halfCartonEnabled: true,
    halfCartonPrice: 26,
    halfCartonUnits: 12,
    fullCartonUnits: 24,
  },
  {
    id: 'prod-2',
    name: 'بسكويت سادة - 36 وحدة',
    categoryId: 'cat-biscuits',
    price: 36,
    image: '',
    description: 'كرتون 36 وحدة بسكويت سادة كلاسيكي',
    createdAt: Date.now() - 1400,
    halfCartonEnabled: false,
    fullCartonUnits: 36,
  },
  {
    id: 'prod-3',
    name: 'عصير برتقال - 24 علبة',
    categoryId: 'cat-drinks',
    price: 72,
    image: '',
    description: 'كرتون 24 علبة عصير برتقال طبيعي',
    createdAt: Date.now() - 1300,
    halfCartonEnabled: true,
    halfCartonPrice: 40,
    halfCartonUnits: 12,
    fullCartonUnits: 24,
  },
  {
    id: 'prod-4',
    name: 'أرز مصري - كيس 25 كجم',
    categoryId: 'cat-grains',
    price: 115,
    image: '',
    description: 'كيس أرز مصري فاخر وزن 25 كجم',
    createdAt: Date.now() - 1200,
    halfCartonEnabled: false,
  },
];
