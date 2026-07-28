interface EyebrowProps {
  message: string;
}

function Eyebrow({ message }: EyebrowProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="from-accent h-0.5 w-14 bg-linear-to-r to-transparent"></div>
      <span className="text-primary text-sm font-semibold tracking-[4px] uppercase">
        {message}
      </span>
    </div>
  );
}

export default Eyebrow;
