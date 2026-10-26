import { animalConcepts } from './animals.ts';
import { numberConcepts } from './numbers.ts';

export type AgeBand = '3-4' | '5-6' | '7-8';

export type CategoryId = 'fruits' | 'animals' | 'colors' | 'numbers' | 'shapes' | 'everyday';

export type Concept = {
  id: string;
  word: string;
  category: CategoryId;
  description: string;
  fact: string;
  difficulty: 1 | 2 | 3;
  art: string;
  numberValue?: number;
};

export type Category = {
  id: CategoryId;
  name: string;
  subtitle: string;
  color: string;
  wash: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: 'fruits',
    name: 'Fruits',
    subtitle: 'A little basket of discoveries',
    color: '#D5714F',
    wash: '#FDEADF',
    icon: '/art/apple.svg',
  },
  {
    id: 'animals',
    name: 'Animals',
    subtitle: 'Meet some wonderful friends',
    color: '#AD8140',
    wash: '#FBF0D6',
    icon: '/art/lion.svg',
  },
  {
    id: 'colors',
    name: 'Colors',
    subtitle: 'A world full of color',
    color: '#9774B1',
    wash: '#F0E8F8',
    icon: '/art/purple.svg',
  },
  {
    id: 'numbers',
    name: 'Numbers',
    subtitle: 'A colorful world of numbers',
    color: '#628CB9',
    wash: '#E4EFFA',
    icon: '/art/numbers/three.webp',
  },
  {
    id: 'shapes',
    name: 'Shapes',
    subtitle: 'Spot the shapes around you',
    color: '#C47992',
    wash: '#F9E7ED',
    icon: '/art/star.svg',
  },
  {
    id: 'everyday',
    name: 'Our world',
    subtitle: 'There is wonder everywhere',
    color: '#698F67',
    wash: '#E8F1DF',
    icon: '/art/tree.svg',
  },
];

