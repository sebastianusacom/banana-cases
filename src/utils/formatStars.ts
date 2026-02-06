export function formatStars(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}b`;
  }

  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}m`;
  }

  if (abs >= 1_000) {
    return `${(value / 1_000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}k`;
  }

  return value.toLocaleString();
}

