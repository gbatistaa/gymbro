import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';

import { TextField } from '../text-field';

function render(element: React.ReactElement): ReactTestRenderer {
  let result!: ReactTestRenderer;
  act(() => {
    result = create(element);
  });
  return result;
}

function inputOf(element: ReactTestRenderer) {
  return element.root.findByType(TextInput);
}

function eyeButtonOf(element: ReactTestRenderer) {
  return element.root.findByProps({ accessibilityRole: 'button' });
}

describe('TextField — password visibility', () => {
  it('hides the value by default when secureTextEntry is set', () => {
    const screen = render(<TextField label="Senha" value="secret123" secureTextEntry />);

    expect(inputOf(screen).props.secureTextEntry).toBe(true);
  });

  it('shows an eye button only for password fields', () => {
    const password = render(<TextField label="Senha" value="x" secureTextEntry />);
    const plain = render(<TextField label="Nome" value="Ana" />);

    expect(eyeButtonOf(password).props.accessibilityLabel).toBe('Mostrar senha');
    expect(plain.root.findAll((n) => n.props.accessibilityRole === 'button')).toHaveLength(0);
  });

  it('toggles visibility when the eye button is tapped', () => {
    const screen = render(<TextField label="Senha" value="secret123" secureTextEntry />);

    act(() => {
      eyeButtonOf(screen).props.onPress();
    });

    expect(inputOf(screen).props.secureTextEntry).toBe(false);
    expect(eyeButtonOf(screen).props.accessibilityLabel).toBe('Ocultar senha');

    act(() => {
      eyeButtonOf(screen).props.onPress();
    });

    expect(inputOf(screen).props.secureTextEntry).toBe(true);
  });
});
