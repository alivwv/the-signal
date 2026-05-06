export function CaseStudyBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="cpt">
      <div className="cpt-eye">Case Study</div>
      <div className="cpt-tit">{title}</div>
      <div
        className="cpt-bd"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
