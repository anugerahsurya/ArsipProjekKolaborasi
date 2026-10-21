import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Rumus LaTeX dirender dengan KaTeX. block = tampilan terpisah (display mode).
export default function Tex({ tex, block = false }) {
  const html = useMemo(() => katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: false }), [tex, block])
  const Tag = block ? 'div' : 'span'
  return <Tag className={block ? 'tex tex-block' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />
}
