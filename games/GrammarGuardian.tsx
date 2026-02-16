import React, { useState, useEffect, useCallback, useRef } from 'react';

const QUESTIONS = [
  { sentence: "They ____ going to the park yesterday.", options: ["were", "was", "are", "be"], answer: "were" },
  { sentence: "She ____ her keys in the car.", options: ["left", "leaved", "leaf", "laved"], answer: "left" },
  { sentence: "Neither of the boys ____ here.", options: ["is", "are", "am", "be"], answer: "is" },
  { sentence: "____ bag is this?", options: ["Whose", "Who's", "Who", "Whom"], answer: "Whose" },
  { sentence: "____ doing a great job!", options: ["You're", "Your", "Yore", "Yours"], answer: "You're" },
  { sentence: "I should have ____ better.", options: ["known", "knew", "knowed", "know"], answer: "known" },
  { sentence: "The building was taller ____ the tree.", options: ["than", "then", "them", "that"], answer: "than" },
  { sentence: "____ important to feed the cat.", options: ["It's", "Its", "Its'", "Is"], answer: "It's" },
  { sentence: "They went ____ the house together.", options: ["into", "in to", "in", "to"], answer: "into" },
  { sentence: "I can't believe it's already ____.", options: ["lost", "loose", "lose", "loss"], answer: "lose" },
  { sentence: "____ going to the concert tonight.", options: ["They're", "There", "Their", "Theirs"], answer: "They're" },
  { sentence: "He is the person ____ I met at the party.", options: ["whom", "who", "whose", "which"], answer: "whom" },
  { sentence: "Every one of the cookies ____ delicious.", options: ["is", "are", "was", "were"], answer: "is" },
  { sentence: "The group ____ decided on a plan.", options: ["has", "have", "had", "having"], answer: "has" },
  { sentence: "I feel ____ today about the mistake.", options: ["bad", "badly", "worse", "worst"], answer: "bad" },
  { sentence: "She plays the piano ____.", options: ["well", "good", "better", "best"], answer: "well" },
  { sentence: "This is between you and ____.", options: ["me", "I", "my", "mine"], answer: "me" },
  { sentence: "The cat licked ____ paws.", options: ["its", "it's", "it", "its'"], answer: "its" },
  { sentence: "I ____ finished my homework already.", options: ["have", "has", "had", "having"], answer: "have" },
  { sentence: "None of the students ____ the answer.", options: ["know", "knows", "knowing", "known"], answer: "knows" },
  { sentence: "I will ____ the book on the table.", options: ["lay", "lie", "laid", "lain"], answer: "lay" },
  { sentence: "He has ____ in that bed for hours.", options: ["lain", "laid", "lay", "lied"], answer: "lain" },
  { sentence: "The ____ of the storm was devastating.", options: ["effect", "affect", "effec", "affec"], answer: "effect" },
  { sentence: "The weather will ____ our travel plans.", options: ["affect", "effect", "affects", "effects"], answer: "affect" },
  { sentence: "She is smarter ____ her brother.", options: ["than", "then", "that", "those"], answer: "than" },
  { sentence: "I have ____ apples than you.", options: ["fewer", "less", "fewest", "least"], answer: "fewer" },
  { sentence: "There is ____ water in the glass.", options: ["less", "fewer", "least", "fewest"], answer: "less" },
  { sentence: "He ____ the ball perfectly.", options: ["threw", "through", "throwed", "throne"], answer: "threw" },
  { sentence: "We walked ____ the tunnel.", options: ["through", "threw", "thorough", "though"], answer: "through" },
  { sentence: "The principal is my ____.", options: ["principle", "principal", "principl", "principality"], answer: "principal" },
  { sentence: "I like to stay ____ in my room.", options: ["quiet", "quite", "quit", "quilt"], answer: "quiet" },
  { sentence: "It was ____ nice of you to help.", options: ["quite", "quiet", "quit", "quilt"], answer: "quite" },
  { sentence: "She is a person ____ cares deeply.", options: ["who", "whom", "whose", "which"], answer: "who" },
  { sentence: "The dog wagged ____ tail happily.", options: ["its", "it's", "its'", "is"], answer: "its" },
  { sentence: "____ are you going with?", options: ["Whom", "Who", "Whose", "Which"], answer: "Whom" },
  { sentence: "I need to ____ down for a nap.", options: ["lie", "lay", "laid", "lain"], answer: "lie" },
  { sentence: "He ____ the keys on the counter.", options: ["laid", "lied", "lay", "lain"], answer: "laid" },
  { sentence: "There are ____ cookies in the jar.", options: ["fewer", "less", "fewer than", "lesser"], answer: "fewer" },
  { sentence: "The movie was ____ long.", options: ["too", "to", "two", "toe"], answer: "too" },
  { sentence: "We are going ____ the store.", options: ["to", "too", "two", "tow"], answer: "to" },
  { sentence: "I have ____ sisters.", options: ["two", "to", "too", "tow"], answer: "two" },
  { sentence: "The ____ of the sun is warm.", options: ["effect", "affect", "effec", "affec"], answer: "effect" },
  { sentence: "Please do not ____ the outcome.", options: ["affect", "effect", "affects", "effects"], answer: "affect" },
  { sentence: "The scissors ____ on the table.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Each of the players ____ a trophy.", options: ["gets", "get", "getting", "gotten"], answer: "gets" },
  { sentence: "Mathematics ____ a difficult subject.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "Neither the teacher nor the students ____ here.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Bread and butter ____ my favorite breakfast.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "The number of visitors ____ increasing.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "A number of students ____ absent today.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "If I ____ you, I would go.", options: ["were", "was", "am", "be"], answer: "were" },
  { sentence: "He acted as if he ____ the boss.", options: ["were", "was", "is", "be"], answer: "were" },
  { sentence: "The car needs ____.", options: ["washing", "to wash", "wash", "washed"], answer: "washing" },
  { sentence: "I am looking forward to ____ you.", options: ["seeing", "see", "seen", "saw"], answer: "seeing" },
  { sentence: "She is capable of ____ anything.", options: ["doing", "do", "does", "did"], answer: "doing" },
  { sentence: "I object to ____ like this.", options: ["being treated", "be treated", "treat", "treating"], answer: "being treated" },
  { sentence: "He is used to ____ early.", options: ["waking up", "wake up", "wakes up", "woke up"], answer: "waking up" },
  { sentence: "The news ____ not very good.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "The police ____ searching for the suspect.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Everyone ____ finished their work.", options: ["has", "have", "having", "had"], answer: "has" },
  { sentence: "Many a student ____ made that mistake.", options: ["has", "have", "having", "had"], answer: "has" },
  { sentence: "There ____ many stars in the sky.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "One of my friends ____ going to Paris.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "The committee ____ reached a decision.", options: ["has", "have", "had", "having"], answer: "has" },
  { sentence: "The data ____ being analyzed.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Criteria ____ used to judge the entries.", options: ["were", "was", "is", "be"], answer: "were" },
  { sentence: "The phenomena ____ very unusual.", options: ["were", "was", "is", "be"], answer: "were" },
  { sentence: "Each of the candidates ____ given a task.", options: ["was", "were", "be", "am"], answer: "was" },
  { sentence: "None of the information ____ useful.", options: ["was", "were", "is", "be"], answer: "was" },
  { sentence: "The majority of the voters ____ in favor.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Fifty dollars ____ too much to pay.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "Ten miles ____ a long way to walk.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "Physics ____ my favorite subject.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "The scissors ____ very sharp.", options: ["are", "is", "be", "am"], answer: "are" },
  { sentence: "Politics ____ a complex business.", options: ["is", "are", "be", "am"], answer: "is" },
  { sentence: "She is the one ____ won the race.", options: ["who", "whom", "whose", "which"], answer: "who" },
  { sentence: "The book is ____ than the movie.", options: ["better", "best", "well", "good"], answer: "better" },
  { sentence: "I ____ already seen that movie.", options: ["have", "had", "has", "am"], answer: "have" },
  { sentence: "The weather is ____ today than yesterday.", options: ["colder", "coldest", "coldly", "cold"], answer: "colder" },
  { sentence: "He ____ to the gym every morning.", options: ["goes", "go", "going", "gone"], answer: "goes" },
  { sentence: "The children ____ playing in the park.", options: ["are", "is", "am", "be"], answer: "are" },
  { sentence: "I ____ a new car next week.", options: ["will buy", "buy", "buying", "bought"], answer: "will buy" },
  { sentence: "The flowers ____ beautiful in the garden.", options: ["look", "looks", "looking", "looked"], answer: "look" },
  { sentence: "She ____ her homework before dinner.", options: ["finished", "finish", "finishing", "finishes"], answer: "finished" },
  { sentence: "The sun ____ in the east.", options: ["rises", "rise", "rising", "rose"], answer: "rises" },
  { sentence: "I ____ my keys on the table.", options: ["put", "puts", "putting", "place"], answer: "put" },
  { sentence: "The coffee is ____ hot to drink.", options: ["too", "to", "two", "toe"], answer: "too" },
  { sentence: "He ____ a letter to his parents.", options: ["wrote", "write", "writing", "writes"], answer: "wrote" },
  { sentence: "The movie ____ at 7 PM.", options: ["starts", "start", "starting", "started"], answer: "starts" },
  { sentence: "I ____ to the store to buy milk.", options: ["went", "go", "going", "goes"], answer: "went" }
];

const GrammarGuardian: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [current, setCurrent] = useState(QUESTIONS[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const questionPool = useRef<number[]>([]);

  const nextQuestion = useCallback(() => {
    if (questionPool.current.length === 0) {
      questionPool.current = Array.from({ length: QUESTIONS.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5);
    }
    
    const nextIndex = questionPool.current.pop()!;
    setCurrent(QUESTIONS[nextIndex]);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      setTimeLeft(60);
      questionPool.current = [];
      nextQuestion();
    }
  }, [isPlaying, nextQuestion]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { onGameOver(score); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, onGameOver, score]);

  const handleChoice = (opt: string) => {
    if (feedback) return;
    if (opt === current.answer) {
      setFeedback('correct');
      setScore(s => s + 600);
      setTimeout(nextQuestion, 500);
    } else {
      setFeedback('wrong');
      setTimeLeft(t => Math.max(0, t - 8)); // 8s penalty
      setTimeout(() => setFeedback(null), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-lg px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-emerald-500/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</span>
          <span className={`text-3xl font-black tabular-nums ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{timeLeft}s</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lexicon Rank</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full text-center space-y-8">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Repair the Syntax Rift</p>
        <div className="glass-card p-8 rounded-[2.5rem] border-2 border-emerald-500/10 min-h-[160px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-bold italic dark:text-white text-slate-800 leading-relaxed z-10 animate-in fade-in slide-in-from-top-2">
            "{current.sentence}"
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={`
              h-20 glass-card rounded-2xl flex items-center justify-center text-xl font-black transition-all border-2
              ${feedback === 'correct' && opt === current.answer ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_emerald]' : ''}
              ${feedback === 'wrong' && opt !== current.answer ? 'opacity-50' : 'hover:scale-105 active:scale-95 border-emerald-500/10'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GrammarGuardian;