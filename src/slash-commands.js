// Slash Commands for SillyAssets Extension

import { SlashCommand } from '../../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument } from '../../../../slash-commands/SlashCommandArgument.js';
import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
import { saveGreetingAsset, getExtensionFromURI } from './asset-manager.js';
import { getLocalVariable } from '../../../../variables.js';
import { applyChatAvatar, applyUserAvatar } from './chat-avatar.js';

/**
 * Get the SillyTavern context.
 * @returns {any}
 */
const getContext = () => SillyTavern.getContext();

/**
 * Registers all slash commands for the SillyAssets extension
 */
export function registerSlashCommands() {
    // Register the sa-add-alt command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'sa-add-alt',
        aliases: [],
        callback: (_, arg) => {
            const [indexStr, url] = String(arg).split(/\s+/);
            const index = parseInt(indexStr, 10);
            if (!url || isNaN(index)) {
                toastr.error('SillyAssets: Usage: /sa-add-alt <index> <image_url>');
                return 'Usage: /sa-add-alt <index> <image_url>';
            }

            saveGreetingAsset(index, url, getExtensionFromURI(url));
            toastr.success('SillyAssets: Greeting asset added successfully.');
            return '';
        },
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({ description: 'Greeting index', typeList: [ARGUMENT_TYPE.NUMBER], isRequired: true }),
            SlashCommandArgument.fromProps({ description: 'Image URL', typeList: [ARGUMENT_TYPE.STRING], isRequired: true }),
        ],
        helpString: `
            <div>
                Adds a greeting avatar for a specific index.<br/><br/>
                <strong>Usage:</strong><br/>
                <code>/sa-add-alt 1 https://example.com/image.png</code>
            </div>
        `,
    }));

    // Register the chat-avatar command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'chat-avatar',
        callback: async (_, arg) => {
            try {
                console.log('SillyAssets: /chat-avatar command triggered');
                if (!arg) {
                    const existing = getLocalVariable('sma-avatar');
                    if (!existing) {
                        toastr.info('SillyAssets: No temporary avatar set for the current chat.');
                        return '';
                    }
                    toastr.info(`SillyAssets: Current temporary avatar: ${existing}`);
                    const existingStr = existing.toString();
                    if (existingStr.startsWith('data:')) {
                        return existingStr;
                    }
                    
                    // @ts-ignore
                    return getContext().substituteParams(existingStr);
                }

                console.log('SillyAssets: /chat-avatar applying new temporary avatar.');
                const rawUrl = String(arg);
                applyChatAvatar(rawUrl);
                toastr.success('SillyAssets: Temporary chat avatar applied.');
                if (rawUrl.startsWith('data:')) {
                    return rawUrl;
                }
                
                // @ts-ignore
                return getContext().substituteParams(rawUrl);
            } catch (error) {
                toastr.error('SillyAssets: An unexpected error occurred.');
                console.error('SillyAssets: /chat-avatar unexpected error:', error);
            }
            return '';
        },
        returns: 'Current chat avatar, if any.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'URL to image; local or remote.',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: `<div>
            Temporarily changes the current char's avatar with provided image URL. Returns current temp avatar if no argument is passed.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/chat-avatar https://example.com/my-avatar.png</code></pre>
                </li>
            </ul>
        </div>`,
    }));

    // Register the user-avatar command
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'user-avatar',
        callback: async (_, arg) => {
            try {
                console.log('SillyAssets: /user-avatar command triggered');
                if (!arg) {
                    const existing = getLocalVariable('sma-user-avatar');
                    if (!existing) {
                        toastr.info('SillyAssets: No temporary user avatar set for the current chat.');
                        return '';
                    }
                    toastr.info(`SillyAssets: Current temporary user avatar: ${existing}`);
                    const existingStr = existing.toString();
                    if (existingStr.startsWith('data:')) {
                        return existingStr;
                    }
                    
                    // @ts-ignore
                    return getContext().substituteParams(existingStr);
                }

                console.log('SillyAssets: /user-avatar applying new temporary user avatar.');
                const rawUrl = String(arg);
                applyUserAvatar(rawUrl);
                toastr.success('SillyAssets: Temporary user avatar applied.');
                if (rawUrl.startsWith('data:')) {
                    return rawUrl;
                }
                
                // @ts-ignore
                return getContext().substituteParams(rawUrl);
            } catch (error) {
                toastr.error('SillyAssets: An unexpected error occurred.');
                console.error('SillyAssets: /user-avatar unexpected error:', error);
            }
            return '';
        },
        returns: 'Current user avatar, if any.',
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'URL to image; local or remote.',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: true,
            }),
        ],
        helpString: `<div>
            Temporarily changes the user's avatar in the current chat with provided image URL. Returns current temp user avatar if no argument is passed.
        </div>
        <div>
            <strong>Example:</strong>
            <ul>
                <li>
                    <pre><code class="language-stscript">/user-avatar https://example.com/user-avatar.png</code></pre>
                </li>
            </ul>
        </div>`,
    }));
}
