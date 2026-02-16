
/**
 * DEPRECATED: Gemini API Service
 * All game content is now served locally to ensure 100% offline support
 * and security for open-web hosting environments.
 */
export const fetchDailyRiddle = async () => {
  return {
    riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?",
    answer: "KEYBOARD",
    hint: "You are likely using one right now to access this terminal."
  };
};
