// TODO: AR localization. EN-only data ported from the-signal-v2-final.html ATL.en.
const ATL = [
  {
    n: "ATL",
    color: "var(--color-teal)",
    d: "<strong>Mass, untargeted.</strong> TV, radio, print ads, billboards. High awareness, hard to measure.",
  },
  {
    n: "BTL",
    color: "var(--color-green)",
    d: "<strong>Targeted, direct.</strong> Events, sponsorships, PR, influencers. Measurable, personal.",
  },
  {
    n: "TTL",
    color: "var(--color-sage)",
    d: "<strong>Integrated.</strong> ATL reach + BTL engagement. Digital advertising lives here.",
  },
  {
    n: "360°",
    color: "var(--color-lime)",
    d: "<strong>Surrounds the consumer.</strong> Every touchpoint coordinated. IMC in its fullest expression.",
  },
];

export function AtlBtlTtlBlock() {
  return (
    <div className="atg">
      {ATL.map((card) => (
        <div
          key={card.n}
          className="atc"
          style={{ borderTopColor: card.color }}
        >
          <div className="ath">{card.n}</div>
          <div
            className="atb"
            dangerouslySetInnerHTML={{ __html: card.d }}
          />
        </div>
      ))}
    </div>
  );
}
