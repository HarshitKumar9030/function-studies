import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const plugins = [remarkGfm, remarkMath];
const mathPlugins: [
  typeof rehypeKatex,
  { trust: boolean; strict: string; maxExpand: number; maxSize: number },
][] = [[rehypeKatex, { trust: false, strict: 'ignore', maxExpand: 100, maxSize: 10 }]];
export const Markdown = memo(function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={plugins}
        rehypePlugins={mathPlugins}
        skipHtml
        components={{ img: () => null, a: ({ children }) => <span>{children}</span> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
