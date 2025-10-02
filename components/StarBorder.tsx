import { Platform } from 'react-native';

// Platform shim to let TS resolve '@/components/StarBorder'
// Uses platform-specific implementations already present
// web: StarBorder.web.tsx, native: StarBorder.native.tsx
const Comp = Platform.OS === 'web'
  ? require('./StarBorder.web').default
  : require('./StarBorder.native').default;

export default Comp;
