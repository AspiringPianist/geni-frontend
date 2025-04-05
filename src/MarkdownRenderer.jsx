import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-4"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm`} {...props}>
                {children}
              </code>
            );
          },
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
          p: ({node, ...props}) => <p className="my-2" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
          li: ({node, ...props}) => <li className="my-1" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2" {...props} />,
          img: ({node, ...props}) => <img className="max-w-full h-auto rounded-md my-2" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="w-full border border-gray-300" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-gray-50" {...props} />,
          th: ({node, ...props}) => <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b" {...props} />,
          td: ({node, ...props}) => <td className="px-3 py-2 text-sm border-b" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;