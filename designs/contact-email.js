// Keep the address out of static markup and plain-text source. This is a
// small obstacle to basic harvesting, not protection from determined bots.
export function getEmail() {
  return ['eGl1eXU=', 'dS5udXMuZWR1'].map(part => atob(part)).join('@');
}
