/**
 * A simple Naive Bayes Classifier in TypeScript.
 * This is "self-contained" and "offline" as requested.
 */

export interface ClassifierResult {
  isSpam: boolean;
  confidence: number;
}

export class SpamClassifier {
  private spamWords: Map<string, number> = new Map();
  private hamWords: Map<string, number> = new Map();
  private spamCount = 0;
  private hamCount = 0;

  constructor() {
    // Seed with some common spam/ham patterns
    this.seed();
  }

  private seed() {
    const spamMessages = [
      "win free money now",
      "urgent action required account locked",
      "congratulations you won a prize",
      "cheap medications online",
      "exclusive offer for you",
      "earn money from home fast",
      "click here to claim your reward",
      "buy bitcoin now and get rich",
      "viagra cialis generic discount",
      "verify your account information immediately",
      "you have a new inheritance waiting",
      "limited time deal buy now",
      "invest in stocks for high returns",
      "get a loan with no credit check",
      "win a brand new iphone",
      "your package is pending delivery click here",
      "subscription expired renew now",
      "dating sites for singles near you",
      "hot girls waiting for you",
      "increase your size naturally",
      "casinos online slots win big",
      "work from home and earn 5000 a month",
      "be your own boss join our team",
    ];

    const hamMessages = [
      "hey what time is the meeting tomorrow?",
      "can you send me that report by Friday?",
      "let's go for coffee this weekend",
      "the weather looks great for the hike",
      "thanks for the help with the project",
      "did you see the new movie yet?",
      "I'll be a bit late for dinner tonight",
      "happy birthday! hope you have a great day",
      "meeting invite for the team sync",
      "please review the attached document",
      "your order has been shipped",
      "let me know when you're free to chat",
      "lunch plans for tomorrow?",
      "attached are the files you requested",
      "see you at the office",
      "had a great time at the party",
      "can we reschedule our call?",
      "the deadline is approaching fast",
      "don't forget to submit your timesheet",
      "good job on the presentation today",
    ];

    spamMessages.forEach(msg => this.train(msg, true));
    hamMessages.forEach(msg => this.train(msg, false));
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  train(text: string, isSpam: boolean) {
    const tokens = this.tokenize(text);
    if (isSpam) {
      this.spamCount++;
      tokens.forEach(token => {
        this.spamWords.set(token, (this.spamWords.get(token) || 0) + 1);
      });
    } else {
      this.hamCount++;
      tokens.forEach(token => {
        this.hamWords.set(token, (this.hamWords.get(token) || 0) + 1);
      });
    }
  }

  classify(text: string): ClassifierResult {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return { isSpam: false, confidence: 1 };

    let spamProb = Math.log(this.spamCount / (this.spamCount + this.hamCount));
    let hamProb = Math.log(this.hamCount / (this.spamCount + this.hamCount));

    const alpha = 1; // Laplace smoothing
    const spamVocabSize = this.spamWords.size;
    const hamVocabSize = this.hamWords.size;

    tokens.forEach(token => {
      const sCount = (this.spamWords.get(token) || 0) + alpha;
      const hCount = (this.hamWords.get(token) || 0) + alpha;

      spamProb += Math.log(sCount / (this.spamCount + spamVocabSize));
      hamProb += Math.log(hCount / (this.hamCount + hamVocabSize));
    });

    const isSpam = spamProb > hamProb;
    
    // Normalize confidence (sigmoid-ish)
    const diff = Math.abs(spamProb - hamProb);
    const confidence = 1 / (1 + Math.exp(-diff / 10));

    return { isSpam, confidence };
  }
}

export const classifier = new SpamClassifier();
