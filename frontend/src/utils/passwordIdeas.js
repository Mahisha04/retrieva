const ADJECTIVES = [
  "Brisk",
  "Calm",
  "Daring",
  "Epic",
  "Golden",
  "Lively",
  "Mystic",
  "Nimble",
  "Quiet",
  "Solar",
  "Stormy",
  "Vivid"
];

const NOUNS = [
  "Aurora",
  "Bridge",
  "Canyon",
  "Harbor",
  "Meadow",
  "Nebula",
  "Orbit",
  "Prairie",
  "Quasar",
  "Summit",
  "Temple",
  "Voyage"
];

const SEPARATORS = ["-", "_", ".", "!", "@"]; // gives variety while staying readable

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const randomNumber = () => Math.floor(100 + Math.random() * 900); // 3-digit number for entropy

const makeSuggestion = () => {
  const adjective = randomFrom(ADJECTIVES);
  const noun = randomFrom(NOUNS);
  const separator = randomFrom(SEPARATORS);
  return `${adjective}${separator}${noun}${separator}${randomNumber()}`;
};

export function generatePasswordIdeas(count = 3) {
  return Array.from({ length: count }, () => makeSuggestion());
}
