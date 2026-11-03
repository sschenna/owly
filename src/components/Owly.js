import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, fonts } from '../theme';

// Owly — the animated mascot.
// - Blinks, and his pupils wander on their own so he feels alive.
// - Tapping cycles 6 reactions: tilt, bounce, wink, gasp, spin, hoot.
// - `mood` changes his idle animation + eyes:
//   chill = gentle float, happy = bouncing + ^_^ eyes,
//   sleepy = swaying + closed eyes, sad = droop + tear.

const REACTIONS = ['tilt', 'bounce', 'wink', 'gasp', 'spin', 'hoot'];

const REACTION_CAPTIONS = {
  tilt: 'Hmm? You called?',
  bounce: 'Woo! Happy owl noises!',
  wink: 'I see you. I always see you.',
  gasp: 'Oh! Hi!!',
  spin: 'Wheee!',
  hoot: 'Hoo! Hoo!',
};

const MOOD_CAPTIONS = {
  chill: 'Just vibing. Tap me!',
  happy: 'All docs healthy — happy owl noises!',
  sleepy: 'Shhh… quiet hours. Even owls nap.',
  sad: "Something expired… I'll keep watch anyway.",
};

const INK = '#2d2a32';

export default function Owly({ size = 200, mood = 'chill', hideCaption = false }) {
  const s = size / 200; // scale factor — the drawing is authored at 200x230
  const [blink, setBlink] = useState(false);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [wink, setWink] = useState(false);
  const [gasp, setGasp] = useState(false);
  const [hoot, setHoot] = useState(false);
  const [caption, setCaption] = useState(MOOD_CAPTIONS[mood] || MOOD_CAPTIONS.chill);
  const [rxIndex, setRxIndex] = useState(0);

  const ty = useRef(new Animated.Value(0)).current; // vertical bob driver
  const rot = useRef(new Animated.Value(0)).current; // rotation driver
  const running = useRef([]);
  const timers = useRef([]);
  const hootTimer = useRef(null);

  const later = (ms, fn) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  const stopAll = () => {
    running.current.forEach((a) => a.stop());
    running.current = [];
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const track = (anim) => {
    running.current.push(anim);
    anim.start(({ finished }) => {
      if (finished) running.current = running.current.filter((a) => a !== anim);
    });
  };

  // Idle animation per mood. Reactions stop it, play, then restart it.
  const startMoodLoop = (m) => {
    stopAll();
    ty.setValue(0);
    rot.setValue(0);
    if (m === 'happy') {
      track(
        Animated.loop(
          Animated.sequence([
            Animated.timing(ty, { toValue: -14, duration: 450, useNativeDriver: true }),
            Animated.timing(ty, { toValue: 0, duration: 450, useNativeDriver: true }),
          ]),
        ),
      );
    } else if (m === 'sleepy') {
      track(
        Animated.loop(
          Animated.sequence([
            Animated.timing(rot, { toValue: -3, duration: 2100, useNativeDriver: true }),
            Animated.timing(rot, { toValue: 3, duration: 2100, useNativeDriver: true }),
          ]),
        ),
      );
    } else if (m === 'sad') {
      track(
        Animated.loop(
          Animated.sequence([
            Animated.timing(ty, { toValue: 5, duration: 1700, useNativeDriver: true }),
            Animated.timing(ty, { toValue: 0, duration: 1700, useNativeDriver: true }),
          ]),
        ),
      );
    } else {
      track(
        Animated.loop(
          Animated.sequence([
            Animated.timing(ty, { toValue: -7, duration: 1600, useNativeDriver: true }),
            Animated.timing(ty, { toValue: 0, duration: 1600, useNativeDriver: true }),
          ]),
        ),
      );
    }
  };

  useEffect(() => {
    startMoodLoop(mood);
    setCaption(MOOD_CAPTIONS[mood] || MOOD_CAPTIONS.chill);
    return stopAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  // Blink every ~4.6s
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      const t = setTimeout(() => setBlink(false), 140);
      timers.current.push(t);
    }, 4600);
    return () => clearInterval(id);
  }, []);

  // Pupils wander every ~7s
  useEffect(() => {
    const id = setInterval(() => {
      setPupil({ x: Math.round(Math.random() * 8 - 4), y: Math.round(Math.random() * 4 - 2) });
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const finishReaction = (ms) => later(ms, () => startMoodLoop(mood));

  const onTap = () => {
    const name = REACTIONS[rxIndex % REACTIONS.length];
    setRxIndex((i) => i + 1);
    setCaption(REACTION_CAPTIONS[name]);
    stopAll();
    ty.setValue(0);
    rot.setValue(0);

    if (name === 'tilt') {
      track(
        Animated.sequence([
          Animated.timing(rot, { toValue: -11, duration: 180, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 8, duration: 180, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
      );
      finishReaction(600);
    } else if (name === 'bounce') {
      track(
        Animated.sequence([
          Animated.timing(ty, { toValue: -22, duration: 220, useNativeDriver: true }),
          Animated.timing(ty, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(ty, { toValue: -8, duration: 140, useNativeDriver: true }),
          Animated.timing(ty, { toValue: 0, duration: 140, useNativeDriver: true }),
        ]),
      );
      finishReaction(750);
    } else if (name === 'wink') {
      setWink(true);
      later(700, () => setWink(false));
      finishReaction(750);
    } else if (name === 'gasp') {
      setGasp(true);
      later(700, () => setGasp(false));
      finishReaction(750);
    } else if (name === 'spin') {
      track(Animated.timing(rot, { toValue: 360, duration: 800, useNativeDriver: true }));
      finishReaction(850);
    } else {
      setHoot(true);
      // Use a dedicated timer (not in timers.current) so rapid taps don't
      // clear the hide via stopAll().
      if (hootTimer.current) clearTimeout(hootTimer.current);
      hootTimer.current = setTimeout(() => setHoot(false), 1200);
      finishReaction(1250);
    }
  };

  const rotDeg = rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });
  const eyeR = gasp ? 30 : 25;

  const renderEye = (cx, isWinked) => {
    if (isWinked || blink) {
      return (
        <Path
          d={`M${cx - 18} 106 Q${cx} 112 ${cx + 18} 106`}
          stroke={INK}
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <G>
        <Circle cx={cx} cy={106} r={eyeR} fill="#fff" />
        <Circle cx={cx + pupil.x} cy={108 + pupil.y} r={10.5} fill={INK} />
        <Circle cx={cx + pupil.x + 3.5} cy={104.5 + pupil.y} r={3.6} fill="#fff" />
      </G>
    );
  };

  const renderEyes = () => {
    if (mood === 'happy') {
      return (
        <G>
          <Path d="M54 108 Q74 88 94 108" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M106 108 Q126 88 146 108" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        </G>
      );
    }
    if (mood === 'sleepy') {
      return (
        <G>
          <Path d="M56 108 Q74 114 92 108" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M108 108 Q126 114 144 108" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        </G>
      );
    }
    return (
      <G>
        {renderEye(74, wink)}
        {renderEye(126, false)}
      </G>
    );
  };

  return (
    <View style={[styles.wrap, { width: size, height: size * 1.25 }]}>
      {hoot && (
        <View style={[styles.hoot, { top: 8 * s, left: 0 }]}>
          <Text style={styles.hootText}>Hoo! Hoo!</Text>
        </View>
      )}
      {mood === 'sleepy' && (
        <>
          <Text style={[styles.zzz, { right: 30 * s, top: 0, fontSize: 18 * s }]}>z</Text>
          <Text style={[styles.zzz, { right: 48 * s, top: 6 * s, fontSize: 14 * s }]}>z</Text>
        </>
      )}
      <Pressable onPress={onTap} accessibilityLabel="Owly the owl — tap for a reaction">
        <Animated.View style={{ transform: [{ translateY: ty }, { rotate: rotDeg }] }}>
          <Svg width={size} height={size * 1.15} viewBox="0 0 200 230">
            <Defs>
              <LinearGradient id="owlyBody" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.coral} />
                <Stop offset="1" stopColor={colors.purple} />
              </LinearGradient>
            </Defs>
            <Ellipse cx={100} cy={218} rx={52} ry={8} fill="rgba(120,60,90,0.10)" />
            <Path d="M50 82 L40 46 L76 64 Z" fill="url(#owlyBody)" />
            <Path d="M150 82 L160 46 L124 64 Z" fill="url(#owlyBody)" />
            <Path d="M118 200 l-7 12 M126 200 l0 13 M134 200 l7 12" stroke="#f59e0b" strokeWidth={6} strokeLinecap="round" />
            <Path d="M66 200 l-7 12 M74 200 l0 13 M82 200 l7 12" stroke="#f59e0b" strokeWidth={6} strokeLinecap="round" />
            <Ellipse cx={100} cy={132} rx={64} ry={72} fill="url(#owlyBody)" />
            <Ellipse cx={100} cy={156} rx={38} ry={44} fill="#ffffff" opacity={0.32} />
            <Path d="M40 122 Q20 152 38 182 Q52 162 50 130 Z" fill="#d14e73" opacity={0.85} />
            <Path d="M160 122 Q180 152 162 182 Q148 162 150 130 Z" fill="#d14e73" opacity={0.85} />
            {renderEyes()}
            {mood === 'sad' && <Path d="M138 132 q7 10 0 16 q-7 -6 0 -16" fill="#7dd3fc" />}
            {mood === 'happy' ? (
              <Ellipse cx={100} cy={134} rx={9} ry={11} fill="#f59e0b" />
            ) : (
              <Path d="M91 128 L109 128 L100 141 Z" fill="#f59e0b" />
            )}
          </Svg>
        </Animated.View>
      </Pressable>
      {!hideCaption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-start' },
  caption: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  hoot: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#be5a78',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  hootText: { fontFamily: fonts.extraBold, fontSize: 15, color: colors.ink },
  zzz: { position: 'absolute', fontFamily: fonts.extraBold, color: colors.purple, zIndex: 2 },
});
