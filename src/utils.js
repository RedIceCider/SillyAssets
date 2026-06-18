/**
 * Get the SillyTavern context.
 * @returns {any}
 */
export const getContext = () => SillyTavern.getContext();

/**
 * Gets a chat-specific variable.
 * @param {string} name - Variable name
 * @returns {any}
 */
export const getChatVar = (name) => getContext().chatMetadata?.variables?.[name];

/**
 * Sets a chat-specific variable.
 * @param {string} name - Variable name
 * @param {any} value - Value to set
 */
export const setChatVar = (name, value) => {
    const ctx = getContext();
    if (!ctx.chatMetadata) ctx.chatMetadata = {};
    if (!ctx.chatMetadata.variables) ctx.chatMetadata.variables = {};
    ctx.chatMetadata.variables[name] = value;
};
