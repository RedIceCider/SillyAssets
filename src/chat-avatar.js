import { getLocalVariable, setLocalVariable } from '../../../../variables.js';
import { resolveSillyAssetMacros } from './assets-macro.js';

/**
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Gets the parsed avatar URL for a given variable.
 * @param {string} varName - The local variable name
 * @returns {string|null}
 */
function getParsedAvatarUrl(varName) {
    const rawUrl = getLocalVariable(varName);
    if (!rawUrl) return null;
    const urlString = rawUrl.toString();
    if (urlString.startsWith('data:')) {
        return urlString;
    }
    
    // Resolve standard ST macros
    // @ts-ignore
    return getContext().substituteParams(urlString);
}

/**
 * Updates avatars in the chat DOM.
 * @param {string} selector - CSS selector for the message elements
 * @param {string} varName - Local variable name containing the URL
 * @param {number|null} messageId - Optional specific message ID
 */
function updateAvatarsInDom(selector, varName, messageId = null) {
    const src = getParsedAvatarUrl(varName);
    if (!src) return;

    if (messageId !== null && messageId !== undefined) {
        const avatar = document.querySelector(`#chat .mes[mesid="${messageId}"]${selector} .avatar img`);
        if (avatar && avatar instanceof HTMLImageElement && avatar.src !== src) {
            avatar.src = src;
        }
    } else {
        const avatars = document.querySelectorAll(`.mes${selector} .avatar img`);
        for (const avatar of avatars) {
            if (avatar instanceof HTMLImageElement && avatar.src !== src) {
                avatar.src = src;
            }
        }
    }
}

function updateChatAvatars(messageId = null) {
    // Update Character Avatars
    updateAvatarsInDom(':not([is_user="true"]):not([is_system="true"])', 'sma-avatar', messageId);
    // Update User Avatars
    updateAvatarsInDom('[is_user="true"]', 'sma-user-avatar', messageId);
    
    console.log('SillyAssets: chat avatars updated');
}

const updateAvatars = (messageId) => updateChatAvatars(messageId);

function updateLastChatAvatars() {
    // Update Character
    const charSrc = getParsedAvatarUrl('sma-avatar');
    if (charSrc) {
        const avatars = document.querySelectorAll('.mes:not([is_user="true"]):not([is_system="true"]) .avatar img');
        if (avatars.length > 0) {
            const lastAvatar = avatars[avatars.length - 1];
            if (lastAvatar instanceof HTMLImageElement && lastAvatar.src !== charSrc) {
                lastAvatar.src = charSrc;
            }
        }
    }
    // Update User
    const userSrc = getParsedAvatarUrl('sma-user-avatar');
    if (userSrc) {
        const avatars = document.querySelectorAll('.mes[is_user="true"] .avatar img');
        if (avatars.length > 0) {
            const lastAvatar = avatars[avatars.length - 1];
            if (lastAvatar instanceof HTMLImageElement && lastAvatar.src !== userSrc) {
                lastAvatar.src = userSrc;
            }
        }
    }
    console.log('SillyAssets: last chat avatars updated');
}

let allowStreamAvatarUpdate = true;

function handleStreamTokenReceived() {
    if (!allowStreamAvatarUpdate) return;
    updateLastChatAvatars();
    allowStreamAvatarUpdate = false;
    const resetListener = () => {
        allowStreamAvatarUpdate = true;
        getContext().eventSource.removeListener(getContext().event_types.CHARACTER_MESSAGE_RENDERED, resetListener);
    };
    getContext().eventSource.on(getContext().event_types.CHARACTER_MESSAGE_RENDERED, resetListener);
}

function restoreAvatarListener() {
    const charSrc = getLocalVariable('sma-avatar');
    const userSrc = getLocalVariable('sma-user-avatar');
    
    if (charSrc || userSrc) {
        const { eventSource, event_types } = getContext();
        console.log('SillyAssets: Temporary avatars found, restoring listeners.');
        
        // Clean up to prevent duplicates
        eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
        eventSource.removeListener(event_types.USER_MESSAGE_RENDERED, updateAvatars);
        eventSource.removeListener(event_types.MESSAGE_UPDATED, updateAvatars);
        eventSource.removeListener(event_types.MESSAGE_SWIPED, updateAvatars);
        eventSource.removeListener(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
        
        // Register all rendering/update events
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
        eventSource.on(event_types.USER_MESSAGE_RENDERED, updateAvatars);
        eventSource.on(event_types.MESSAGE_UPDATED, updateAvatars);
        eventSource.on(event_types.MESSAGE_SWIPED, updateAvatars);
        eventSource.on(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
        
        updateChatAvatars();
    }
}

function fixZoomedAvatar() {
    if (window._sillyAssetsZoomObserver) {
        window._sillyAssetsZoomObserver.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (!mutation.addedNodes.length) continue;
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node instanceof Element && node.classList.contains('zoomed_avatar')) {
                    const imgElement = node.querySelector('.zoomed_avatar_img');
                    if (!imgElement || !(imgElement instanceof HTMLImageElement)) return;

                    const charUrl = getParsedAvatarUrl('sma-avatar');
                    const userUrl = getParsedAvatarUrl('sma-user-avatar');
                    const currentSrc = imgElement.getAttribute('src');
                    
                    if (charUrl && currentSrc && (currentSrc.startsWith('/characters/http') || currentSrc.includes('default_avatar.png'))) {
                         console.log('SillyAssets: Fixing zoomed character avatar src.');
                         imgElement.src = charUrl;
                         imgElement.setAttribute('data-izoomify-url', charUrl);
                    }
                    if (userUrl && currentSrc && currentSrc.includes('User%20Avatars')) {
                         console.log('SillyAssets: Fixing zoomed user avatar src.');
                         imgElement.src = userUrl;
                         imgElement.setAttribute('data-izoomify-url', userUrl);
                    }
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    window._sillyAssetsZoomObserver = observer;
}

export function applyChatAvatar(url) {
    if (!url) return;
    console.log('SillyAssets: Applying new temporary character avatar.');
    setLocalVariable('sma-avatar', url);
    restoreAvatarListener();
}

export function applyUserAvatar(url) {
    if (!url) return;
    console.log('SillyAssets: Applying new temporary user avatar.');
    setLocalVariable('sma-user-avatar', url);
    restoreAvatarListener();
}

export function initChatAvatar() {
    const { eventSource, event_types } = getContext();
    restoreAvatarListener();
    eventSource.on(event_types.CHAT_CHANGED, restoreAvatarListener);
    fixZoomedAvatar();
}
