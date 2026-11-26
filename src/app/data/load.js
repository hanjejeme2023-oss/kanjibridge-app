export function loadData() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/app/data.js';
    script.onload = () => window.KB_DATA ? resolve() : reject(new Error('KB_DATA failed to load'));
    script.onerror = () => reject(new Error('KB_DATA failed to load'));
    document.body.appendChild(script);
  });
}
