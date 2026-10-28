// BookLeaf Knowledge Base, split by category so each AI call only receives the
// section it needs (cost control + less noise for the model).

const COMPANY_BRIEF =
  'BookLeaf Publishing is a self-publishing company in India and the US. We handle cover design, ' +
  'typesetting, ISBN assignment, printing, distribution and royalty management. Our in-house printing ' +
  'facility and warehouse are in Delhi; print partners are Repro India and Epitome Books.';

const TONE_GUIDELINES = [
  'Always empathetic and professional. Authors are our partners, not customers to be managed.',
  "Acknowledge the author's concern before jumping to solutions.",
  'Be specific: use actual numbers, dates and statuses from AUTHOR DATA instead of vague reassurances.',
  'If something is BookLeaf\'s fault (delayed royalties, ISBN error), own it directly. No corporate deflection.',
  'If the issue needs escalation or investigation, give a clear timeline (e.g. "Our team will look into this and get back to you within 48 hours"), never open-ended promises.',
  'Always end with a clear next step for the author and/or the BookLeaf team.',
].join('\n');

const POLICY = {
  'Royalty & Payments': [
    '- Royalty split is 80/20: 80% of net profit per book goes to the author, 20% to BookLeaf.',
    '- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart) and shipping charges.',
    '- Royalties are calculated quarterly and paid within 45 days of the quarter ending.',
    '- Minimum payout threshold is Rs 1,000. Below that, royalties roll over to the next quarter.',
    '- Payouts are bank transfers to the account linked in the author dashboard (check bank details are linked).',
    '- Authors can see a detailed royalty breakdown with per-platform sales in their dashboard; we can also share a line-by-line breakdown.',
    '- If a payment is genuinely overdue, escalate with a 48-hour resolution timeline.',
  ].join('\n'),

  'ISBN & Metadata Issues': [
    '- Every book gets a unique ISBN assigned by BookLeaf, registered under the BookLeaf publisher imprint.',
    '- An ISBN under the author\'s own imprint must be obtained by the author independently.',
    '- ISBN errors (duplicate, wrong book linked, mismatch between platform and physical copy) are HIGH priority and escalated to the production team immediately, with a 48-hour resolution timeline.',
    '- Metadata updates (e.g. description) can be submitted via the dashboard or by emailing the BookLeaf team; they reflect on platforms in 3-5 business days.',
  ].join('\n'),

  'Printing & Quality': [
    '- In-house printing handles most orders; overflow or specific formats go to Repro India or Epitome Books.',
    '- Standard print turnaround is 5-7 business days from order confirmation.',
    '- For quality issues (misprints, binding defects, colour inconsistency) BookLeaf arranges a FREE reprint after verification.',
    '- The author may need to share photos of the defective copy. Reprint timeline: 5-7 business days.',
  ].join('\n'),

  'Distribution & Availability': [
    '- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK and the BookLeaf Store.',
    '- New listings typically go live within 7-10 business days after publication is complete.',
    '- A book showing as unavailable on a platform usually means a stock sync issue; the team can trigger a re-sync, which takes 24-48 hours.',
  ].join('\n'),

  'Book Status & Production Updates': [
    '- Production stages in order: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.',
    '- Authors are emailed at each stage.',
    '- Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).',
    '- If delayed, be honest about why, give a specific updated timeline, and never blame the author even if the delay is on their side; frame it collaboratively.',
  ].join('\n'),

  'General Inquiry': [
    '- BookLeaf offers two packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid, with marketing and distribution add-ons).',
    '- Metadata updates (e.g. updating a live book description) can be submitted via the dashboard or by emailing the BookLeaf team; changes reflect on platforms in 3-5 business days.',
    '- If you are unsure of an answer, say the team will confirm and give a timeline rather than guessing.',
  ].join('\n'),
};

// One short calibration example per category (tone and structure only).
const EXAMPLES = {
  'Royalty & Payments': {
    query: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
    reply:
      "Dear Ananya,\n\nI understand how frustrating it is to wait on royalties, and I'm sorry for the worry. Here is where things stand: royalties are calculated quarterly and paid within 45 days of the quarter ending, and your pending balance is Rs 2,546. We'll confirm today that your bank details are linked so the next transfer isn't held up. If anything is overdue on our side, we will fix it, and our team will get back to you within 48 hours.\n\nNext step: please confirm your bank details in your dashboard.\n\nWarm regards,\nBookLeaf Support Team",
  },
  'ISBN & Metadata Issues': {
    query: 'My book is showing a different ISBN on Amazon than what is on the physical copy.',
    reply:
      "Dear Rohit,\n\nThank you for flagging this. An ISBN mismatch is a serious data issue and we are treating it as high priority. I'm escalating it to our production team right now, and you will hear back from us within 48 hours with a resolution.\n\nNext step: if you can, send us a photo of the ISBN on your physical copy and the Amazon listing link so the team can fix the right record.\n\nWarm regards,\nBookLeaf Support Team",
  },
  'Printing & Quality': {
    query: 'I received my author copies and the print quality is terrible. Images are blurry and pages are misaligned.',
    reply:
      "Dear Meera,\n\nI'm truly sorry your author copies arrived like this; that is not the standard we hold ourselves to. Once we verify the issue, we will arrange a free reprint, which takes 5-7 business days.\n\nNext step: please reply with photos of the blurry images and the misaligned pages, and we'll start the verification straight away.\n\nWarm regards,\nBookLeaf Support Team",
  },
  'Distribution & Availability': {
    query: 'My book is published but it is showing as "Currently Unavailable" on Amazon.',
    reply:
      "Dear Vikram,\n\nThanks for letting us know, and sorry for the inconvenience. This is typically a stock sync issue. I'm asking our distribution team to trigger a re-sync now, and the listing should be live again within 24-48 hours.\n\nNext step: we'll confirm once it's back, and please tell us if it still shows unavailable after 48 hours.\n\nWarm regards,\nBookLeaf Support Team",
  },
  'Book Status & Production Updates': {
    query: "It's been 3 weeks and my book is still in typesetting. When will it be done?",
    reply:
      "Dear Kavita,\n\nThank you for checking in; I know the wait feels long. Your book is currently in Typesetting. We're working through the layout and will share the proofs with you shortly so we can move forward together. Our team will send you a confirmed completion date within 48 hours.\n\nNext step: watch your inbox for the proofs, and reply with any changes.\n\nWarm regards,\nBookLeaf Support Team",
  },
  'General Inquiry': {
    query: 'Can I update the description of my book on Amazon after it is already live?',
    reply:
      "Dear Diya,\n\nYes, you can. Metadata updates can be submitted through your dashboard or by emailing the BookLeaf team, and changes typically reflect on the platforms within 3-5 business days.\n\nNext step: send us the new description and we'll submit it for you.\n\nWarm regards,\nBookLeaf Support Team",
  },
};

module.exports = { COMPANY_BRIEF, TONE_GUIDELINES, POLICY, EXAMPLES };