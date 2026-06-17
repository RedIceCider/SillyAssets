// Asset Manager functionality for SillyAssets Extension

import { applyChatAvatar } from './chat-avatar.js';

/**
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Saves all assets from the current popup
 */
export async function saveAllAssets() {
    try {
        const ctx = getContext();
        const { characterId, characters, writeExtensionField } = ctx;
        const char = characters[characterId];
        const altGreetings = char.data.alternate_greetings || [];

        const allAssets = [];

        // Save greeting assets
        for (let i = 0; i <= altGreetings.length; i++) {
            const urlInput = document.getElementById(`sa-url-${i}`);
            if (urlInput instanceof HTMLInputElement && urlInput.value.trim()) {
                const uri = urlInput.value.trim();
                const ext = getExtensionFromURI(uri);

                allAssets.push({
                    type: 'alt-greeting',
                    uri,
                    name: String(i),
                    ext,
                });
            }
        }

        // Save custom assets
        document.querySelectorAll('.sa-block--custom').forEach((block) => {
            const nameInput = block.querySelector('.sa-name-input');
            const urlInput = block.querySelector('.sa-url-input');

            if (
                nameInput instanceof HTMLInputElement &&
                urlInput instanceof HTMLInputElement &&
                nameInput.value.trim() &&
                urlInput.value.trim()
            ) {
                const name = nameInput.value.trim();
                const uri = urlInput.value.trim();
                const ext = getExtensionFromURI(uri);

                allAssets.push({
                    type: 'custom',
                    uri,
                    name,
                    ext,
                });
            }
        });

        // Write all assets at once
        await writeExtensionField(characterId, 'silly_assets', { asset: allAssets });

        toastr.success(`SillyAssets: Saved ${allAssets.length} assets successfully.`);

        // Apply greeting avatar if we're in a chat with greeting assets
        if (ctx.chat.length !== 1) {
            const currentGreetingIndex = getCurrentGreetingIndex();
            if (currentGreetingIndex !== null) {
                applyGreetingAvatar(currentGreetingIndex);
            }
        }
    } catch (err) {
        console.error('SillyAssets: saveAllAssets error', err);
        toastr.error('SillyAssets: Failed to save assets.');
    }
}

/**
 * Saves a single greeting asset
 * @param {number} index - The greeting index
 * @param {string} uri - The asset URI
 * @param {string} ext - The file extension
 */
export function saveGreetingAsset(index, uri, ext = 'png') {
    try {
        const ctx = getContext();
        const { characterId, characters, writeExtensionField } = ctx;
        const char = characters[characterId];

        const asset = {
            type: 'alt-greeting',
            uri,
            name: String(index),
            ext,
        };

        const existingAssets = char.data.extensions?.silly_assets?.asset || [];
        const updatedAssets = existingAssets.filter(
            (a) => !(a.name === asset.name && a.type === asset.type)
        );
        updatedAssets.push(asset);

        writeExtensionField(characterId, 'silly_assets', { asset: updatedAssets });

        toastr.success('SillyAssets: Greeting asset saved.');
    } catch (err) {
        console.error('SillyAssets: saveGreetingAsset error', err);
        toastr.error('SillyAssets: Failed to save asset.');
    }
}

/**
 * Applies a greeting avatar based on the current greeting index
 * @param {number} index - The greeting index
 */
export function applyGreetingAvatar(index) {
    const ctx = getContext();
    const { characterId, characters } = ctx;
    const assets = characters[characterId].data.extensions?.silly_assets?.asset || [];
    const asset = assets.find((a) => a.name === String(index) && a.type === 'alt-greeting');

    if (asset) {
        applyChatAvatar(asset.uri);
    }
}

/**
 * Gets the current greeting index from the chat
 * @returns {number|null} The current greeting index or null
 */
export function getCurrentGreetingIndex() {
    const ctx = getContext();
    if (ctx.chat.length === 0) return null;

    const firstMessage = ctx.chat[0];
    if (firstMessage && firstMessage.is_user === false) {
        return firstMessage.swipe_id || 0;
    }

    return null;
}

/**
 * Gets the file extension from a URI
 * @param {string} uri - The URI to extract extension from
 * @returns {string} The file extension
 */
export function getExtensionFromURI(uri) {
    try {
        const match = uri.match(/^data:image\/(.*?);/) || uri.match(/\.(\w{3,4})(\?|$)/);
        return match ? match[1] : 'png';
    } catch {
        return 'png';
    }
}

/**
 * Reads a file as a data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} Promise that resolves to the data URL
 */
export function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target.result;
            if (typeof result === 'string') {
                resolve(result);
            } else {
                reject(new Error('SillyAssets: Failed to read file as data URL'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

let maybeAutoApplyGreetingAvatarHandler = null;

/**
 * Automatically applies greeting avatar when appropriate
 */
export function maybeAutoApplyGreetingAvatar() {
    const ctx = getContext();
    const { eventSource, event_types } = ctx;
    if (ctx.chat.length !== 1) return;

    const assets = ctx.characters[ctx.characterId].data?.extensions?.silly_assets?.asset || [];

    if (!assets.some((a) => a.type === 'alt-greeting')) return;

    // Cleanup any previous handler before assigning a new one
    if (maybeAutoApplyGreetingAvatarHandler) {
        eventSource.removeListener(event_types.MESSAGE_SENT, maybeAutoApplyGreetingAvatarHandler);
        eventSource.removeListener(event_types.CHAT_CHANGED, cleanupGreetingAvatarHandler);
    }

    maybeAutoApplyGreetingAvatarHandler = () => {
        const freshCtx = getContext();
        const swipeId = freshCtx.chat[0]?.swipe_id ?? 0;
        const asset = assets.find((a) => a.name === String(swipeId) && a.type === 'alt-greeting');
        if (asset) applyChatAvatar(asset.uri);

        eventSource.removeListener(event_types.MESSAGE_SENT, maybeAutoApplyGreetingAvatarHandler);
        eventSource.removeListener(event_types.CHAT_CHANGED, cleanupGreetingAvatarHandler);
        maybeAutoApplyGreetingAvatarHandler = null;
    };

    function cleanupGreetingAvatarHandler() {
        if (maybeAutoApplyGreetingAvatarHandler) {
            eventSource.removeListener(
                event_types.MESSAGE_SENT,
                maybeAutoApplyGreetingAvatarHandler
            );
            maybeAutoApplyGreetingAvatarHandler = null;
        }
        eventSource.removeListener(event_types.CHAT_CHANGED, cleanupGreetingAvatarHandler);
    }

    eventSource.on(event_types.MESSAGE_SENT, maybeAutoApplyGreetingAvatarHandler);
    eventSource.on(event_types.CHAT_CHANGED, cleanupGreetingAvatarHandler);
}
