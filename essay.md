---
aliases:
  - JesterBench
---
## Surely You're Joking, Mr. Claude

Building JesterBench, a humor benchmark derived from a LeBron-focused cartoon

----


Over the past few years, I've read a frighteningly large amount of LLM-generated text. I still cling (perhaps foolhardily!) to the idea that a good portion of my reading input can be from natural, 100% organic human sources, but I'll be the first to admit that it's a losing battle. [Most new articles on the internet are now written by robots](https://graphite.io/five-percent/more-articles-are-now-created-by-ai-than-humans), more and [more of the writing in the workplace is AI slop](https://nicholasachow.substack.com/p/the-slop-you-cant-scroll-past), and the single biggest source of text I read on any given day is now my own Claude Code terminal.

Reading LLM text is lobotomizing. And while every other LLM capability keeps accelerating, the writing hasn't kept up. It's not good, it's not insightful, and it's not funny.

LLM text is, almost by construction, the most expected next thing. A joke is the complete opposite. A good joke is a surprise that feels inevitable half a second later. Someone noticed a connection between two things you'd never put side by side, and once they point it out, you can't unsee it.

In *The Act of Creation*, Arthur Koestler argued that the punchline, the scientific discovery, and the work of art all come from the same mental move: smashing together two frames of reference that were never supposed to meet. The only difference is how we react: a joke gets a "ha-ha," a discovery gets an "aha," and art gets an "ah." 

If a model can't be funny, I suspect it can't really surprise me with anything else either.

So I decided to find out whether models can be funny.

### LeBron vs. Steph and the Warriors

Like all normal, well-adjusted members of polite society, I collect a list of things that I find hilarious. By many measures, one of the funniest things that I've stumbled across is Bleacher Report's incredible Hero x Ball series, which mashes up current NBA headlines with anime references and tropes.

And out of all the Hero x Ball episodes, one particular episode stands out the most: "[LeBron vs. Steph and the Warriors](https://www.youtube.com/watch?v=abXZrwsvF6Q)," an episode released in April 2024, when the Lakers and Warriors were in the midst of fighting for play-in seeding.

https://www.youtube.com/watch?v=abXZrwsvF6Q

It's three minutes and fifty-two seconds of genius, with so many clever references and comedic elements that manage to appeal perfectly to my NBA/LeBron fandom and my anime-enjoying sensibilities. The density of jokes is staggering.

Consider this particular frame from the episode:

![Pasted image 20260909130605.png](essay-images/pasted-image-20260909130605.png)

Beyond the obvious representation of LeBron, clad in Lakers purple and gold armor, as an anime protagonist, the frame is packed with references.

In total, I count over 15 different references in this frame. I know, because I took the time to carefully study each one of these, and also to explain many of these references to the multiple captive audiences that I forced to watch this video with me.

That was the "seed" (ha!) of my own idea: what if I used this as a basis to create a humor evaluation for AI models?

### What gets measured gets trained

