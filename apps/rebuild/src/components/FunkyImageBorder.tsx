import Image, { StaticImageData } from "next/image";

interface FunkyImageBorderProps {
  image: StaticImageData;
  alt: string;
  loading?: "eager" | "lazy" | undefined;
}

function FunkyImageBorder({ image, alt, loading }: FunkyImageBorderProps) {
  return (
    <div
      id="thin-border"
      className="border-accent/30 relative max-w-160 min-w-75 flex-1 -translate-6 border-2"
    >
      <div
        id="thick-shadow"
        className="relative aspect-4/3 translate-4 shadow-[12px_12px_0_var(--color-accent)]"
      >
        <Image
          src={image}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 90vw, 600px"
          className="object-cover"
          loading={loading ? loading : "lazy"}
        />
      </div>
    </div>
  );
}

export default FunkyImageBorder;
