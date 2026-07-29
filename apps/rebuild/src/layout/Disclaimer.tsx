const year = new Date().getFullYear();

function Disclaimer() {
  return (
    <div className="bg-base-200 px-8">
      <div className="bg-accent/30 h-px"></div>
      <div className="text-base-content/80 my-8 text-xs">
        <p>
          The Vinyl Cut is a non-commercial portfolio demo. All payments run
          through Stripe in test mode — no real transactions occur. Album
          artwork and metadata are used for demonstration purposes only, with no
          affiliation to the artists or labels shown.
          <br />
          <br />© {year} Narciso Lobo. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Disclaimer;
