// Minimal mock of milo's libs/utils/decorate.js for unit tests.
// decorateButtonsDeprecated dynamically imports this module; the real
// decorateButtons() is never invoked for blocks scoped out of it
// (.ax-columns, .banner, .fullscreen-marquee, .link-list), so a no-op
// is enough to let the import resolve.
// eslint-disable-next-line import/prefer-default-export
export function decorateButtons() {}
