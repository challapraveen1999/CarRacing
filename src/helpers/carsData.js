export const CARS = [
  {
    id: 'car_01',
    name: 'Apex Turbo',
    tagline: 'Balanced street runner',
    price: 0,
    isUnlocked: true,
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
    icon: '🏎️',
  },
  {
    id: 'car_02',
    name: 'Neon Viper',
    tagline: 'High-speed electric beast',
    price: 500,
    isUnlocked: false,
    stats: {
      speed: 82,
      acceleration: 85,
      handling: 70,
      nitro: 75,
    },
    colors: {
      body: '#00E5FF',
      roof: '#0B1C28',
      stripes: '#FEE440',
      glow: 'rgba(0, 229, 255, 0.5)',
    },
    icon: '⚡',
  },
  {
    id: 'car_03',
    name: 'Phantom Shadow',
    tagline: 'Ultra agile drift machine',
    price: 1200,
    isUnlocked: false,
    stats: {
      speed: 88,
      acceleration: 80,
      handling: 95,
      nitro: 80,
    },
    colors: {
      body: '#7928CA',
      roof: '#120521',
      stripes: '#FF0080',
      glow: 'rgba(121, 40, 202, 0.5)',
    },
    icon: '🔮',
  },
  {
    id: 'car_04',
    name: 'Thunder GT',
    tagline: 'Raw horsepower muscle',
    price: 2500,
    isUnlocked: false,
    stats: {
      speed: 92,
      acceleration: 90,
      handling: 65,
      nitro: 90,
    },
    colors: {
      body: '#FF9100',
      roof: '#261600',
      stripes: '#FFFFFF',
      glow: 'rgba(255, 145, 0, 0.5)',
    },
    icon: '🔥',
  },
  {
    id: 'car_05',
    name: 'Cyber Valkyrie',
    tagline: 'Ultimate hypercar prototype',
    price: 5000,
    isUnlocked: false,
    stats: {
      speed: 100,
      acceleration: 98,
      handling: 95,
      nitro: 100,
    },
    colors: {
      body: '#00E676',
      roof: '#042211',
      stripes: '#00F0FF',
      glow: 'rgba(0, 230, 118, 0.5)',
    },
    icon: '👑',
  },
];

export const getCarById = carId => {
  return CARS.find(car => car.id === carId) || CARS[0];
};

