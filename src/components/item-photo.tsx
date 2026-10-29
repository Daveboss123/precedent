import Image from 'next/image';

interface Props {
  src: string;
  sizes?: string;
}

/** Shipped product photography uses the optimiser; uploaded photos are served as-is. */
export function ItemPhoto({ src, sizes = '56px' }: Props) {
  if (src.startsWith('/api/items/')) {
    return (
      <img
        className="item-photo item-photo--upload"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <Image src={src} alt="" fill sizes={sizes} />;
}
