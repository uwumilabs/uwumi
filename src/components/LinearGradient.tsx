import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';

// On iOS expo-linear-gradient passes props straight to its native view, which uniwind doesn't style, so
// `className` sizing was dropped there (0×0, invisible). Android only worked because it wraps an RN View.
export const LinearGradient = withUniwind(ExpoLinearGradient);

export default LinearGradient;
