interface PipsProps {
  pips: number;
}

function Pips({ pips }: PipsProps) {
  return (
    <div role="img" aria-label={`${pips} out of 5`} className="flex gap-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 rounded-full ${index < pips ? "bg-accent" : "bg-accent/20"}`}
        />
      ))}
    </div>
  );
}

export default Pips;
