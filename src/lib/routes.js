// "/" is the view chooser; the portfolio itself comes in three views.
export const FORMAL_PATH = '/formal'
export const FUN_PATH = '/fun'
export const JOURNEY_PATH = '/journey'

export const pathFor = (mode) => (mode === 'formal' ? FORMAL_PATH : FUN_PATH)
export const sectionHref = (mode, id) => (id ? `${pathFor(mode)}#${id}` : pathFor(mode))
