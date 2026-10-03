import { useMemo } from 'react';
import katex from 'katex';
export function MathText({ tex }: { tex: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, output: 'htmlAndMathml' }),
    [tex],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
