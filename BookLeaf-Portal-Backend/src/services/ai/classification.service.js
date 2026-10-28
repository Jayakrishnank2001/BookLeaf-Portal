const { z } = require('zod');
const { generate } = require('./aiClient');
const { buildClassificationPrompt } = require('./promptBuilder');
const { CATEGORIES, PRIORITIES } = require('../../config/constants');

// Never trust model output: validate against our enums before it touches the database.
const resultSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  reasoning: z.string().trim().max(300).catch(''),
});

// Models sometimes wrap JSON in ```json fences even when told not to.
const stripFences = (text) => text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

/**
 * One small LLM call (no knowledge base, no author data, no history).
 * @returns {Promise<{category: string, priority: string, reasoning: string}>}
 * @throws {AiUnavailableError} for provider problems, or Error for unparseable output
 */
async function classifyTicket(ticket) {
  const { system, prompt } = buildClassificationPrompt(ticket);
  const raw = await generate({ system, prompt, json: true, maxOutputTokens: 200, temperature: 0 });

  let parsed;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new Error('AI returned non-JSON classification');
  }
  return resultSchema.parse(parsed);
}

module.exports = { classifyTicket };