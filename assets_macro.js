import { eventSource, event_types } from '../../../../script.js';

function replaceMacros(message) {
    const ctx = SillyTavern.getContext();
    if (!ctx.characterId) return;

    const assets = ctx.characters[ctx.characterId]?.data?.extensions?.silly_assets?.asset ?? [];
    if (assets.length === 0) return;

    const macro_regex = /{{asset\s?::?([^}]+)}}/gi;

    if (!macro_regex.test(message.innerHTML)) {
        return;
    }

    const replacedHTML = message.innerHTML.replace(macro_regex, (match, assetName) => {
        const trimmedAssetName = assetName.trim();
        const asset = assets.find(a => a.name === trimmedAssetName && a.type === 'custom');

        if (asset) {
            return asset.uri;
        } else {
            console.warn(`SillyAssets: Asset "${trimmedAssetName}" not found for macro.`);
            return match;
        }
    });

    if (replacedHTML !== message.innerHTML) {
        message.innerHTML = replacedHTML;
    }
}

function handleMacros(messageId = null) {
    if (messageId !== null && messageId !== undefined) {
        const message = document.querySelector(`#chat .mes[mesid="${messageId}"] .mes_text`);
        if (message) replaceMacros(message);
    } else {
        const messages = Array.from(document.querySelectorAll('.mes_text'));
        for (const message of messages) {
            replaceMacros(message);
        }
    }
}

function onMessageRendered(messageId) {
    handleMacros(messageId);
}

export function initializeSillyAssetsMacros() {
    // Initial: process all
    handleMacros();
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, onMessageRendered);
    eventSource.on(event_types.USER_MESSAGE_RENDERED, onMessageRendered);
    eventSource.on(event_types.CHAT_CHANGED, () => handleMacros());
    eventSource.on(event_types.MESSAGE_UPDATED, onMessageRendered);
}
