/**
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Resolves {{asset::}} macros in a string.
 *
 * NOTE: This uses manual resolution instead of SillyTavern's global macro system.
 * This is INTENTIONAL to keep assets "Visual Only". If registered as a global macro,
 * ST would expand it before building the AI prompt, causing massive prompt pollution
 * if the asset is a base64 string.
 *
 * @param {string} text - The text containing macros
 * @returns {string} The text with resolved asset URIs
 */
export function resolveSillyAssetMacros(text) {
    if (!text || typeof text !== 'string') return text;

    const ctx = getContext();
    if (!ctx.characterId) return text;

    const assets = ctx.characters[ctx.characterId]?.data?.extensions?.silly_assets?.asset ?? [];
    if (assets.length === 0) return text;

    const macro_regex = /{{asset\s?::?([^}]+)}}/gi;

    return text.replace(macro_regex, (match, assetName) => {
        const trimmedAssetName = assetName.trim();
        const asset = assets.find((a) => a.name === trimmedAssetName && a.type === 'custom');

        if (asset) {
            return asset.uri;
        }
        return match;
    });
}

/**
 * Replaces macros in a rendered message element's HTML.
 * This ensures the replacement is purely visual and doesn't affect the prompt.
 */
function replaceMacrosInElement(element) {
    const originalHTML = element.innerHTML;
    const replacedHTML = resolveSillyAssetMacros(originalHTML);

    if (replacedHTML !== originalHTML) {
        element.innerHTML = replacedHTML;
    }
}

function handleMacros(messageId = null) {
    if (messageId !== null && messageId !== undefined) {
        const message = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
        if (message) replaceMacrosInElement(message);
    } else {
        const messages = document.querySelectorAll('.mes_text');
        messages.forEach(replaceMacrosInElement);
    }
}

export function initializeSillyAssetsMacros() {
    const { eventSource, event_types } = getContext();

    // Initial: process existing messages
    handleMacros();

    // Listen for new messages to apply visual-only replacement
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id) => handleMacros(id));
    eventSource.on(event_types.USER_MESSAGE_RENDERED, (id) => handleMacros(id));
    eventSource.on(event_types.CHAT_CHANGED, () => handleMacros());
    eventSource.on(event_types.MESSAGE_UPDATED, (id) => handleMacros(id));

    console.log('SillyAssets: Visual-only {{asset::}} macro handler initialized.');
}
