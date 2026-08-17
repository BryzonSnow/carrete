import {
  MARK,
  MARK_COLORS,
  avatarColors,
  avatarFromSeed,
  cellsFromMap,
  iconColors,
  iconKindForItem,
  ICONS,
  type ItemIconKind,
} from "@/lib/pixel";

function PixelGrid({
  map,
  colors,
  size,
  label,
}: {
  map: string[];
  colors: Record<string, string>;
  size: number;
  label?: string;
}) {
  const w = map[0]?.length ?? 12;
  const h = map.length;
  const cells = cellsFromMap(map, colors);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
      className="block"
    >
      {cells.map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width={cell.w} height={1} fill={cell.fill} />
      ))}
    </svg>
  );
}

export function PixelAvatar({
  seed,
  size = 32,
  className = "",
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const { palette, map } = avatarFromSeed(seed);
  return (
    <span
      className={`pixel-avatar inline-grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: palette.bg }}
      title={seed}
    >
      <PixelGrid map={map} colors={avatarColors(palette)} size={size} label={seed ? `Avatar de ${seed}` : undefined} />
    </span>
  );
}

export function PixelIcon({
  kind,
  size = 24,
  className = "",
}: {
  kind: ItemIconKind;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`pixel-icon inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <PixelGrid map={ICONS[kind]} colors={iconColors(kind)} size={size} />
    </span>
  );
}

export function ItemPixelIcon({ name, size = 24 }: { name: string; size?: number }) {
  return <PixelIcon kind={iconKindForItem(name)} size={size} />;
}

export function PixelMark({ size = 22 }: { size?: number }) {
  return (
    <span className="pixel-icon inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden>
      <PixelGrid map={MARK} colors={MARK_COLORS} size={size} />
    </span>
  );
}
