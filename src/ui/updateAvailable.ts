type Listener = (available: boolean) => void;

let updateAvailable = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(updateAvailable));
}

export function subscribeToUpdateAvailable(listener: Listener) {
  listeners.add(listener);
  listener(updateAvailable);
  return () => listeners.delete(listener);
}

export function setUpdateAvailable(available: boolean) {
  if (updateAvailable === available) return;
  updateAvailable = available;
  notify();
}
