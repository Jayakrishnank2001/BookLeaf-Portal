// The ONLY file that talks to the LLM provider. Swapping providers means editing this file only.
// Responsibilities: key from env, timeout, one retry on transient errors, uniform error type.
const { GoogleGenAI } = require('@google/genai');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Thrown for ANY AI failure (no key, timeout, rate limit, provider error, empty output).
// Callers catch this and degrade gracefully; if it escapes to the API layer it becomes a 503.
class AiUnavailableError extends AppError {
  constructor(reason, message = 'AI assistance is unavailable right now. You can continue manually.') {
    super(message, 503, 'AI_UNAVAILABLE');
    this.reason = reason; // NO_API_KEY | TIMEOUT | RATE_LIMITED | PROVIDER_ERROR | EMPTY_RESPONSE
  }
}

let client = null;
function getClient() {
  if (!env.geminiApiKey) throw new AiUnavailableError('NO_API_KEY');
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

// Gemini 2.5 models "think" by default, which costs tokens and latency we don't need
// for classification/drafting. A budget of 0 turns it off. Only applied where supported.
const thinkingConfig = /2\.5/.test(env.aiModel) ? { thinkingConfig: { thinkingBudget: 0 } } : {};

async function callOnce({ system, prompt, json, maxOutputTokens, temperature }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const response = await getClient().models.generateContent({
      model: env.aiModel,
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature,
        maxOutputTokens,
        abortSignal: controller.signal,
        ...(json && { responseMimeType: 'application/json' }),
        ...thinkingConfig,
      },
    });
    const text = (response.text || '').trim();
    if (!text) throw new AiUnavailableError('EMPTY_RESPONSE');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function toAiError(err) {
  if (err instanceof AiUnavailableError) return err;
  if (err.name === 'AbortError' || /abort/i.test(err.message || '')) return new AiUnavailableError('TIMEOUT');
  if (err.status === 429) return new AiUnavailableError('RATE_LIMITED');
  return new AiUnavailableError('PROVIDER_ERROR');
}

const isTransient = (err) => err.status === 429 || err.status >= 500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {object} opts
 * @param {string} opts.system  system instruction
 * @param {string} opts.prompt  user content
 * @param {boolean} [opts.json] request JSON output
 * @param {number} [opts.maxOutputTokens] hard cap on output cost
 * @param {number} [opts.temperature]
 * @returns {Promise<string>} raw model text
 */
async function generate({ system, prompt, json = false, maxOutputTokens = 512, temperature = 0.3 }) {
  const opts = { system, prompt, json, maxOutputTokens, temperature };
  try {
    return await callOnce(opts);
  } catch (firstErr) {
    // Retry once, only for rate limits / 5xx. Timeouts and config errors are not retried.
    if (!isTransient(firstErr)) throw toAiError(firstErr);
    logger.warn(`AI transient error (${firstErr.status}), retrying once`);
    await sleep(800);
    try {
      return await callOnce(opts);
    } catch (secondErr) {
      throw toAiError(secondErr);
    }
  }
}

module.exports = { generate, AiUnavailableError };