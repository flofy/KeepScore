import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Regression guards for the player-card fluid layout.
 *
 * The player tile must scale with its own container width (cqw), never with
 * fixed pixel values. These tests parse styles.css and fail if someone
 * reintroduces hard-coded sizes in the tile rules.
 */

// Resolve the CSS file relative to this test file (works in vitest runtime).
const cssPath = fileURLToPath(new URL('../styles.css', import.meta.url))
const css: string = readFileSync(cssPath, 'utf8')

type Rule = { selector: string; body: string }

function parseRules(source: string): Rule[] {
  const rules: Rule[] = []
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  // Match `selector { body }` blocks (no nested @media bodies needed for the
  // tile rules; media queries are matched with their prefixed selector).
  const pattern = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(withoutComments)) !== null) {
    rules.push({
      selector: match[1].trim(),
      body: match[2],
    })
  }
  return rules
}

const rules = parseRules(css)

function findRules(fragment: string): Rule[] {
  return rules.filter((rule) => rule.selector.includes(fragment))
}

describe('player card fluid layout (styles.css)', () => {
  it('defines .player-card as a size container', () => {
    const card = findRules('.player-card').find(
      (rule) => rule.selector === '.player-card',
    )
    expect(card).toBeDefined()
    expect(card?.body).toContain('container-type: inline-size')
  })

  it('scales the card height with the container, not a fixed value', () => {
    const card = rules.find((rule) => rule.selector === '.player-card')
    const minHeight = card?.body.match(/min-height:\s*([^;]+);/)?.[1] ?? ''
    expect(minHeight).toMatch(/cqw|dvh|vh|%/)
  })

  const fluidFontSelectors = [
    '.player-name',
    '.score-value',
    '.inline-step',
    '.quick-step',
    '.card-flip-btn',
    '.custom-delta-btn',
  ]

  for (const fragment of fluidFontSelectors) {
    it(`has no fixed (non-fluid) font-size in "${fragment}" rules`, () => {
      const matching = findRules(fragment)
      expect(matching.length).toBeGreaterThan(0)
      for (const rule of matching) {
        const fontSize = rule.body.match(/font-size:\s*([^;]+);/)?.[1]
        if (!fontSize) continue
        // A bare `NNpx` (single value) is a hard-coded size: it cannot adapt
        // to the card width. clamp()/cqw/em/% values are fine.
        expect(
          fontSize,
          `font-size "${fontSize}" in "${rule.selector}" must be fluid (clamp/cqw/em), not a bare px value`,
        ).not.toMatch(/^\s*\d+px\s*$/)
      }
    })
  }

  it('uses container units (cqw) somewhere in the tile rules', () => {
    const tileFragments = [
      '.player-card',
      '.player-name',
      '.score-value',
      '.inline-step',
      '.quick-step',
    ]
    const usesCqw = tileFragments.some((fragment) =>
      findRules(fragment).some((rule) => rule.body.includes('cqw')),
    )
    expect(usesCqw).toBe(true)
  })

  it('never sizes tile fonts with viewport units (vw/vh)', () => {
    const tileFragments = [
      '.player-name',
      '.score-value',
      '.inline-step',
      '.quick-step',
    ]
    for (const fragment of tileFragments) {
      for (const rule of findRules(fragment)) {
        const fontSize = rule.body.match(/font-size:\s*([^;]+);/)?.[1]
        if (!fontSize) continue
        expect(
          fontSize,
          `font-size "${fontSize}" in "${rule.selector}" must not use viewport units — the tile is a container`,
        ).not.toMatch(/[vh]w\b|vmin|vmax/)
      }
    }
  })
})