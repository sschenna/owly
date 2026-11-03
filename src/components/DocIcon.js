import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { docGradients } from '../theme';

// Rounded-square doc icon with a white glyph, drawn in code.
// Authored at 56x56; scales cleanly to any `size` via the viewBox.
const GLYPHS = {
  passport: (
    <>
      <Rect x="6" y="3" width="12" height="18" rx="2.5" />
      <Circle cx="12" cy="10" r="2.6" />
      <Path d="M9.5 16.5h5" />
    </>
  ),
  license: (
    <>
      <Rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <Path d="M6 10.5h6M6 14h4" />
      <Circle cx="17" cy="12.5" r="1.6" />
    </>
  ),
  visa: (
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5s-1.3 6.2-3.8 8.5c-2.5-2.3-3.8-5.2-3.8-8.5s1.3-6.2 3.8-8.5z" />
    </>
  ),
  idcard: (
    <>
      <Rect x="4" y="5" width="16" height="14" rx="2.5" />
      <Circle cx="9" cy="11" r="2" />
      <Path d="M5.5 16.5c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5M14.5 9.5h3M14.5 12.5h3" />
    </>
  ),
  insurance: (
    <>
      <Path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />
      <Path d="M9 12l2 2 4-4.5" />
    </>
  ),
  custom: (
    <>
      <Path d="M6 3h8l4 4v14H6z" />
      <Path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
};

export default function DocIcon({ type = 'custom', size = 56 }) {
  const [c1, c2] = docGradients[type] || docGradients.custom;
  const gid = `docg-${type}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c1} />
          <Stop offset="1" stopColor={c2} />
        </LinearGradient>
      </Defs>
      <Rect width="56" height="56" rx="19" fill={`url(#${gid})`} />
      <G
        transform="translate(16,16)"
        stroke="#fff"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {GLYPHS[type] || GLYPHS.custom}
      </G>
    </Svg>
  );
}
