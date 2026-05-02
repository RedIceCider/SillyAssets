import { event_types, eventSource } from '../../../../script.js';
import { getLocalVariable, setLocalVariable } from '../../../variables.js';

function getParsedAvatarUrl() {
    const rawUrl = getLocalVariable('sma-avatar');
    if (!rawUrl) return null;
    const urlString = rawUrl.toString();
    // If it's a data URL, it's likely a base64 image and shouldn't contain macros.
    if (urlString.startsWith('data:')) {
        return urlString;
    }
    // @ts-ignore
    return SillyTavern.getContext().substituteParams(urlString);
}

function updateChatAvatars(messageId = null) {
    const src = getParsedAvatarUrl();
    if (!src) return;

    if (messageId !== null && messageId !== undefined) {
        const avatar = document.querySelector(`#chat .mes[mesid="${messageId}"] .avatar img`);
        if (avatar && avatar instanceof HTMLImageElement) {
            avatar.src = src;
        }
    } else {
        const avatars = document.querySelectorAll('.mes:not([is_user="true"]):not([is_system="true"]) .avatar img');
        for (const avatar of avatars) {
            if (avatar instanceof HTMLImageElement) {
                avatar.src = src;
            }
        }
    }

    console.log('SillyAssets: chat avatar updated');
}

const updateAvatars = (messageId) => updateChatAvatars(messageId);

function updateLastChatAvatar() {
    const src = getParsedAvatarUrl();
    if (!src) return;

    const avatars = document.querySelectorAll('.mes:not([is_user="true"]):not([is_system="true"]) .avatar img');
    if (avatars.length > 0) {
        const lastAvatar = avatars[avatars.length - 1];
        if (lastAvatar instanceof HTMLImageElement) {
            lastAvatar.src = src;
        }
    }
    console.log('SillyAssets: last chat avatar updated');
}

let allowStreamAvatarUpdate = true;

function handleStreamTokenReceived() {
    if (!allowStreamAvatarUpdate) return;
    updateLastChatAvatar();
    allowStreamAvatarUpdate = false;
    // Set up a one-time listener to re-enable updates after the next message is rendered
    const resetListener = () => {
        allowStreamAvatarUpdate = true;
        eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, resetListener);
    };
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, resetListener);
}

function restoreAvatarListener() {
    const src = getParsedAvatarUrl();
    if (src) {
        console.log('SillyAssets: Chat avatar found, restoring listener.');
        eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
        eventSource.removeListener(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
        eventSource.on(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
        updateChatAvatars();
    }
}

function fixZoomedAvatar() {
    // @ts-ignore
    if (window._sillyAssetsZoomObserver) {
        // @ts-ignore
        window._sillyAssetsZoomObserver.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (!mutation.addedNodes.length) continue;
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node instanceof Element && node.classList.contains('zoomed_avatar')) {
                    const imgElement = node.querySelector('.zoomed_avatar_img');
                    if (!imgElement || !(imgElement instanceof HTMLImageElement)) return;

                    const customAvatarUrl = getParsedAvatarUrl();
                    if (!customAvatarUrl) return;

                    const src = imgElement.getAttribute('src');
                    if (src && src.startsWith('/characters/http')) {
                        console.log('SillyAssets: Fixing zoomed avatar src.');
                        imgElement.src = customAvatarUrl;
                        imgElement.setAttribute('data-izoomify-url', customAvatarUrl);
                    }
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    // @ts-ignore
    window._sillyAssetsZoomObserver = observer;
}

/**
 * Programmatic API to apply a chat avatar.
 * Call this directly whenever it needs to swap in a new avatar.
 */
export function applyChatAvatar(url) {
    if (!url) return;
    console.log('SillyAssets: Applying new chat avatar.');
    setLocalVariable('sma-avatar', url);
    updateChatAvatars();
    eventSource.removeListener(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
    eventSource.removeListener(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, updateAvatars);
    eventSource.on(event_types.STREAM_TOKEN_RECEIVED, handleStreamTokenReceived);
}

export function initChatAvatar() {
    restoreAvatarListener();
    eventSource.on(event_types.CHAT_CHANGED, restoreAvatarListener);
    fixZoomedAvatar();
}