export const concepts: Concept[] = [
  {
    id: 'apple',
    word: 'Apple',
    category: 'fruits',
    description: 'It is a round red fruit.',
    fact: 'This round, crunchy fruit has small seeds in a core.',
    difficulty: 1,
    art: '/art/apple.svg',
  },
  {
    id: 'banana',
    word: 'Banana',
    category: 'fruits',
    description: 'It is a long, curved yellow fruit.',
    fact: 'Peel its long yellow skin to find soft fruit inside.',
    difficulty: 1,
    art: '/art/banana.svg',
  },
  {
    id: 'orange',
    word: 'Orange',
    category: 'fruits',
    description: 'It is a round fruit with an orange peel.',
    fact: 'Under its orange peel, this fruit separates into juicy sections.',
    difficulty: 1,
    art: '/art/orange.svg',
  },
  {
    id: 'strawberry',
    word: 'Strawberry',
    category: 'fruits',
    description: 'It is a red fruit with tiny dots on the outside.',
    fact: 'This red fruit has a leafy top and tiny seed-like dots on its skin.',
    difficulty: 2,
    art: '/art/strawberry.svg',
  },
  {
    id: 'grapes',
    word: 'Grapes',
    category: 'fruits',
    description: 'These small purple fruits grow in a bunch.',
    fact: 'These small, round fruits grow together on a vine.',
    difficulty: 2,
    art: '/art/grapes.svg',
  },
  {
    id: 'pear',
    word: 'Pear',
    category: 'fruits',
    description: 'It is a green fruit with a narrow top and a wide bottom.',
    fact: 'This fruit is wider at the bottom and narrower near its stem.',
    difficulty: 2,
    art: '/art/pear.svg',
  },
  ...animalConcepts,
  {
    id: 'red',
    word: 'Red',
    category: 'colors',
    description: 'It is the color of a ripe strawberry.',
    fact: 'This is the color of the traffic light that tells cars to stop.',
    difficulty: 1,
    art: '/art/red.svg',
  },
  {
    id: 'orange-color',
    word: 'Orange',
    category: 'colors',
    description: 'It is the color of a carrot.',
    fact: 'Mix red and yellow paint to make this color.',
    difficulty: 2,
    art: '/art/orange-color.svg',
  },
  {
    id: 'yellow',
    word: 'Yellow',
    category: 'colors',
    description: 'It is the color of a ripe banana peel.',
    fact: 'This bright color is on a lemon peel and a ripe banana peel.',
    difficulty: 1,
    art: '/art/yellow.svg',
  },
  {
    id: 'green',
    word: 'Green',
    category: 'colors',
    description: 'It is the color of fresh grass.',
    fact: 'Mix blue and yellow paint to make this color.',
    difficulty: 1,
    art: '/art/green.svg',
  },
  {
    id: 'blue',
    word: 'Blue',
    category: 'colors',
    description: 'It is the color of a clear daytime sky.',
    fact: 'Mix this color with yellow paint to make green.',
    difficulty: 1,
    art: '/art/blue.svg',
  },
  {
    id: 'purple',
    word: 'Purple',
    category: 'colors',
    description: 'It is the color of the grapes in our pictures.',
    fact: 'Mix red and blue paint to make this color.',
    difficulty: 2,
    art: '/art/purple.svg',
  },
  ...numberConcepts,
  {
    id: 'circle',
    word: 'Circle',
    category: 'shapes',
    description: 'It is round, with no corners.',
    fact: 'This round shape has no straight sides and no corners.',
    difficulty: 1,
    art: '/art/circle.svg',
  },
  {
    id: 'square',
    word: 'Square',
    category: 'shapes',
    description: 'It has four equal straight sides and four corners.',
    fact: 'It has four equal sides, and every corner is a right angle.',
    difficulty: 1,
    art: '/art/square.svg',
  },
  {
    id: 'triangle',
    word: 'Triangle',
    category: 'shapes',
    description: 'It has three straight sides and three corners.',
    fact: 'Count its straight sides: there are exactly three.',
    difficulty: 1,
    art: '/art/triangle.svg',
  },
  {
    id: 'rectangle',
    word: 'Rectangle',
    category: 'shapes',
    description: 'This shape has two long sides and two short sides.',
    fact: 'Its four corners are right angles, and it has two long sides and two short sides.',
    difficulty: 2,
    art: '/art/rectangle.svg',
  },
  {
    id: 'star',
    word: 'Star',
    category: 'shapes',
    description: 'This shape has five points.',
    fact: 'Its outline goes in and out to make five outer points.',
    difficulty: 2,
    art: '/art/star.svg',
  },
  {
    id: 'heart',
    word: 'Heart',
    category: 'shapes',
    description: 'It has two rounded bumps and a point at the bottom.',
    fact: 'Its two rounded top parts meet above a single bottom point.',
    difficulty: 2,
    art: '/art/heart.svg',
  },
  {
    id: 'sun',
    word: 'Sun',
    category: 'everyday',
    description: 'It is the bright star that gives us daylight.',
    fact: 'This star gives Earth light and warmth that help plants grow.',
    difficulty: 1,
    art: '/art/sun.svg',
  },
  {
    id: 'moon',
    word: 'Moon',
    category: 'everyday',
    description: 'It looks like a crescent in this picture.',
    fact: 'It travels around Earth and reflects light from the Sun.',
    difficulty: 1,
    art: '/art/moon.svg',
  },
  {
    id: 'tree',
    word: 'Tree',
    category: 'everyday',
    description: 'It has a tall trunk and leafy branches.',
    fact: 'Its woody trunk supports branches, and its roots take in water.',
    difficulty: 1,
    art: '/art/tree.svg',
  },
  {
    id: 'flower',
    word: 'Flower',
    category: 'everyday',
    description: 'It has colorful petals and a stem.',
    fact: 'Its petals can help attract bees and butterflies.',
    difficulty: 1,
    art: '/art/flower.svg',
  },
  {
    id: 'house',
    word: 'House',
    category: 'everyday',
    description: 'It is a building where people can live.',
    fact: 'This building has a roof, walls, and rooms for people to live in.',
    difficulty: 2,
    art: '/art/house.svg',
  },
  {
    id: 'car',
    word: 'Car',
    category: 'everyday',
    description: 'It has four wheels and carries people.',
    fact: 'It carries people along roads on four wheels.',
    difficulty: 2,
    art: '/art/car.svg',
  },
];
