import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../helpers/colorCodes.json';

const CarSprite = ({
  width = 52,
  height = 96,
  bodyColor = colors.primary,
  stripeColor = '#FFFFFF',
  roofColor = '#161B22',
  isBraking = false,
  isNitro = false,
  isDamaged = false,
  isSmashed = false,
  vehicleType = 'sports',
}) => {
  const isTruck = vehicleType === 'truck';

  return (
    <View style={[styles.container, { width, height }]}>
      {/* 4 Rubber Tires with Rim Highlights */}
      {/* Front Left Tire */}
      <View style={[styles.tire, styles.frontLeftTire, isSmashed && styles.smashedTireLeft]}>
        <View style={styles.wheelRim} />
      </View>

      {/* Front Right Tire */}
      <View style={[styles.tire, styles.frontRightTire, isSmashed && styles.smashedTireRight]}>
        <View style={styles.wheelRim} />
      </View>

      {/* Rear Left Tire */}
      <View style={[styles.tire, styles.rearLeftTire, isSmashed && styles.smashedTireRear]}>
        <View style={styles.wheelRim} />
      </View>

      {/* Rear Right Tire */}
      <View style={[styles.tire, styles.rearRightTire]}>
        <View style={styles.wheelRim} />
      </View>

      {/* Main Aerodynamic Chassis Body */}
      <View
        style={[
          styles.chassis,
          {
            backgroundColor: bodyColor,
            shadowColor: isNitro ? colors.nitro : bodyColor,
          },
          isNitro ? styles.nitroBorder : styles.defaultBorder,
          isSmashed && styles.smashedChassis,
        ]}>
        {/* Front Bumper & Headlights */}
        <View style={[styles.frontBumper, isSmashed && styles.smashedBumper]}>
          <View style={[styles.headlightLeft, isSmashed && styles.brokenHeadlight]} />
          <View style={styles.headlightRight} />
        </View>

        {/* Center Hood Racing Stripes */}
        <View style={styles.hoodStripeContainer}>
          <View style={[styles.racingStripe, { backgroundColor: stripeColor }]} />
        </View>

        {/* Damage / Smash Engine Flame & Smoke Plume */}
        {(isDamaged || isSmashed) && (
          <View style={styles.engineSmokeBurst}>
            <View style={isSmashed ? styles.smokePuffLarge : styles.smokePuffSmall} />
            {isSmashed && <View style={styles.engineFireBurst} />}
          </View>
        )}

        {/* Front Windshield Glass */}
        <View style={styles.windshield} />

        {/* Roof Section */}
        <View style={[styles.roof, { backgroundColor: roofColor }]}>
          <View style={[styles.roofStripe, { backgroundColor: stripeColor }]} />
        </View>

        {/* Rear Windshield Glass */}
        <View style={styles.rearGlass} />

        {/* Rear Spoiler / Wing (for Sports cars) */}
        {!isTruck ? (
          <View style={[styles.spoilerWing, { backgroundColor: stripeColor }]}>
            <View style={styles.spoilerMountLeft} />
            <View style={styles.spoilerMountRight} />
          </View>
        ) : (
          <View style={styles.truckBed} />
        )}

        {/* Rear Taillights */}
        <View style={styles.taillightsRow}>
          <View style={[styles.taillight, isBraking && styles.taillightBraking]} />
          <View style={[styles.taillight, isBraking && styles.taillightBraking]} />
        </View>
      </View>

      {/* Twin Nitro Flame Thrusters */}
      {isNitro && !isSmashed && (
        <View style={styles.nitroFlameRow}>
          <View style={styles.flameOuter}>
            <View style={styles.flameCore} />
          </View>
          <View style={styles.flameOuter}>
            <View style={styles.flameCore} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tires
  tire: {
    position: 'absolute',
    width: 8,
    height: 18,
    backgroundColor: '#0A0D12',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  wheelRim: {
    width: 2,
    height: 8,
    backgroundColor: '#8B949E',
    borderRadius: 1,
  },
  frontLeftTire: {
    top: 10,
    left: 0,
  },
  frontRightTire: {
    top: 10,
    right: 0,
  },
  rearLeftTire: {
    bottom: 12,
    left: 0,
  },
  rearRightTire: {
    bottom: 12,
    right: 0,
  },
  // Chassis
  chassis: {
    width: '84%',
    height: '92%',
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  nitroBorder: {
    borderColor: colors.nitro,
  },
  defaultBorder: {
    borderColor: '#0D1117',
  },
  frontBumper: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 3,
  },
  headlightLeft: {
    width: 7,
    height: 5,
    backgroundColor: '#FFFDE7',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 2,
  },
  headlightRight: {
    width: 7,
    height: 5,
    backgroundColor: '#FFFDE7',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 2,
  },
  hoodStripeContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    alignItems: 'center',
  },
  racingStripe: {
    width: 4,
    height: '100%',
  },
  windshield: {
    width: '74%',
    height: 14,
    backgroundColor: '#0F1722',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  roof: {
    width: '70%',
    height: 22,
    alignItems: 'center',
  },
  roofStripe: {
    width: 4,
    height: '100%',
  },
  rearGlass: {
    width: '72%',
    height: 10,
    backgroundColor: '#0F1722',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  spoilerWing: {
    position: 'absolute',
    bottom: 10,
    width: '88%',
    height: 5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spoilerMountLeft: {
    position: 'absolute',
    left: 6,
    width: 2,
    height: 4,
    backgroundColor: '#000000',
  },
  spoilerMountRight: {
    position: 'absolute',
    right: 6,
    width: 2,
    height: 4,
    backgroundColor: '#000000',
  },
  truckBed: {
    position: 'absolute',
    bottom: 8,
    width: '80%',
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 4,
  },
  taillightsRow: {
    position: 'absolute',
    bottom: 2,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  taillight: {
    width: 8,
    height: 3,
    backgroundColor: '#B71C1C',
    borderRadius: 1,
  },
  taillightBraking: {
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  // Nitro Jet
  nitroFlameRow: {
    position: 'absolute',
    bottom: -16,
    flexDirection: 'row',
    width: 28,
    justifyContent: 'space-between',
  },
  flameOuter: {
    width: 10,
    height: 18,
    backgroundColor: '#00E5FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameCore: {
    width: 4,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  // Smashed and Damaged States
  smashedTireLeft: {
    transform: [{ rotate: '-35deg' }],
    left: -3,
  },
  smashedTireRight: {
    transform: [{ rotate: '40deg' }],
    right: -4,
  },
  smashedTireRear: {
    transform: [{ rotate: '18deg' }],
  },
  smashedChassis: {
    backgroundColor: '#1C2128',
    borderColor: '#B71C1C',
    transform: [{ scaleX: 0.94 }],
  },
  smashedBumper: {
    transform: [{ rotate: '-6deg' }],
    borderColor: '#FF1744',
  },
  brokenHeadlight: {
    backgroundColor: '#30363D',
  },
  engineSmokeBurst: {
    position: 'absolute',
    top: 6,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smokePuffSmall: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(160, 170, 185, 0.65)',
  },
  smokePuffLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(110, 120, 135, 0.88)',
  },
  engineFireBurst: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5722',
  },
});

export default CarSprite;
