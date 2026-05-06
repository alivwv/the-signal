export function HighlightBlock({ content }: { content: string }) {
  return (
    <div className="hl">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
