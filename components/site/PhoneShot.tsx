import Image from "next/image";

/**
 * A real App Store screenshot (1320×2868 source, stored at 660×1434) inside a
 * simple phone frame. `priority` only for the first above-the-fold shot.
 */
export function PhoneShot({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(min-width: 1024px) 320px, 70vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative aspect-[660/1434] w-full overflow-hidden rounded-[2.2rem] border-[6px] border-stone-900 bg-stone-900 shadow-elevated ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="rounded-[1.8rem] object-cover"
      />
    </div>
  );
}
