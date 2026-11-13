import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
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
  isShielded = false,
  showHeadlights = true,
  vehicleType = 'sports',
  image = null,
}) => {
  if (image) {
    return (
      <View style={[styles.container, { width, height }]}>
        {/* Realistic 3D Ground Projection Shadow */}
        <View
          style={[
            styles.imageGroundShadow,
            { width: width * 0.92, height: height * 0.88 },
          ]}
          pointerEvents="none"
        />

        {/* Dynamic Forward Headlights Projection Beams */}
        {showHeadlights && !isSmashed && (
          <View style={styles.headlightBeamContainer} pointerEvents="none">
            <View style={[styles.headlightBeam, styles.headlightBeamLeft]} />
            <View style={[styles.headlightBeam, styles.headlightBeamRight]} />
          </View>
        )}

        {/* Safe Zone Forcefield Shield Envelope */}
        {isShielded && (
          <View style={styles.shieldForcefieldHalo} pointerEvents="none">
            <View style={styles.shieldPulseRing} />
          </View>
        )}

        {/* High-Resolution Vehicle PNG Sprite */}
        <Image
          source={image}
          style={[
            styles.carImage,
            { width, height },
            isSmashed && styles.smashedImage,
            isDamaged && styles.damagedImage,
          ]}
          resizeMode="contain"
        />

        {/* Engine Smoke Plume when Damaged */}
        {(isDamaged || isSmashed) && (
          <View style={styles.engineSmokeBurst} pointerEvents="none">
            <View style={isSmashed ? styles.smokePuffLarge : styles.smokePuffSmall} />
            {isSmashed && <View style={styles.engineFireBurst} />}
          </View>
        )}

        {/* Dynamic Red Brake Lights Glow */}
        {isBraking && !isSmashed && (
          <View style={styles.imageBrakeGlow} pointerEvents="none" />
        )}

        {/* Twin Cyber Cyan Boost Flame Jets */}
        {isNitro && !isSmashed && (
          <View style={styles.imageNitroFlameRow} pointerEvents="none">
            <View style={styles.imageFlameOuter}>
              <View style={styles.imageFlameCore} />
            </View>
            <View style={styles.imageFlameOuter}>
              <View style={styles.imageFlameCore} />
            </View>
          </View>
        )}
      </View>
    );
  }

  const isBike = vehicleType === 'bike';
  if (isBike) {
    return (
      <View style={[styles.container, { width, height }]}>
        {/* Ground shadow beneath motorbike */}
        <View
          style={[
            styles.bikeGroundShadow,
            { width: width * 0.75, height: height * 0.85 },
          ]}
          pointerEvents="none"
        />

        {/* Motorcycle Headlight Beam Projection */}
        {showHeadlights && !isSmashed && (
          <View style={styles.bikeHeadlightBeam} pointerEvents="none" />
        )}

        {/* Front In-Line Rubber Tire */}
        <View style={[styles.bikeTire, styles.bikeFrontTire, isSmashed && styles.smashedTireLeft]}>
          <View style={styles.bikeWheelRim} />
        </View>

        {/* Rear In-Line Rubber Tire */}
        <View style={[styles.bikeTire, styles.bikeRearTire]}>
          <View style={styles.bikeWheelRim} />
        </View>

        {/* Chrome Exhaust Pipe */}
        <View style={styles.bikeExhaust} />

        {/* Main Motorcycle Body / Chassis Frame */}
        <View
          style={[
            styles.bikeChassis,
            { backgroundColor: bodyColor },
            isSmashed && styles.smashedChassis,
          ]}>
          {/* Front Chrome Forks & Handlebars */}
          <View style={styles.bikeHandlebars}>
            <View style={styles.bikeHandleGrip} />
            <View style={styles.bikeHandleGrip} />
          </View>

          {/* Aerodynamic Front Cowl & Headlight */}
          <View style={[styles.bikeCowl, { backgroundColor: bodyColor }]}>
            <View style={styles.bikeHeadlight} />
          </View>

          {/* Fuel Tank with Racing Stripe */}
          <View style={styles.bikeFuelTank}>
            <View style={[styles.bikeTankStripe, { backgroundColor: stripeColor }]} />
          </View>

          {/* Rider: Leather Jacket Shoulders & Helmet */}
          <View style={styles.bikeRiderTorso}>
            <View style={styles.bikeHelmet}>
              {/* Tinted Visor */}
              <View style={styles.bikeVisor} />
            </View>
          </View>

          {/* Rear Seat & Tail Section */}
          <View style={[styles.bikeTail, { backgroundColor: bodyColor }]}>
            {/* Rear Taillight */}
            <View style={[styles.bikeTaillight, isBraking && styles.bikeTaillightBraking]} />
          </View>

          {/* Engine Smoke on Damage / Smash */}
          {(isDamaged || isSmashed) && (
            <View style={styles.engineSmokeBurst}>
              <View style={isSmashed ? styles.smokePuffLarge : styles.smokePuffSmall} />
              {isSmashed && <View style={styles.engineFireBurst} />}
            </View>
          )}
        </View>
      </View>
    );
  }

  const isCommercial = vehicleType === 'truck' || vehicleType === 'bus' || vehicleType === 'van';

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

        {/* Rear Spoiler / Wing (for Sports cars) vs Cargo Bed (for Trucks/Vans/Buses) */}
        {!isCommercial ? (
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
  carImage: {
    alignSelf: 'center',
  },
  smashedImage: {
    opacity: 0.85,
    transform: [{ scaleY: 0.85 }, { rotate: '-6deg' }],
  },
  damagedImage: {
    opacity: 0.9,
  },
  imageBrakeGlow: {
    position: 'absolute',
    bottom: -6,
    left: '20%',
    right: '20%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  imageGroundShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 0,
  },
  headlightBeamContainer: {
    position: 'absolute',
    top: -70,
    left: 0,
    right: 0,
    height: 75,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 0,
  },
  headlightBeam: {
    width: 22,
    height: 75,
    backgroundColor: 'rgba(255, 255, 220, 0.12)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    transform: [{ scaleY: 1.1 }],
  },
  headlightBeamLeft: {
    transform: [{ rotate: '-6deg' }],
  },
  headlightBeamRight: {
    transform: [{ rotate: '6deg' }],
  },
  shieldForcefieldHalo: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    left: -12,
    right: -12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    elevation: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  shieldPulseRing: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.55)',
  },
  imageNitroFlameRow: {
    position: 'absolute',
    bottom: -22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '48%',
    alignSelf: 'center',
    zIndex: 2,
  },
  imageFlameOuter: {
    width: 9,
    height: 22,
    backgroundColor: '#00F0FF',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    alignItems: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  imageFlameCore: {
    width: 5,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: 2,
  },
  // Motorcycle / Bike Aesthetics
  bikeGroundShadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 0,
  },
  bikeHeadlightBeam: {
    position: 'absolute',
    top: -55,
    width: 18,
    height: 60,
    backgroundColor: 'rgba(255, 255, 220, 0.16)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignSelf: 'center',
    zIndex: 0,
  },
  bikeTire: {
    position: 'absolute',
    width: 6,
    height: 16,
    backgroundColor: '#0A0D12',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#21262D',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bikeFrontTire: {
    top: 2,
  },
  bikeRearTire: {
    bottom: 2,
  },
  bikeWheelRim: {
    width: 2,
    height: 8,
    backgroundColor: '#8B949E',
    borderRadius: 1,
  },
  bikeExhaust: {
    position: 'absolute',
    right: 2,
    bottom: 8,
    width: 3,
    height: 18,
    backgroundColor: '#C0C0C0',
    borderRadius: 1.5,
    zIndex: 1,
  },
  bikeChassis: {
    width: 22,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0D1117',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 2,
  },
  bikeHandlebars: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 3,
    backgroundColor: '#C0C0C0',
    borderRadius: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  bikeHandleGrip: {
    width: 4,
    height: 3,
    backgroundColor: '#111111',
    borderRadius: 1,
  },
  bikeCowl: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  bikeHeadlight: {
    width: 6,
    height: 3,
    backgroundColor: '#FFFDE7',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bikeFuelTank: {
    width: 14,
    height: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 2,
  },
  bikeTankStripe: {
    width: 3,
    height: '100%',
  },
  bikeRiderTorso: {
    width: 16,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#1E232A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  bikeHelmet: {
    width: 11,
    height: 12,
    borderRadius: 5.5,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bikeVisor: {
    width: 7,
    height: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 1.5,
    marginTop: -2,
  },
  bikeTail: {
    width: 10,
    height: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  bikeTaillight: {
    width: 6,
    height: 2.5,
    backgroundColor: '#B71C1C',
    borderRadius: 1,
  },
  bikeTaillightBraking: {
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default CarSprite;
