(function () {
    function init() {
        const containers = document.querySelectorAll('.modulo-checkout');
        containers.forEach(container => {
            if (container.getAttribute('data-loaded')) return;
            const orderId = container.getAttribute('data-order-id');
            if (!orderId) return;

            const iframe = document.createElement('iframe');

            // Detect origin from script tag
            let origin = '';
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src && scripts[i].src.includes('widget.js')) {
                    try {
                        const url = new URL(scripts[i].src);
                        origin = url.origin;
                        break;
                    } catch (e) { }
                }
            }
            // Fallback if running locally/relative
            if (!origin) origin = window.location.origin;

            iframe.src = `${origin}/embed/checkout/${orderId}`;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.minHeight = '600px';
            iframe.style.border = 'none';
            iframe.style.overflow = 'hidden';
            iframe.style.background = 'transparent';

            container.innerHTML = '';
            container.appendChild(iframe);
            container.setAttribute('data-loaded', 'true');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
