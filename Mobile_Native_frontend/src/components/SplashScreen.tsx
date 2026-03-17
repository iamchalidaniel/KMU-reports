import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

const ACCENT = '#10B981';
const BG = '#0B1120';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.4)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: ring pulse in + logo appear
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0.25,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: text fades in
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        // Hold for a moment
        Animated.delay(900),
        // Step 3: fade whole screen out
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: exitOpacity }]}>
      {/* Background decorative ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          styles.ringInner,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/kmu_official.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        KMU Reports
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Discipline · Facilities · Accountability
      </Animated.Text>

      {/* Bottom version */}
      <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
        v1.0.0
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  ring: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    borderWidth: 2,
    borderColor: ACCENT,
  },
  ringInner: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderColor: ACCENT,
    opacity: 0.12,
  },
  logoWrap: {
    width: 130,
    height: 130,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: 130,
    height: 130,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    color: '#334155',
    letterSpacing: 1,
  },
});
