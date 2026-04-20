// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Redirect: jest.fn(({ href }) => null),
  Stack: jest.fn(({ children }) => children),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3000/api/v1',
    },
  },
}));
