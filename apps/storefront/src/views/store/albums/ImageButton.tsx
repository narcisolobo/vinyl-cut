import Image from "next/image";
import { Dispatch, SetStateAction } from "react";

interface ImageButtonProps {
  altText: string;
  imageUrl: string;
  selectedImage: string;
  onSelect: Dispatch<SetStateAction<string>>;
}

function ImageButton({
  altText,
  imageUrl,
  selectedImage,
  onSelect,
}: ImageButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(imageUrl)}
      aria-pressed={selectedImage === imageUrl}
      className="relative aspect-square w-1/4"
    >
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes="33vw"
        className={`rounded-box object-cover ${
          selectedImage === imageUrl ? "border-primary border" : ""
        }`}
      />
    </button>
  );
}

export default ImageButton;
