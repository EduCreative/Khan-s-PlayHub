
import React, { useState, useEffect, useCallback, useRef } from 'react';

const QUESTIONS = [
  { sentence: "They ____ going to the park yesterday.", options: ["were", "was", "are", "be"], answer: "were", explanation: "'They' is plural, and 'yesterday' indicates past tense, so 'were' is correct." },
  { sentence: "She ____ her keys in the car.", options: ["left", "leaved", "leaf", "laved"], answer: "left", explanation: "The past tense of 'leave' is the irregular verb 'left'." },
  { sentence: "Neither of the boys ____ here.", options: ["is", "are", "am", "be"], answer: "is", explanation: "'Neither' is a singular pronoun, so it takes the singular verb 'is'." },
  { sentence: "____ bag is this?", options: ["Whose", "Who's", "Who", "Whom"], answer: "Whose", explanation: "'Whose' shows possession, whereas 'Who's' is a contraction for 'Who is'." },
  { sentence: "____ doing a great job!", options: ["You're", "Your", "Yore", "Yours"], answer: "You're", explanation: "'You're' is the contraction for 'You are', which fits the sentence." },
  { sentence: "I should have ____ better.", options: ["known", "knew", "knowed", "know"], answer: "known", explanation: "'Should have' requires the past participle form of the verb, which is 'known'." },
  { sentence: "The building was taller ____ the tree.", options: ["than", "then", "them", "that"], answer: "than", explanation: "'Than' is used for comparisons, while 'then' refers to time." },
  { sentence: "____ important to feed the cat.", options: ["It's", "Its", "Its'", "Is"], answer: "It's", explanation: "'It's' is the contraction for 'It is'." },
  { sentence: "They went ____ the house together.", options: ["into", "in to", "in", "to"], answer: "into", explanation: "'Into' indicates movement toward the inside of a place." },
  { sentence: "Please don't ____ your keys.", options: ["lose", "loose", "lost", "loss"], answer: "lose", explanation: "'Lose' means to misplace, while 'loose' means not tight." },
  { sentence: "____ going to the concert tonight.", options: ["They're", "There", "Their", "Theirs"], answer: "They're", explanation: "'They're' is the contraction for 'They are'." },
  { sentence: "He is the person ____ I met at the party.", options: ["whom", "who", "whose", "which"], answer: "whom", explanation: "'Whom' is used as the object of a verb or preposition." },
  { sentence: "Every one of the cookies ____ delicious.", options: ["is", "are", "was", "were"], answer: "is", explanation: "'Every one' is a singular subject, so it takes the singular verb 'is'." },
  { sentence: "The group ____ decided on a plan.", options: ["has", "have", "had", "having"], answer: "has", explanation: "As a collective noun acting as a single unit, 'group' takes the singular verb 'has'." },
  { sentence: "I feel ____ today about the mistake.", options: ["bad", "badly", "worse", "worst"], answer: "bad", explanation: "Linking verbs like 'feel' are followed by adjectives ('bad'), not adverbs ('badly')." },
  { sentence: "She plays the piano ____.", options: ["well", "good", "better", "best"], answer: "well", explanation: "'Well' is an adverb modifying the verb 'plays', whereas 'good' is an adjective." },
  { sentence: "This is between you and ____.", options: ["me", "I", "my", "mine"], answer: "me", explanation: "Prepositions like 'between' take object pronouns like 'me'." },
  { sentence: "The cat licked ____ paws.", options: ["its", "it's", "it", "its'"], answer: "its", explanation: "'Its' is the possessive form. 'It's' means 'it is'." },
  { sentence: "I ____ finished my homework already.", options: ["have", "has", "had", "having"], answer: "have", explanation: "The pronoun 'I' takes the auxiliary verb 'have' for the present perfect tense." },
  { sentence: "None of the students ____ the answer.", options: ["knows", "know", "knowing", "known"], answer: "knows", explanation: "'None' is traditionally treated as singular, taking the singular verb 'knows'." },
  { sentence: "I will ____ the book on the table.", options: ["lay", "lie", "laid", "lain"], answer: "lay", explanation: "'Lay' means to place something down and requires a direct object ('the book')." },
  { sentence: "He has ____ in that bed for hours.", options: ["lain", "laid", "lay", "lied"], answer: "lain", explanation: "'Lain' is the past participle of 'lie' (to recline)." },
  { sentence: "The ____ of the storm was devastating.", options: ["effect", "affect", "effec", "affec"], answer: "effect", explanation: "'Effect' is usually a noun meaning a result, while 'affect' is usually a verb." },
  { sentence: "The weather will ____ our travel plans.", options: ["affect", "effect", "affects", "effects"], answer: "affect", explanation: "'Affect' is a verb meaning to influence." },
  { sentence: "She is smarter ____ her brother.", options: ["than", "then", "that", "those"], answer: "than", explanation: "'Than' is used for comparisons." },
  { sentence: "I have ____ apples than you.", options: ["fewer", "less", "fewest", "least"], answer: "fewer", explanation: "'Fewer' is used for countable nouns like 'apples'." },
  { sentence: "There is ____ water in the glass.", options: ["less", "fewer", "least", "fewest"], answer: "less", explanation: "'Less' is used for uncountable nouns like 'water'." },
  { sentence: "He ____ the ball perfectly.", options: ["threw", "through", "throwed", "throne"], answer: "threw", explanation: "'Threw' is the past tense of the verb 'throw'." },
  { sentence: "We walked ____ the tunnel.", options: ["through", "threw", "thorough", "though"], answer: "through", explanation: "'Through' is a preposition indicating movement from one side to another." },
  { sentence: "The school ____ spoke to the students.", options: ["principal", "principle", "principl", "principality"], answer: "principal", explanation: "'Principal' refers to the head of a school." },
  { sentence: "He is a man of high ____.", options: ["principle", "principal", "principl", "principality"], answer: "principle", explanation: "'Principle' refers to a fundamental truth or moral rule." },
  { sentence: "I like to stay ____ in my room.", options: ["quiet", "quite", "quit", "quilt"], answer: "quiet", explanation: "'Quiet' means making little or no noise." },
  { sentence: "It was ____ nice of you to help.", options: ["quite", "quiet", "quit", "quilt"], answer: "quite", explanation: "'Quite' is an adverb meaning 'very' or 'completely'." },
  { sentence: "She is a person ____ cares deeply.", options: ["who", "whom", "whose", "which"], answer: "who", explanation: "'Who' is used as the subject of the clause ('who cares')." },
  { sentence: "The movie was ____ long.", options: ["too", "to", "two", "toe"], answer: "too", explanation: "'Too' means 'excessively' or 'also'." },
  { sentence: "We are going ____ the store.", options: ["to", "too", "two", "tow"], answer: "to", explanation: "'To' is a preposition indicating direction." },
  { sentence: "The scissors ____ on the table.", options: ["are", "is", "be", "am"], answer: "are", explanation: "'Scissors' is a plural noun and takes a plural verb." },
  { sentence: "Each of the players ____ a trophy.", options: ["gets", "get", "getting", "gotten"], answer: "gets", explanation: "'Each' is a singular subject, so it takes the singular verb 'gets'." },
  { sentence: "Mathematics ____ a difficult subject.", options: ["is", "are", "be", "am"], answer: "is", explanation: "Fields of study ending in '-ics' (like mathematics) are singular." },
  { sentence: "Bread and butter ____ my favorite breakfast.", options: ["is", "are", "be", "am"], answer: "is", explanation: "When two nouns represent a single idea or dish, they take a singular verb." },
  { sentence: "The number of visitors ____ increasing.", options: ["is", "are", "be", "am"], answer: "is", explanation: "'The number' is a singular subject, taking a singular verb." },
  { sentence: "A number of students ____ absent today.", options: ["are", "is", "be", "am"], answer: "are", explanation: "'A number of' means 'several' and takes a plural verb." },
  { sentence: "If I ____ you, I would go.", options: ["were", "was", "am", "be"], answer: "were", explanation: "In the subjunctive mood (hypothetical situations), 'were' is used for all subjects." },
  { sentence: "The car needs ____.", options: ["washing", "to wash", "wash", "washed"], answer: "washing", explanation: "After 'needs', we use the gerund ('washing') or passive infinitive ('to be washed')." },
  { sentence: "I am looking forward to ____ you.", options: ["seeing", "see", "seen", "saw"], answer: "seeing", explanation: "The 'to' in 'look forward to' is a preposition, so it must be followed by a gerund (-ing form)." },
  { sentence: "She is capable of ____ anything.", options: ["doing", "do", "does", "did"], answer: "doing", explanation: "Prepositions like 'of' are followed by gerunds (-ing forms)." },
  { sentence: "The news ____ not very good.", options: ["is", "are", "be", "am"], answer: "is", explanation: "'News' is a singular uncountable noun." },
  { sentence: "The police ____ searching for the suspect.", options: ["are", "is", "be", "am"], answer: "are", explanation: "'Police' is a collective noun that takes a plural verb." },
  { sentence: "Everyone ____ finished their work.", options: ["has", "have", "having", "had"], answer: "has", explanation: "Indefinite pronouns like 'everyone' are singular and take singular verbs." },
  { sentence: "Many a student ____ made that mistake.", options: ["has", "have", "having", "had"], answer: "has", explanation: "The phrase 'many a' is followed by a singular noun and a singular verb." },
  { sentence: "Criteria ____ used to judge the entries.", options: ["were", "was", "is", "be"], answer: "were", explanation: "'Criteria' is the plural form of 'criterion', so it takes a plural verb." },
  { sentence: "The phenomena ____ very unusual.", options: ["were", "was", "is", "be"], answer: "were", explanation: "'Phenomena' is the plural form of 'phenomenon'." },
  { sentence: "Fifty dollars ____ too much to pay.", options: ["is", "are", "be", "am"], answer: "is", explanation: "Amounts of money, time, or distance are treated as singular units." },
  { sentence: "Ten miles ____ a long way to walk.", options: ["is", "are", "be", "am"], answer: "is", explanation: "Distances are treated as singular units." },
  { sentence: "She is older ____ her cousin.", options: ["than", "then", "their", "there"], answer: "than", explanation: "Use 'than' for comparison." },
  { sentence: "He is one of those men who ____ never satisfied.", options: ["are", "is", "be", "being"], answer: "are", explanation: "The relative pronoun 'who' refers to the plural 'men', so it takes the plural verb 'are'." },
  { sentence: "We ____ to the concert if it rains.", options: ["won't go", "wouldn't go", "don't go", "haven't gone"], answer: "won't go", explanation: "This is a first conditional sentence referring to a possible future condition." },
  { sentence: "Neither of the responses ____ satisfactory.", options: ["was", "were", "are", "be"], answer: "was", explanation: "'Neither' is singular and takes a singular verb." },
  { sentence: "The keys, as well as the wallet, ____ found.", options: ["were", "was", "is", "being"], answer: "were", explanation: "The subject 'keys' is plural. Words introduced by 'as well as' do not change the subject number." },
  { sentence: "The jury ____ unable to agree on a verdict.", options: ["was", "were", "has", "is"], answer: "was", explanation: "The collective noun 'jury' is acting as a singular unit here, so 'was' is correct." },
  { sentence: "The team ____ putting on their uniforms.", options: ["are", "is", "was", "be"], answer: "are", explanation: "The members of the team are acting individually, so a plural verb is used." },
  { sentence: "He acted as though he ____ the boss.", options: ["were", "was", "is", "be"], answer: "were", explanation: "The subjunctive 'were' is used for statements contrary to fact after 'as though'." },
  { sentence: "Every student and teacher ____ present.", options: ["was", "were", "are", "be"], answer: "was", explanation: "Subjects preceded by 'every' are singular and take a singular verb." },
  { sentence: "The data ____ analyzed by the researcher.", options: ["were", "was", "is", "be"], answer: "were", explanation: "In formal writing, 'data' is the plural of 'datum' and takes a plural verb." },
  { sentence: "To hand in the assignment late is to ____ failure.", options: ["court", "courting", "courts", "courted"], answer: "court", explanation: "To maintain parallel structure ('To hand... is to...'), we use the base verb 'court'." },
  { sentence: "She and ____ are going shopping.", options: ["I", "me", "myself", "mine"], answer: "I", explanation: "Use the compound subject pronoun 'I'." },
  { sentence: "My mother, along with my sisters, ____ coming.", options: ["is", "are", "be", "were"], answer: "is", explanation: "The main subject 'mother' is singular. 'Along with...' does not affect verb agreement." },
  { sentence: "The media ____ biased during the election.", options: ["were", "was", "is", "be"], answer: "were", explanation: "In formal context, 'media' is plural and takes a plural verb." },
  { sentence: "Either the teacher or the students ____ the room.", options: ["clean", "cleans", "cleaning", "cleaned"], answer: "clean", explanation: "When subjects are joined by 'or', the verb agrees with the closer subject ('students')." },
  { sentence: "Either the students or the teacher ____ the room.", options: ["cleans", "clean", "cleaning", "cleaned"], answer: "cleans", explanation: "The verb agrees with the closer subject ('teacher')." },
  { sentence: "Here ____ the results of the research.", options: ["are", "is", "was", "be"], answer: "are", explanation: "The subject 'results' is plural, so a plural verb 'are' is required." },
  { sentence: "She is one of those people who ____ always early.", options: ["are", "is", "be", "being"], answer: "are", explanation: "The relative clause modifies 'those people' (plural), so 'are' is correct." },
  { sentence: "He ____ down for a nap in the afternoon.", options: ["lay", "laid", "lied", "lain"], answer: "lay", explanation: "The past tense of 'lie' (to recline) is 'lay'." },
  { sentence: "We was ____ to have finished earlier.", options: ["supposed", "suppose", "supposing", "supposely"], answer: "supposed", explanation: "The passive voice construction is 'be supposed to'." },
  { sentence: "I cannot ____ your offer of assistance.", options: ["accept", "except", "aspect", "expect"], answer: "accept", explanation: "'Accept' means to receive favorably, whereas 'except' means to exclude." },
  { sentence: "All the invitees, ____ John, attended.", options: ["except", "accept", "expect", "aspect"], answer: "except", explanation: "'Except' is a preposition meaning 'excluding'." },
  { sentence: "Her kind words had a positive ____ on me.", options: ["effect", "affect", "effec", "affec"], answer: "effect", explanation: "'Effect' is a noun meaning result or impact." },
  { sentence: "Your criticism didn't ____ his decision.", options: ["affect", "effect", "affects", "effects"], answer: "affect", explanation: "Here, 'affect' is a verb meaning 'to influence'." },
  { sentence: "Is that the car ____ needs a new engine?", options: ["that", "who", "whom", "whose"], answer: "that", explanation: "Use 'that' or 'which' for non-human things." },
  { sentence: "The book is about a girl ____ goes on an adventure.", options: ["who", "whom", "which", "whose"], answer: "who", explanation: "'Who' is the subject pronoun for a person." },
  { sentence: "The dog wagged ____ tail happily.", options: ["its", "it's", "it", "its'"], answer: "its", explanation: "'Its' is the possessive pronoun for animals/things without a specified gender." },
  { sentence: "I don't know ____ going to win.", options: ["who's", "whose", "who", "whom"], answer: "who's", explanation: "'Who's' is the contraction of 'who is'." },
  { sentence: "The performance was ____ than last year.", options: ["better", "best", "more good", "well"], answer: "better", explanation: "'Better' is the comparative form of 'good' and 'well'." },
  { sentence: "He of all people ____ the first to finish.", options: ["was", "were", "are", "be"], answer: "was", explanation: "The singular subject 'He' takes the singular verb 'was'." },
  { sentence: "This custom is unique ____ this region.", options: ["to", "for", "with", "at"], answer: "to", explanation: "The word 'unique' takes the preposition 'to'." },
  { sentence: "Please write back as soon as ____.", options: ["possible", "possibly", "possibility", "possibled"], answer: "possible", explanation: "The expression is 'as soon as possible'." },
  { sentence: "I didn't hear ____ you said.", options: ["what", "which", "that", "how"], answer: "what", explanation: "'What' functions as the object of 'said'." },
  { sentence: "She succeeded ____ passing the exam.", options: ["in", "on", "at", "to"], answer: "in", explanation: "'Succeed' takes the preposition 'in' followed by a gerund." },
  { sentence: "The house was built ____ brick.", options: ["of", "by", "from", "with"], answer: "of", explanation: "'Built of' is used when the material is still recognizable." },
  { sentence: "The work must be finished ____ tomorrow.", options: ["by", "until", "to", "since"], answer: "by", explanation: "'By' indicates a deadline, whereas 'until' indicates duration." },
  { sentence: "He came ____ foot.", options: ["on", "by", "with", "at"], answer: "on", explanation: "The set phrase is 'on foot'." },
  { sentence: "They traveled ____ train.", options: ["by", "on", "in", "with"], answer: "by", explanation: "We use 'by' for modes of transportation followed directly by the noun." },
  { sentence: "I have been working here ____ three years.", options: ["for", "since", "during", "while"], answer: "for", explanation: "Use 'for' to specify the duration of time." },
  { sentence: "I have been living here ____ 2021.", options: ["since", "for", "from", "in"], answer: "since", explanation: "Use 'since' to refer to a specific starting point in time." },
  { sentence: "Neither of those cars ____ cheap.", options: ["is", "are", "be", "being"], answer: "is", explanation: "'Neither' is a singular pronoun and takes a singular verb." },
  { sentence: "Both of the players ____ talented.", options: ["are", "is", "was", "be"], answer: "are", explanation: "'Both' is a plural pronoun and takes a plural verb." },
  { sentence: "She complimented him ____ his speech.", options: ["on", "for", "about", "at"], answer: "on", explanation: "'Compliment' takes the preposition 'on'." },
  { sentence: "He was accused ____ theft.", options: ["of", "for", "with", "by"], answer: "of", explanation: "'Accuse' is paired with the preposition 'of'." },
  { sentence: "I want to congratulate you ____ your success.", options: ["on", "for", "at", "with"], answer: "on", explanation: "'Congratulate' takes the preposition 'on'." },
  { sentence: "The patient is recovering ____ illness.", options: ["from", "of", "off", "by"], answer: "from", explanation: "'Recover' is followed by the preposition 'from'." },
  { sentence: "He prevents us ____ leaving.", options: ["from", "to", "for", "by"], answer: "from", explanation: "'Prevent' is followed by 'from' + gerund (-ing)." },
  { sentence: "I object ____ that proposal.", options: ["to", "for", "against", "at"], answer: "to", explanation: "'Object' is paired with 'to'." },
  { sentence: "This food consists ____ organic ingredients.", options: ["of", "in", "by", "from"], answer: "of", explanation: "'Consist of' means to be made up of." },
  { sentence: "She is very good ____ languages.", options: ["at", "in", "on", "with"], answer: "at", explanation: "'Good at' is used for skills and abilities." },
  { sentence: "He is interested ____ art.", options: ["in", "on", "at", "with"], answer: "in", explanation: "'Interested' is paired with the preposition 'in'." },
  { sentence: "Are you afraid ____ spiders?", options: ["of", "from", "for", "about"], answer: "of", explanation: "'Afraid' takes the preposition 'of'." },
  { sentence: "They are proud ____ their children.", options: ["of", "for", "with", "about"], answer: "of", explanation: "'Proud' is paired with 'of'." },
  { sentence: "The room was crowded ____ people.", options: ["with", "of", "by", "for"], answer: "with", explanation: "'Crowded' takes the preposition 'with'." },
  { sentence: "He is famous ____ his paintings.", options: ["for", "about", "by", "with"], answer: "for", explanation: "'Famous for' is the correct preposition combination." },
  { sentence: "She was surprised ____ the news.", options: ["by", "of", "with", "for"], answer: "by", explanation: "'Surprised by' or 'at' is used for unexpected events." },
  { sentence: "I am familiar ____ this place.", options: ["with", "to", "at", "by"], answer: "with", explanation: "'Familiar with' is used when someone has knowledge of something." },
  { sentence: "That concept is distinct ____ this one.", options: ["from", "to", "with", "by"], answer: "from", explanation: "'Distinct' takes the preposition 'from'." },
  { sentence: "He is senior ____ me by two years.", options: ["to", "than", "from", "for"], answer: "to", explanation: "Comparative adjectives like 'senior', 'junior', 'prefer' take 'to' instead of 'than'." },
  { sentence: "I prefer tea ____ coffee.", options: ["to", "than", "for", "rather"], answer: "to", explanation: "'Prefer' is followed by 'to' when comparing two options." },
  { sentence: "She is married ____ a musician.", options: ["to", "with", "by", "for"], answer: "to", explanation: "We use 'married to' (not 'with') to refer to the spouse." },
  { sentence: "The teacher got angry ____ the student's behavior.", options: ["at", "with", "for", "by"], answer: "at", explanation: "You get angry 'at' a situation or behavior, and 'with' a person." }
];

