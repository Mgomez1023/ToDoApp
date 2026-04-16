function normalizeHex(hex: string) {
  const trimmed = hex.trim();

  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function hexToRgba(hex: string, alpha: number) {
  const normalizedHex = normalizeHex(hex);

  if (!normalizedHex) {
    return hex;
  }

  const red = Number.parseInt(normalizedHex.slice(1, 3), 16);
  const green = Number.parseInt(normalizedHex.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedHex.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getLabelColorStyles(color: string) {
  return {
    backgroundColor: hexToRgba(color, 0.12),
    borderColor: hexToRgba(color, 0.28),
    color,
  };
}

export function getTaskCardColorStyles(color: string) {
  return {
    "--task-card-bg": hexToRgba(color, 0.08),
    "--task-card-bg-hover": hexToRgba(color, 0.1),
    "--task-card-border": hexToRgba(color, 0.34),
    "--task-card-border-hover": hexToRgba(color, 0.42),
    "--task-card-divider": hexToRgba(color, 0.18),
    "--task-card-handle-bg": hexToRgba(color, 0.08),
    "--task-card-handle-bg-hover": hexToRgba(color, 0.1),
    "--task-card-handle-border": hexToRgba(color, 0.2),
    "--task-card-handle-border-hover": hexToRgba(color, 0.28),
    "--task-card-handle-color": hexToRgba(color, 0.78),
    "--task-card-handle-color-hover": color,
  } satisfies Record<`--${string}`, string>;
}