Every single time a new AI model is announced, its release is accompanied by a slew of benchmark scores. These inscrutable names — [SWE-bench Verified](https://www.swebench.com/), [GPQA Diamond](https://github.com/idavidrein/gpqa), [ARC-AGI-2](https://arcprize.org/arc-agi/2/), [Humanity's Last Exam](https://lastexam.ai/) — essentially describe collections of questions/tasks that researchers use to assess model capabilities in different domains.

The nuances of benchmark construction are probably a bit too much for this piece, but it's undeniable that benchmark construction highly influences the trajectory of model development. I talk a bit more about this in [a primer on RL environments](https://nicholasachow.substack.com/p/why-are-there-suddenly-so-many-ai), but verifiable technical domains are more amenable to benchmarking, while softer, non-verifiable topics (like humor) are much harder to approach.

The benefit of being able to reasonably capture an intended set of model capabilities in a well-constructed benchmark is huge. With the way model training works today, we are only able to systematically improve (and measure) model capabilities when we have good evaluations and benchmarks. We can't just prompt models to "be funnier"; we need strong humor measures and good accompanying humor data to feed to the models.

If I ever wanted a chance of reading model output that induces laughter in the same way that watching this Hero x Ball episode tickles my funny bone, I needed to get working on this humor benchmark. Let's call it JesterBench (h/t Spencer for the name).

### Evidence, referent, mechanism

*Editor's note: if you are here to read about obscure NBA references and don't want to be bombarded with a bunch of nerd AI stuff, feel free to skip to [[#Hearing the same music|the final section]]. If you're here to gawk at a complete neophyte who has never built a benchmark before, you're in the right place!* 

I started by going through the entire episode and identifying every single joke and reference. Most of the jokes were visual references, so I would write down the timestamp, take a screenshot, transcribe any relevant dialogue, and then write a short sentence on why each scene was particularly funny. I was left with a Markdown file of screenshots, annotations, and timestamps.

But there was naturally a very heterogeneous mix of jokes and references, so if I ever wanted to create a benchmark, I had to figure out a way to standardize them. That meant thinking harder about what makes something funny, or a reference clever.

If you step back and think about how a person gets a joke, you need to:
1. identify the **evidence** of a joke first, then
2. intuitively understand the real-world thing the joke refers to (i.e., the **referent**), then
3. see the **mechanism** of why it's funny

Evidence, referent, mechanism — remember these terms!

So I asked Claude Code (or was it Codex?) to parse through the Markdown file to create a more structured format. 

![Pasted image 20261020115203.png](essay-images/pasted-image-20261020115203.png)

As usual, there were many extra fields created that were somewhat superfluous, but the important fields to focus on are:
- evidence: what is literally on screen or spoken
- referent: the real thing the joke points at
- mechanism: why the interplay between evidence and referent is funny

These three fields also map neatly onto the ways a joke can go over someone's head. A model can miss the evidence entirely (a perception gap), see the evidence but not know the referent (a knowledge gap), or know both and still fail to explain the mechanism (a comprehension gap).

The perception gap showed up early. In my first tests, models would sometimes miss the joke in the corner of the frame entirely. For this version, I mostly sidestepped that by describing what's on screen in text, so the evaluation tests knowledge and comprehension rather than eyesight.

My suspicion going in was that, like humans, the models would struggle the most with identifying the correct referent. It requires shared knowledge between the joker and the jokee, and it has to be somewhat niche. The models, even with their encyclopedic knowledge, might struggle to pick the right referent to line up with the overall joke.[^1]

Once the jokes were organized, I wrote a rubric for each one: a "gold answer" with the referent, the mechanism, and a short list of essential points a correct answer has to hit.

![Pasted image 20250519184711.png](essay-images/pasted-image-20250519184711.png)

Take the "Reddish Wine" scene, for example. Full credit requires connecting three things: Cam Reddish was LeBron's teammate during this particular season, the wine is literally "reddish" colored, and LeBron loves wine. If you name Cam Reddish but forget the wine, you get partial credit. 

Once I had all these structured joke files and their corresponding rubrics, I could systematically pass them to the models to test their abilities. 

### The basic mechanics

Here's how a single joke moves through the pipeline.

Take this moment from 2:34. LeBron is on the floor, beaten, with Steph, Draymond, and Klay standing over him and gloating. 

Steph says: *"We got you 3-1. This is your last shot."*

![Pasted image 20250520002836.png](essay-images/pasted-image-20250520002836.png)

In **normal mode**, the model gets the still frame above, coupled with the prompt text:

> You are watching a short animated comedy video about the NBA, released April 2024.
>
> A still from the video is attached.
>
> At timestamp 2:34, this happens:
> Steph, standing over a defeated LeBron with Draymond and Klay: "We got you 3-1. This is your last shot"
>
> Comedy in this video usually works by referencing something real — a player, a game, a moment, a piece of pop culture.
>
> In at most three sentences: name specifically what this references, and explain why it is funny.
> If you do not think it references anything in particular, say so.
> If you are not confident, say so explicitly rather than guessing.

In **referent mode**, the input is identical except for one extra block of text, inserted right after the scene description:

> This is a joke, and it references:
> The 2016 NBA Finals, in which Golden State led 3-1 and lost

Each model's answer then goes to an LLM judge, which grades it against the joke's rubric. 

A **good answer** (GPT-5.6 Sol, normal mode):

> It references the 2016 NBA Finals, when Steph, Klay, and Draymond's 73-win Warriors led LeBron's Cavaliers 3–1 but lost the series in Game 7. It's funny because Steph treats "3–1" as an unbeatable advantage even though blowing that exact lead to LeBron became Golden State's most infamous failure and an enduring NBA meme.

A **bad answer** (Gemini 3.1 Pro, normal mode):

> This references the head-to-head NBA Finals record between Steph Curry's Golden State Warriors and LeBron James's Cleveland Cavaliers, who met in four consecutive championships from 2015 to 2018. The Warriors won three of those series to LeBron's one, giving Steph a 3-1 overall record against his rival on the biggest stage. The joke is funny because it cleverly repurposes the numbers from the infamous "Warriors blew a 3-1 lead" meme… into a brag that asserts their ultimate dominance over LeBron.

The interesting thing about the incorrect answer is that the model is comprehensive in its knowledge, but also comprehensively wrong. Gemini knows of the 2016 Finals, it knows the "Warriors blew a 3-1 lead" meme, and its overall win-loss stat is true (the Warriors did win three of those four Finals). The model had all the facts and still missed the joke. This is exactly the failure I suspected going in: not a lack of knowledge, but picking the wrong referent.

This representative example gives good intuition about the overall evaluation pipeline: I run every joke through each model, and the judge grades whether the jokes (referent(s) + mechanism) are correctly identified. 

And then hopefully at the end I see which models understand humor the best! 


### Interlude

As I toiled through this humor evaluation project, I couldn't help but be reminded of E.B. White's quote on humor:

> "Humor can be dissected, as a frog can, but the thing dies in the process and the innards are discouraging to any but the pure scientific mind." 

This is a perfectly reasonable thing to say, and I resent it deeply. I'd just spent an evening explaining why "Reddish Wine" is funny, and every joke got a little less funny with each rubric revision.

But then I remembered surviving White's *The Trumpet of the Swan* in elementary school, assigned chapter by assigned chapter, and I redoubled my efforts.


### Final score

I ran this suite of humor evaluation benchmarks (a battery of 45 questions) over a selection of different models:
- Opus 5 (Claude)
- Sonnet 5 (Claude)
- Haiku 4.5 (Claude)
- GPT-5.6 Sol (OpenAI)
- GPT-5.6 Terra (OpenAI)
- GPT-5.6 Luna (OpenAI)
- Gemini 3.1 Pro (Google)
- Gemini 3.8 Flash (Google)
- GLM-5V Turbo (Z.ai) 
- Qwen3-VL 235B (Alibaba)

Some takeaways:

**Models are impressively good**: The bigger models from each lab were able to identify a surprisingly large number of jokes, even when not provided the referent hint! Gemini 3.1 Pro was able to name the referent unassisted the vast majority of the time. Opus 5 and GPT-5.6 Sol were able to explain 37 and 38 jokes, respectively.

In some ways, this wasn't a huge surprise if you were to extrapolate model abilities. I looked back on my notes and I actually started doing my initial annotations back in May 2025, after I [used OpenAI's o3 model to successfully explain a joke from another Hero x Ball episode](https://chatgpt.com/share/682c339a-5e98-8002-a02d-e9ad0a275661). It did require a few back-and-forth prompts to get the model to focus on the right thing, but I remember being extremely surprised and impressed.

**The referent hint helps a lot**: There is a performance jump when the model is provided with the referent. The biggest jumps were observed for the weaker models: Haiku went from 36% to 64%, and GPT-5.6 Luna from 60% to 87%. The top models moved much less: Gemini 3.1 Pro went from 73% to 76%, and Sol from 84% to 91%. 

Interestingly enough, this performance boost holds even when the normal-mode answer already mentioned the referent. There's a useful example with the parody title _A Tale of 3 Cities_. Haiku's normal answer explicitly recognized Dickens's _A Tale of Two Cities_, but then neglected to explain the basketball connection. When the prompt supplied that same Dickens referent, it connected the three cities to LeBron's stints in Cleveland, Miami, and Los Angeles. The supplied referent did **not** include those three franchises, but the hint seems to have induced the connection merely by focusing the model on Dickens's original book title.

![humor eval paired explanation results.png](essay-images/humor-eval-paired-explanation-results.png)

My anthropomorphizing explanation is that this is like telling someone what to focus on in a joke. If someone doesn't understand why a remark is funny, you could do the painful exercise of explaining the history of the referent to them, and most of the time they'll understand why it's funny. The referent is what the weaker models are missing, and the strongest ones are able to identify it without the nudge. Even so, providing a model with the essential referent makes it more confident in its own identification and explanation.

**It's hard to break down humor**: It's hard to write good rubrics and gold answers to grade the models' understanding of humor. I spent hours trying to pin down the essential referents and explanations underpinning the entire suite of jokes. Yet, even amidst all this effort, I wasn't able to completely corral everything. 

Occasionally, a model would come up with an interpretation different from mine that I thought was perfectly valid. This happened only with the bigger, smarter models — the alternative explanations from the smaller models were universally bad (but entertaining to read in their own right).

In other situations, I'd write a rather complex explanation for a joke within the rubric, and then the judge was unnecessarily strict about matching the gold answer. I tried to get around this by denoting the essential components/terms required in an acceptable answer, and while this worked reasonably well, there were still many cases where I had to go back and forth to keep editing the rubric/acceptable answers. Even after all those adjustments, I'd still find answers marked wrong that were actually right (and vice versa).

**Models fail differently**: When explaining jokes without help, scores ran from 36% for Haiku and Qwen all the way to 84% for GPT-5.6 Sol, but the top handful of models were bunched so tightly that it's hard to say any of them is superior.

For some reason, I had expected to find a gap in humor between Claude and everyone else. Maybe it was because Anthropic's models used to be noticeably better at writing, or maybe I was influenced by all the marketing that Anthropic does, but alas, the scores didn't show that.

What did differ was how models were wrong. Haiku hedged on every one of its wrong answers, while Qwen confidently made something up on all of its mistakes. This included my favorite hallucination of all time: that the hourglass on LeBron's shelf is — I kid you not — "Sandy Cheeks' air supply from SpongeBob SquarePants."

### Where JesterBench falls short

**There are levels to this**: In theory, there are multiple levels of difficulty we could give to a model/agent when doing this humor evaluation. Roughly ordered in ascending difficulty:
- Referent mode: Model is given a description of the evidence and the referent, and asked to produce the joke mechanism.
- Normal mode: Model is given a description of the evidence, and asked to produce the referent and the joke mechanism.
- Agentic mode: An agent is given the frame and asked to locate all joke(s) in the frame. For each joke, describe the evidence, referent, and the joke mechanism.
- Full agentic mode: An agent is given the entire video and asked to locate all jokes in the video. Similarly, for each joke, describe the evidence, referent, and the joke mechanism.

I focused on the normal mode and the referent mode because the agentic modes introduce the complexity of harness evaluations (e.g., the evaluation then becomes dependent on the harness quality, rather than just focusing on the model's knowledge and understanding).

Another way of saying this: I was both time and token constrained for this project!

**The dataset is tiny**: In total, I annotated 79 moments from a single episode. I used 45 for the benchmark and held out the remaining as a validation set. This is an extremely small amount of data, and I'd need to annotate more Hero x Ball episodes to expand the benchmark. More importantly, I'd need to expand data collection to different corners of humor, so the humor benchmark wouldn't overindex on NBA and anime trivia, as entertaining as that might be.

**Understanding humor vs. generating humor**: While I started with the initial goal of seeing if models could be funny, the direction shifted to testing if models could understand (a very specific type of) humor. My underlying assumption is that understanding humor is a prerequisite to creating humor, but it could turn out that these skills are orthogonal!

**Some jokes require continuity**: I split the video into individual questions by hand, and each question came with a single key frame of the video. But if you actually watch the episode, many jokes play out across several moments. For example, the "I am taking my talents to... immortality" scene is much funnier because the shot right before it has LeBron wearing his infamous checkered shirt from The Decision. For this benchmark, each question is asked in isolation, with no memory of the other questions or scenes. Running the benchmark in full agentic mode would solve this somewhat, but may also require extending the annotations and rewriting the rubrics. 

**More tokens for more attempts**: In this experiment, every model got exactly one attempt at each question. Models are a little random, so a single answer is a noisy read. With more tokens, I'd have sampled each question five or ten times, which would help give a bit more stability to the estimated ability of the models. In hindsight, I should have also thrown in some much weaker models in the evaluation to create more dispersion in scores.

**Judging and rubrics**: Every answer was graded by Claude Sonnet 5. I started with Opus 5 as the judge, but when I tested both against my own grades, Opus wasn't any closer to me, and Sonnet is a lot cheaper to run. 

There's a fair argument that a judge might go easier on models from its own family. Ideally, I'd use a panel of judges from different labs and take a majority vote, but that multiplies the grading bill.

I did check the Sonnet judge against my own grading sensibilities. I graded 30 answers blind, with the model names and the judge's grades hidden, and the judge agreed with me on all referent identifications and the vast majority of the joke explanations. That's encouraging, but a more expansive judge calibration run should include many more than 30 samples.

### Hearing the same music

Some time ago, I was listening to a podcast between Neal Stephenson and Lex Fridman, and I remember a particular portion where they were musing about human connection.

Stephenson shared a simple observation about how he made friends in college. Someone at the cafeteria table makes a funny remark, and you catch the eye of a stranger at the other end: "Nobody else appears to get the joke or understand what happened, but random stranger and I, we just happened to have this connection." Lex put it a bit more simply: you both hear the same music, and others don't.

That's the feeling this episode gave me. "Man's Search for Screening" uniquely resonates if you've read Viktor Frankl *and* one of your main assets on the court is the ability to set bone-crushing screens. Somehow I don't think there are that many people in that particular Venn diagram. The jokes felt like they were written for an audience of one — me.

In some ways, the core of the joke — the referent — is that shared music. It's what I was trying to measure with this eval. As the results showed, once a model has it, the mechanism (and understanding of the joke) mostly takes care of itself. And the smarter models show an impressive ability to identify the core elements of these jokes, even within such a niche brand of humor.

The reader in me is excited about this: if models can unpack a joke this dense, maybe they aren't far from writing something I'd actually want to read?

The friend in me is more wary. Catching someone's eye across the proverbial cafeteria table is how friendships start, and it means something because it's rare. Most people at the table don't hear the music. A model that hears it every time, for everyone, at any hour, is a very easy friend to have.

Still, there's one joke that neither I nor the models can explain. At 0:29, Draymond yells "Sorry, LeBron — they're making me!" with such a specific inflection that I'm convinced it's a reference to something. I racked my brain for possible connections, and none of the models could figure it out either.

So if you get it, please reach out.

Apparently we're about to become friends.


---

## References

[[Hero x Ball LeBron v. Steph and the Warriors annotations]] 
[[The asymmetric cost of AI bullshit]]
[[The basis for depth in human connection is hearing the same music while others don't]]
[[A primer on RL environments]]

[^1]: The mechanism, on the other hand, seems to be the most instinctive to people, even if they might not know the formal name for it. It can be irony, a pun, a metaphor taken literally, a callback, or any number of other mechanisms. Different people have different affinities for joke types, but we all intuitively understand them.
