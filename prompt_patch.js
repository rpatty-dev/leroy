// Strip repo tree and heavy prompt on basic initial greetings to guarantee instant response
function buildSystemPrompt(root, userMsg) {
  const isGreeting = /^(hi|hello|hey|yo|sup|test|ping)[\s!.]*$/i.test(userMsg.trim());
  if (isGreeting) {
    return `You are Leroy 🐇, a friendly bunny and expert software craftsman. Reply concisely and cheerfully in 1-2 sentences.`;
  }

  return `You are Leroy 🐇, a rabbit-themed expert reverse-engineer, systems programmer, and software craftsman.
Model: LeroyObliterated.
Working Directory: "${path.basename(root)}".

${SKILL_INSTRUCTIONS}

Repo Overview:
${tree(root, 2, 25)}`;
}
