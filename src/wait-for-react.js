/*global ClientFunction document NodeFilter*/

/*eslint-disable no-unused-vars*/
async function waitForReact (timeout) {
    /*eslint-enable no-unused-vars*/
    const DEFAULT_TIMEOUT = 1e4;
    const checkTimeout    = typeof timeout === 'number' ? timeout : DEFAULT_TIMEOUT;

    await ClientFunction(() => {
    })();

    return ClientFunction(() => {
        const CHECK_INTERVAL = 200;
        let stopChecking     = false;

        function findStaticReact16Root () {
            const treeWalker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, null, false);

            while (treeWalker.nextNode())
                if (treeWalker.currentNode.hasOwnProperty('_reactRootContainer')) return true;

            return false;
        }

        function findReactApp () {
            const isReact15OrStaticRender = !!document.querySelector('[data-reactroot]');
            const isReact16WithHandlers   = !!Object.keys(document).filter(prop => /^_reactListenersID/.test(prop)).length;

            return isReact15OrStaticRender || isReact16WithHandlers || findStaticReact16Root();
        }

        return new Promise((resolve, reject) => {
            function tryFindReactApp () {
                const startTime        = new Date();
                const reactTreeIsFound = findReactApp();
                const checkTime        = new Date() - startTime;

                if (reactTreeIsFound) {
                    resolve();
                    return;
                }

                if (stopChecking) return;

                setTimeout(tryFindReactApp, checkTime > CHECK_INTERVAL ? checkTime : CHECK_INTERVAL);
            }

            tryFindReactApp();

            setTimeout(() => {
                stopChecking = true;

                reject('waitForReact: The waiting timeout is exceeded');
            }, checkTimeout);
        });
    }, { dependencies: { checkTimeout } })();
}
