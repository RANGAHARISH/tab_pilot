// Content script bridge for TabPilot web dashboard (localhost and vercel.app)
// Relays tab requests to the extension background service worker

(() => {
  if (typeof window === 'undefined') return;

  // Listen for requests from the TabPilot web page
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'TABPILOT_WEB_PAGE') {
      return;
    }

    const { action, payload, requestId } = event.data;

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: action, payload }, (response) => {
          window.postMessage(
            {
              source: 'TABPILOT_EXTENSION_BRIDGE',
              requestId,
              response,
            },
            '*'
          );
        });
      }
    } catch {
      window.postMessage(
        {
          source: 'TABPILOT_EXTENSION_BRIDGE',
          requestId,
          error: 'Extension communication error',
        },
        '*'
      );
    }
  });

  // Announce bridge presence to the page
  window.postMessage(
    {
      source: 'TABPILOT_EXTENSION_BRIDGE',
      event: 'READY',
      version: '1.0.0',
    },
    '*'
  );
})();
