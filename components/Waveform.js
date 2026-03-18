import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

const NUM_BARS = 5;

export default function Waveform({ active = false }) {
  const animations = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (active) {
      const animateBar = (index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(animations[index], {
              toValue: 1,
              duration: 300 + index * 100,
              useNativeDriver: true,
            }),
            Animated.timing(animations[index], {
              toValue: 0.3,
              duration: 300 + index * 100,
              useNativeDriver: true,
            }),
          ])
        );

      const loops = animations.map((_, i) => animateBar(i));
      loops.forEach((l) => l.start());

      return () => loops.forEach((l) => l.stop());
    } else {
      animations.forEach((a) => a.setValue(0.3));
    }
  }, [active]);

  const color = active ? Colors.waveformActive : Colors.waveformInactive;

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
  },
  bar: {
    width: 4,
    height: 30,
    borderRadius: 2,
  },
});
