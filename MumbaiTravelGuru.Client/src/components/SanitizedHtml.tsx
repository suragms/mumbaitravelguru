'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

export default function SanitizedHtml({ html, className }: { html: string; className?: string }) {
  const sanitized = useMemo(() => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption', 'hr', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'span', 'div', 'sub', 'sup',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style'],
    ALLOW_DATA_ATTR: false,
  }), [html]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
