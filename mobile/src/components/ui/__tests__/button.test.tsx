import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { Colors } from '@/constants/theme';

import { Button } from '../button';

function subject(element: ReactTestRenderer) {
  const pressable = element.root.findAll(
    (node) => node.props.accessibilityRole === 'button',
  )[0];
  const style = pressable.props.style;
  return {
    className: String(pressable.props.className ?? ''),
    idle: (typeof style === 'function' ? style({ pressed: false }) : style) as Record<string, unknown>[],
    pressed: (typeof style === 'function' ? style({ pressed: true }) : style) as Record<string, unknown>[],
  };
}

function flatten(styles: unknown): Record<string, unknown> {
  if (Array.isArray(styles)) {
    return Object.assign({}, ...styles.filter(Boolean));
  }
  return (styles ?? {}) as Record<string, unknown>;
}

function render(element: React.ReactElement): ReactTestRenderer {
  let result!: ReactTestRenderer;
  act(() => {
    result = create(element);
  });
  return result;
}

describe('Button', () => {
  it('starts on the dark amber and lightens when pressed', () => {
    const { className, pressed } = subject(render(<Button label="Entrar" onPress={() => {}} />));

    // fundo estático vive no NativeWind
    expect(className).toContain('bg-accentPressed');
    // estado dinâmico vive no style, para não remontar classes no nativo
    expect(flatten(pressed).backgroundColor).toBe(Colors.dark.accent);
  });

  it('renders the link variant without a fill', () => {
    const { className } = subject(render(<Button label="Criar conta" variant="link" onPress={() => {}} />));

    expect(className).toContain('bg-transparent');
  });

  it('shows a disabled primary as raised, not amber', () => {
    const { className } = subject(render(<Button label="Entrar" onPress={() => {}} disabled />));

    expect(className).toContain('bg-raised');
  });

  it('keeps the height at the minimum tap target', () => {
    const { className } = subject(render(<Button label="Entrar" onPress={() => {}} />));

    expect(className).toContain('h-12');
  });
});
