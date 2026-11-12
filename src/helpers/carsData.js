export const CARS = [
  {
    id: 'car_01',
    name: 'Apex Turbo',
    tagline: 'Balanced street runner',
    price: 0,
    isUnlocked: true,
    image: require('../assets/red-car.png'),
    stats: {
      speed: 70,
      acceleration: 65,
      handling: 75,
      nitro: 60,
    },
    colors: {
      body: '#FF3B30',
      roof: '#1A1D24',
      stripes: '#FFFFFF',
      glow: 'rgba(255, 59, 48, 0.5)',
    },
    themeColor: '#FF2A54',
    icon: '🏎️',
  },
  {
    id: 'car_02',
    name: 'Neon Viper',
    tagline: 'High-speed electric beast',
    price: 500,
    isUnlocked: false,
    image: require('../assets/blue-car.png'),
    stats: {
      speed: 82,
      acceleration: 85,
      handling: 70,
      nitro: 75,
    },
    colors: {
      body: '#00A8FF',
      roof: '#0B1C28',
      stripes: '#FEE440',
      glow: 'rgba(0, 168, 255, 0.5)',
    },
    themeColor: '#00A8FF',
    icon: '⚡',
  },
  {
    id: 'car_03',
    name: 'Phantom Shadow',
    tagline: 'Ultra agile drift machine',
    price: 1200,
    isUnlocked: false,
    image: require('../assets/white-car.png'),
    stats: {
      speed: 88,
      acceleration: 80,
      handling: 95,
      nitro: 80,
    },
    colors: {
      body: '#FFFFFF',
      roof: '#120521',
      stripes: '#FF0080',
      glow: 'rgba(255, 0, 128, 0.5)',
    },
    themeColor: '#FF0080',
    icon: '🔮',
  },
  {
    id: 'car_04',
    name: 'Thunder GT',
    tagline: 'Raw horsepower muscle',
    price: 2500,
    isUnlocked: false,
    image: require('../assets/yellow-car.png'),
    stats: {
      speed: 92,
      acceleration: 90,
      handling: 65,
      nitro: 90,
    },
    colors: {
      body: '#FFD600',
      roof: '#261600',
      stripes: '#FFFFFF',
      glow: 'rgba(255, 214, 0, 0.5)',
    },
    themeColor: '#FFD600',
    icon: '🔥',
  },
  {
    id: 'car_05',
    name: 'Cyber Valkyrie',
    tagline: 'Crimson carbon hypercar',
    price: 5000,
    isUnlocked: false,
    image: require('../assets/blackred-car.png'),
    stats: {
      speed: 98,
      acceleration: 96,
      handling: 92,
      nitro: 98,
    },
    colors: {
      body: '#E50914',
      roof: '#0A0A0A',
      stripes: '#000000',
      glow: 'rgba(229, 9, 20, 0.5)',
    },
    themeColor: '#FF1744',
    icon: '👑',
  },
  {
    id: 'car_06',
    name: 'Shadow Phantom',
    tagline: 'Stealth black night racer',
    price: 8000,
    isUnlocked: false,
    image: require('../assets/Black-car.png'),
    stats: {
      speed: 100,
      acceleration: 100,
      handling: 98,
      nitro: 100,
    },
    colors: {
      body: '#1C1E24',
      roof: '#0D0E11',
      stripes: '#7C4DFF',
      glow: 'rgba(124, 77, 255, 0.5)',
    },
    themeColor: '#7C4DFF',
    icon: '🖤',
  },
];

export const getCarById = carId => {
  return CARS.find(car => car.id === carId) || CARS[0];
};

export const getCarThemeColor = carOrId => {
  const car = typeof carOrId === 'string' ? getCarById(carOrId) : carOrId;
  if (!car) return '#FF2A54';
  if (car.themeColor) return car.themeColor;
  if (car.colors?.body && car.colors.body !== '#FFFFFF' && car.colors.body !== '#1C1E24') {
    return car.colors.body;
  }
  return car.colors?.stripes || '#FF2A54';
};


