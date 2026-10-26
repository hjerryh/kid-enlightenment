import { chineseAnimalCopy } from './animals.ts';
import { chineseNumberCopy } from './numbers.ts';
import { categories, concepts } from './curriculum.ts';
import type { Category, CategoryId, Concept } from './curriculum.ts';
import type { Language } from '../lib/language.ts';

type ConceptCopy = Pick<Concept, 'word' | 'description' | 'fact'>;

const conceptsById = new Map(concepts.map((concept) => [concept.id, concept]));
const categoriesById = new Map(categories.map((category) => [category.id, category]));

const chineseConcepts: Record<string, ConceptCopy> = {
  apple: {
    word: '苹果',
    description: '它是一种圆圆的红色水果。',
    fact: '这种水果圆圆的，吃起来脆脆的，果核里有小小的种子。',
  },
  banana: {
    word: '香蕉',
    description: '它是一种长长的、弯弯的黄色水果。',
    fact: '剥开它长长的黄色果皮，就能看到软软的果肉。',
  },
  orange: {
    word: '橙子',
    description: '它是一种圆圆的水果，果皮是橙色的。',
    fact: '剥开橙色的果皮，里面的果肉可以分成一瓣一瓣，汁水很多。',
  },
  strawberry: {
    word: '草莓',
    description: '它是一种红色水果，表面有许多小点点。',
    fact: '这种红色水果顶上有绿色小叶子，表面有像种子一样的小点点。',
  },
  grapes: {
    word: '葡萄',
    description: '这些紫色的小水果一颗颗连在一起，长成一串。',
    fact: '这些小小的圆水果成串地长在藤上。',
  },
  pear: {
    word: '梨',
    description: '它是一种绿色水果，上面窄，下面宽。',
    fact: '这种水果的下半部分比较宽，靠近果柄的地方比较窄。',
  },
  ...chineseAnimalCopy,
  red: {
    word: '红色',
    description: '这是成熟草莓的颜色。',
    fact: '交通信号灯亮起这种颜色时，车辆要停下来。',
  },
  'orange-color': {
    word: '橙色',
    description: '这是胡萝卜的颜色。',
    fact: '把红色和黄色颜料混在一起，就能调出这种颜色。',
  },
  yellow: {
    word: '黄色',
    description: '这是成熟香蕉果皮的颜色。',
    fact: '柠檬皮和成熟的香蕉皮，都有这种明亮的颜色。',
  },
  green: {
    word: '绿色',
    description: '这是新鲜小草的颜色。',
    fact: '把蓝色和黄色颜料混在一起，就能调出这种颜色。',
  },
  blue: {
    word: '蓝色',
    description: '这是晴朗白天天空的颜色。',
    fact: '把这种颜色的颜料和黄色颜料混在一起，就能调出绿色。',
  },
  purple: {
    word: '紫色',
    description: '这是我们图片里葡萄的颜色。',
    fact: '把红色和蓝色颜料混在一起，就能调出这种颜色。',
  },
  ...chineseNumberCopy,
  circle: {
    word: '圆形',
    description: '它圆圆的，没有角。',
    fact: '这个圆圆的图形没有直边，也没有角。',
  },
  square: {
    word: '正方形',
    description: '它有四条一样长的直边，还有四个角。',
    fact: '它的四条边一样长，四个角都是直角。',
  },
  triangle: {
    word: '三角形',
    description: '它有三条直边，还有三个角。',
    fact: '数一数这个图形的直边，刚好有三条。',
  },
  rectangle: {
    word: '长方形',
    description: '图中这个图形有两条长边和两条短边。',
    fact: '图中这个图形的四个角都是直角，有两条长边和两条短边。',
  },
  star: {
    word: '星形',
    description: '这个图形有五个向外伸出的尖角。',
    fact: '它的边一会儿向外、一会儿向里，形成五个向外的尖角。',
  },
  heart: {
    word: '心形',
    description: '它的上面有两个圆圆的鼓包，下面有一个尖角。',
    fact: '它的上半部分像两个圆圆的小山丘，下面合成一个尖角。',
  },
  sun: {
    word: '太阳',
    description: '它是一颗明亮的恒星，给我们带来白天的光。',
    fact: '这颗恒星给地球带来光和温暖，帮助植物生长。',
  },
  moon: {
    word: '月亮',
    description: '图中它弯弯的，像一把小镰刀。',
    fact: '它绕着地球转，我们看到的月光是它反射的太阳光。',
  },
  tree: {
    word: '树',
    description: '它有高高的树干，树枝上长着叶子。',
    fact: '它的木质树干支撑着树枝，地下的根能吸收水分。',
  },
  flower: {
    word: '花',
    description: '它有彩色的花瓣，下面有细细的茎。',
    fact: '它的花瓣能帮助吸引蜜蜂和蝴蝶。',
  },
  house: {
    word: '房子',
    description: '它是一种可以让人住在里面的建筑。',
    fact: '这种建筑有屋顶、墙壁和房间，可以让人住在里面。',
  },
  car: {
    word: '汽车',
    description: '它有四个车轮，可以载着人出行。',
    fact: '它靠四个车轮在道路上行驶，能把人送到不同的地方。',
  },
};

const chineseCategories: Record<CategoryId, Pick<Category, 'name' | 'subtitle'>> = {
  fruits: { name: '水果', subtitle: '小小果篮，装满新发现' },
  animals: { name: '动物', subtitle: '认识可爱的动物朋友' },
  colors: { name: '颜色', subtitle: '发现五彩缤纷的世界' },
  numbers: { name: '数字', subtitle: '认识缤纷的数字世界' },
  shapes: { name: '形状', subtitle: '找找身边的各种形状' },
  everyday: { name: '身边的世界', subtitle: '每个角落都有新发现' },
};

/** Keep stable IDs and illustrations so language changes preserve learning progress. */
export function localizeConcept(concept: Concept, language: Language): Concept {
  const canonical = conceptsById.get(concept.id) ?? concept;
  if (language === 'en') return canonical;
  return { ...canonical, ...chineseConcepts[canonical.id] };
}

export function localizeCategory(category: Category, language: Language): Category {
  const canonical = categoriesById.get(category.id) ?? category;
  if (language === 'en') return canonical;
  return { ...canonical, ...chineseCategories[canonical.id] };
}