const GrammarGuardian: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean; sfxVolume: number; hapticFeedback: boolean }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback }) => {
  const [current, setCurrent] = useState(QUESTIONS[0]);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const questionPool = useRef<number[]>([]);

  const playSfx = useCallback((src: string, volume: number) => {
    if (volume > 0) {
      try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, []);

  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const nextQuestion = useCallback(() => {
    if (questionPool.current.length === 0) {
      questionPool.current = Array.from({ length: QUESTIONS.length }, (_, i) => i)
        .sort(() => Math.random() - 0.5);
    }
    
    const nextIndex = questionPool.current.pop()!;
    setCurrent(QUESTIONS[nextIndex]);
    setSelectedOption(null);
    setIsSubmitted(false);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      setQuestionCount(0);
      questionPool.current = [];
      nextQuestion();
    }
  }, [isPlaying, nextQuestion]);

  const handleSelect = (opt: string) => {
    if (isSubmitted) return;
    setSelectedOption(opt);
    triggerHapticFeedback();
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    
    setIsSubmitted(true);
    const isCorrect = selectedOption === current.answer;
    
    if (isCorrect) {
      playSfx('/sfx/correct.mp3', sfxVolume);
      setScore(s => s + 10);
    } else {
      playSfx('/sfx/wrong.mp3', sfxVolume);
    }
  };

  const handleNext = () => {
    if (questionCount >= 9) { // 10 questions per round
      onGameOver(score);
    } else {
      setQuestionCount(c => c + 1);
      nextQuestion();
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-6 w-full max-w-lg px-6 py-12 select-none overflow-hidden rounded-[3rem]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-20 dark:opacity-40"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-slate-50/70 dark:bg-[#0f172a]/80 backdrop-blur-md z-[1]" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-emerald-500/20 shadow-xl backdrop-blur-xl bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
            <span className="text-3xl font-black text-emerald-500 tabular-nums">{questionCount + 1}/10</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lexicon Rank</span>
            <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-full text-center space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Repair the Syntax Rift</p>
          <div className="glass-card p-8 rounded-[2.5rem] border-2 border-emerald-500/10 min-h-[160px] flex items-center justify-center relative overflow-hidden backdrop-blur-2xl bg-white/5">
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
            <h2 className="text-2xl md:text-3xl font-bold italic dark:text-white text-slate-800 leading-relaxed z-10 animate-in fade-in slide-in-from-top-2">
              "{current.sentence.replace('____', isSubmitted && selectedOption ? selectedOption : '____')}"
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {current.options.map((opt, i) => {
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = opt === current.answer;
            const optionPrefix = ["A", "B", "C", "D"][i];
            
            let btnClass = 'bg-white/5 border-emerald-500/10 hover:border-emerald-500/30 text-slate-700 dark:text-slate-300';
            let badgeClass = 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 dark:text-indigo-300';
            
            if (isSubmitted) {
              if (isCorrectAnswer) {
                btnClass = 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]';
                badgeClass = 'bg-white/20 border-white/40 text-white';
              } else if (isSelected) {
                btnClass = 'bg-rose-500 border-rose-400 text-white';
                badgeClass = 'bg-white/20 border-white/40 text-white';
              } else {
                btnClass = 'opacity-50 bg-white/5 border-emerald-500/10';
                badgeClass = 'opacity-40 bg-indigo-500/5 border-indigo-500/10 text-indigo-400 dark:text-indigo-300';
              }
            } else if (isSelected) {
              btnClass = 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105';
              badgeClass = 'bg-white/20 border-white/40 text-white';
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={isSubmitted}
                className={`
                  h-16 glass-card rounded-2xl flex items-center justify-start px-5 gap-3.5 text-base font-bold transition-all border-2 backdrop-blur-md
                  ${btnClass}
                  ${!isSubmitted && !isSelected ? 'hover:scale-[1.03] active:scale-95' : ''}
                `}
              >
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border transition-all shrink-0 ${badgeClass}`}>
                  {optionPrefix}
                </span>
                <span className="truncate text-left">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="w-full mt-2">
          {isSubmitted && (
            <div 
              className={`w-full p-6 rounded-3xl border-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300 ${selectedOption === current.answer ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <i className={`fas ${selectedOption === current.answer ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-rose-500'} text-xl`}></i>
                <h3 className={`font-black uppercase tracking-widest text-sm ${selectedOption === current.answer ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedOption === current.answer ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                {current.explanation}
              </p>
            </div>
          )}

          {!isSubmitted ? (
            <button 
              onClick={handleSubmit}
              disabled={!selectedOption}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${selectedOption ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {questionCount >= 9 ? 'Complete Training' : 'Next Question'} <i className="fas fa-arrow-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarGuardian;

