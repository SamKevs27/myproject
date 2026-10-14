// The formal, minimalist page lives at "/"; the neon "fun" version at FUN_PATH.
export const FUN_PATH = '/fun'

export const funSection = (id) => (id ? `${FUN_PATH}#${id}` : FUN_PATH)
