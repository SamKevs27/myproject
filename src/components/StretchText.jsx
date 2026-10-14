import { useState } from 'react'
import { useInView } from '../hooks/useInView'
import { useIsFormal } from '../context/ViewMode'

/**
 * Splits text into letters that stretch in from narrow (Anybody's width axis)
 * when scrolled into view. "\n" in the text becomes a line break. Screen
 * readers get the plain text via aria-label; the letter spans are hidden.
 */
export default function StretchText({ text = '', as = 'span', className = '', immediate = false }) {
  const Tag = as
  const [ref, inView] = useInView({ threshold: 0.4 })
  const [done, setDone] = useState(false)
  const formal = useIsFormal()
  // When the last letter lands, the entrance is retired so it never replays.
  const total = [...text.replace(/\s+/g, '')].length
  let index = 0

  // formal view: just the words, no per-letter animation
  if (formal) {
    return (
      <Tag ref={ref} className={className}>
        {text.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
      </Tag>
    )
  }

  return (
    <Tag
      ref={ref}
      className={`stretch-text${immediate || inView ? ' is-in' : ''}${done ? ' is-done' : ''}${className ? ` ${className}` : ''}`}
      aria-label={text.replace(/\n/g, ' ')}
      onAnimationEnd={(e) => {
        if (e.animationName === 'stretchIn' && Number(e.target.style.getPropertyValue('--i')) === total - 1) setDone(true)
      }}
    >
      {text.split('\n').map((line, lineIdx) => (
        <span key={lineIdx} aria-hidden="true">
          {lineIdx > 0 && <br />}
          {line.split(/(\s+)/).map((word, wordIdx) => (
            /^\s+$/.test(word) ? (
              <span key={wordIdx} className="st-space"> </span>
            ) : (
              <span key={wordIdx} className="st-word">
                {[...word].map((char, charIdx) => (
                  <span key={charIdx} className="st-char" style={{ '--i': index++ }}>{char}</span>
                ))}
              </span>
            )
          ))}
        </span>
      ))}
    </Tag>
  )
}
