import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/lib/api', () => ({ getAuthApi: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({ setSession: jest.fn() }));
jest.mock('@/lib/auth/storage', () => ({ refreshTokenStorage: { save: jest.fn() } }));

function render(element: React.ReactElement): ReactTestRenderer {
  let result!: ReactTestRenderer;
  act(() => {
    result = create(element);
  });
  return result;
}

function buttonLabels(element: ReactTestRenderer): string[] {
  const labels = element.root
    .findAll((node) => node.props.accessibilityRole === 'button')
    .map((node) => node.props.accessibilityLabel)
    .filter((label): label is string => typeof label === 'string');

  // Pressable repassa `accessibilityRole` ao host filho, então cada botão aparece mais de uma vez
  return Array.from(new Set(labels));
}

describe('auth screens', () => {
  it('renders the submit button and the register link on the login screen', () => {
    const screen = render(<LoginScreen />);

    expect(buttonLabels(screen)).toEqual(['Entrar', 'Criar conta']);
  });

  it('renders the submit button and the login link on the register screen', () => {
    const screen = render(<RegisterScreen />);

    expect(buttonLabels(screen)).toEqual(['Criar conta', 'Já tenho conta']);
  });
});
