import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TODO: Replace with your actual Firebase project configuration
// Get this from: Firebase Console -> Project Overview -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
  apiKey: "AIzaSyBrkLTZJfV-y2FH-BzBBt64yomwV3DujPU",
  authDomain: "rbdailyquest.firebaseapp.com",
  projectId: "rbdailyquest",
  storageBucket: "rbdailyquest.firebasestorage.app",
  messagingSenderId: "280210832999",
  appId: "1:280210832999:web:82779265df794348865ec2",
  measurementId: "G-0XD5RWD1GT"
};

// Initialize Firebase
// Note: Errors here are caught in init() to fallback to local data if config is missing
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase not configured. Using local fallback data.");
}

const LOCAL_DATA = {
  poems: [
    {
      title: "The Road Not Taken",
      author: "Robert Frost",
      year: 1916,
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44272/the-road-not-taken",
      note: "A classic meditation on choice and consequence.",
      text: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`
    },
    {
      title: "The Love Song of J. Alfred Prufrock",
      author: "T. S. Eliot",
      year: 1915,
      source: "Poets.org",
      url: "https://poets.org/poem/love-song-j-alfred-prufrock",
      note: "Modernist uncertainty and longing in brilliant cadence.",
      text: `S’io credesse che mia risposta fosse
A persona che mai tornasse al mondo,
Questa fiamma staria senza piu scosse.
Ma perciocche giammai di questo fondo
Non torno vivo alcun, s’i’odo il vero,
Senza tema d'infamia ti rispondo.

Let us go then, you and I,
When the evening is spread out against the sky
Like a patient etherized upon a table;
Let us go, through certain half-deserted streets,
The muttering retreats
Of restless nights in one-night cheap hotels
And sawdust restaurants with oyster-shells:
Streets that follow like a tedious argument
Of insidious intent
To lead you to an overwhelming question …
Oh, do not ask, “What is it?”
Let us go and make our visit.

In the room the women come and go
Talking of Michelangelo.

The yellow fog that rubs its back upon the window-panes,
The yellow smoke that rubs its muzzle on the window-panes
Licked its tongue into the corners of the evening,
Lingered upon the pools that stand in drains,
Let fall upon its back the soot that falls from chimneys,
Slipped by the terrace, made a sudden leap,
And seeing that it was a soft October night,
Curled once about the house, and fell asleep.

And indeed there will be time
For the yellow smoke that slides along the street,
Rubbing its back upon the window-panes;
There will be time, there will be time
To prepare a face to meet the faces that you meet;
There will be time to murder and create,
And time for all the works and days of hands
That lift and drop a question on your plate;
Time for you and time for me,
And time yet for a hundred indecisions,
And for a hundred visions and revisions,
Before the taking of a toast and tea.

In the room the women come and go
Talking of Michelangelo.

And indeed there will be time
To wonder, “Do I dare?” and, “Do I dare?”
Time to turn back and descend the stair,
With a bald spot in the middle of my hair—
[They will say: “How his hair is growing thin!”]
My morning coat, my collar mounting firmly to the chin,
My necktie rich and modest, but asserted by a simple pin—
[They will say: “But how his arms and legs are thin!”]
Do I dare
Disturb the universe?
In a minute there is time
For decisions and revisions which a minute will reverse.

For I have known them all already, known them all—
Have known the evenings, mornings, afternoons,
I have measured out my life with coffee spoons;
I know the voices dying with a dying fall
Beneath the music from a farther room.
     So how should I presume?

And I have known the eyes already, known them all—
The eyes that fix you in a formulated phrase,
And when I am formulated, sprawling on a pin,
When I am pinned and wriggling on the wall,
Then how should I begin
To spit out all the butt-ends of my days and ways?
     And how should I presume?

And I have known the arms already, known them all—
Arms that are braceleted and white and bare
[But in the lamplight, downed with light brown hair!]
Is it perfume from a dress
That makes me so digress?
Arms that lie along a table, or wrap about a shawl.
     And should I then presume?
     And how should I begin?

. . . . .

Shall I say, I have gone at dusk through narrow streets
And watched the smoke that rises from the pipes
Of lonely men in shirt-sleeves, leaning out of windows? …

I should have been a pair of ragged claws
Scuttling across the floors of silent seas.

. . . . .

And the afternoon, the evening, sleeps so peacefully!
Smoothed by long fingers,
Asleep … tired … or it malingers,
Stretched on the floor, here beside you and me.
Should I, after tea and cakes and ices,
Have the strength to force the moment to its crisis?
But though I have wept and fasted, wept and prayed,
Though I have seen my head [grown slightly bald] brought in upon a platter,
I am no prophet—and here’s no great matter;
I have seen the moment of my greatness flicker,
And I have seen the eternal Footman hold my coat, and snicker,
And in short, I was afraid.

And would it have been worth it, after all,
After the cups, the marmalade, the tea,
Among the porcelain, among some talk of you and me,
Would it have been worth while,
To have bitten off the matter with a smile,
To have squeezed the universe into a ball
To roll it toward some overwhelming question,
To say: “I am Lazarus, come from the dead,
Come back to tell you all, I shall tell you all”—
If one, settling a pillow by her head,
     Should say: “That is not what I meant at all.
     That is not it, at all.”

And would it have been worth it, after all,
Would it have been worth while,
After the sunsets and the dooryards and the sprinkled streets,
After the novels, after the teacups, after the skirts that trail along the floor—
And this, and so much more?—
It is impossible to say just what I mean!
But as if a magic lantern threw the nerves in patterns on a screen:
Would it have been worth while
If one, settling a pillow or throwing off a shawl,
And turning toward the window, should say:
     “That is not it at all,
     That is not what I meant, at all.”

. . . . .

No! I am not Prince Hamlet, nor was meant to be;
Am an attendant lord, one that will do
To swell a progress, start a scene or two,
Advise the prince; no doubt, an easy tool,
Deferential, glad to be of use,
Politic, cautious, and meticulous;
Full of high sentence, but a bit obtuse;
At times, indeed, almost ridiculous—
Almost, at times, the Fool.

I grow old … I grow old …
I shall wear the bottoms of my trousers rolled.

Shall I part my hair behind? Do I dare to eat a peach?
I shall wear white flannel trousers, and walk upon the beach.
I have heard the mermaids singing, each to each.

I do not think that they will sing to me.

I have seen them riding seaward on the waves
Combing the white hair of the waves blown back
When the wind blows the water white and black.

We have lingered in the chambers of the sea
By sea-girls wreathed with seaweed red and brown
Till human voices wake us, and we drown.`
    },
    {
      title: "If—",
      author: "Rudyard Kipling",
      year: 1910,
      source: "Poets.org",
      url: "https://poets.org/poem/if",
      note: "A timeless poem of resolve and resilience.",
      text: `If you can keep your head when all about you
   Are losing theirs and blaming it on you;
If you can trust yourself when all men doubt you,
   But make allowance for their doubting too;
If you can wait and not be tired by waiting,
   Or, being lied about, don’t deal in lies,
Or, being hated, don’t give way to hating,
   And yet don’t look too good, nor talk too wise;

If you can dream—and not make dreams your master;
   If you can think—and not make thoughts your aim;
If you can meet with triumph and disaster
   And treat those two impostors just the same;
If you can bear to hear the truth you’ve spoken
   Twisted by knaves to make a trap for fools,
Or watch the things you gave your life to broken,
   And stoop and build ’em up with wornout tools;

If you can make one heap of all your winnings
   And risk it on one turn of pitch-and-toss,
And lose, and start again at your beginnings
   And never breathe a word about your loss;
If you can force your heart and nerve and sinew
   To serve your turn long after they are gone,
And so hold on when there is nothing in you
   Except the Will which says to them: “Hold on”;

If you can talk with crowds and keep your virtue,
   Or walk with kings—nor lose the common touch;
If neither foes nor loving friends can hurt you;
   If all men count with you, but none too much;
If you can fill the unforgiving minute
   With sixty seconds’ worth of distance run—
   Yours is the Earth and everything that’s in it,
And—which is more—you’ll be a Man, my son!`
    },
    {
      title: "Because I could not stop for Death",
      author: "Emily Dickinson",
      year: 1890,
      source: "Poets.org",
      url: "https://poets.org/poem/because-i-could-not-stop-death-479",
      note: "An unforgettable ride with eternity.",
      text: `Because I could not stop for Death—
He kindly stopped for me—
The Carriage held but just Ourselves—
And Immortality.

We slowly drove— He knew no haste
And I had put away
My labor and my leisure too,
For His Civility—

We passed the School, where Children strove
At Recess— in the Ring—
We passed the Fields of Gazing Grain—
We passed the Setting Sun—

Or rather— He passed us—
The Dews drew quivering and chill—
For only Gossamer, my Gown—
My Tippet— only Tulle—

We paused before a House that seemed
A Swelling of the Ground—
The Roof was scarcely visible—
The Cornice— in the Ground—

Since then— ’tis Centuries— and yet
Feels shorter than the Day
I first surmised the Horses’ Heads
Were toward Eternity—`
    },
    {
      title: "Ode to a Nightingale",
      author: "John Keats",
      year: 1819,
      source: "Poetry Foundation",
      url: "https://www.poetryfoundation.org/poems/44479/ode-to-a-nightingale",
      note: "An ode to beauty, impermanence, and escape.",
      text: `1.
My heart aches, and a drowsy numbness pains
    My sense, as though of hemlock I had drunk,
Or emptied some dull opiate to the drains
    One minute past, and Lethe-wards had sunk:
'Tis not through envy of thy happy lot,
    But being too happy in thine happiness,—
        That thou, light-winged Dryad of the trees,
                In some melodious plot
    Of beechen green, and shadows numberless,
        Singest of summer in full-throated ease.

2.
O, for a draught of vintage! that hath been
    Cool'd a long age in the deep-delved earth,
Tasting of Flora and the country green,
    Dance, and Provençal song, and sunburnt mirth!
O for a beaker full of the warm South,
    Full of the true, the blushful Hippocrene,
        With beaded bubbles winking at the brim,
                And purple-stained mouth;
    That I might drink, and leave the world unseen,
        And with thee fade away into the forest dim:

3.
Fade far away, dissolve, and quite forget
    What thou among the leaves hast never known,
The weariness, the fever, and the fret
    Here, where men sit and hear each other groan;
Where palsy shakes a few, sad, last gray hairs,
    Where youth grows pale, and spectre-thin, and dies;
        Where but to think is to be full of sorrow
                And leaden-eyed despairs,
    Where Beauty cannot keep her lustrous eyes,
        Or new Love pine at them beyond to-morrow.

4.
Away! away! for I will fly to thee,
    Not charioted by Bacchus and his pards,
But on the viewless wings of Poesy,
    Though the dull brain perplexes and retards:
Already with thee! tender is the night,
    And haply the Queen-Moon is on her throne,
        Cluster'd around by all her starry Fays;
                But here there is no light,
    Save what from heaven is with the breezes blown
        Through verdurous glooms and winding mossy ways.

5.
I cannot see what flowers are at my feet,
    Nor what soft incense hangs upon the boughs,
But, in embalmed darkness, guess each sweet
    Wherewith the seasonable month endows
The grass, the thicket, and the fruit-tree wild;
    White hawthorn, and the pastoral eglantine;
        Fast fading violets cover'd up in leaves;
                And mid-May's eldest child,
    The coming musk-rose, full of dewy wine,
        The murmurous haunt of flies on summer eves.

6.
Darkling I listen; and, for many a time
    I have been half in love with easeful Death,
Call'd him soft names in many a mused rhyme,
    To take into the air my quiet breath;
Now more than ever seems it rich to die,
    To cease upon the midnight with no pain,
        While thou art pouring forth thy soul abroad
                In such an ecstasy!
    Still wouldst thou sing, and I have ears in vain—
        To thy high requiem become a sod.

7.
Thou wast not born for death, immortal Bird!
    No hungry generations tread thee down;
The voice I hear this passing night was heard
    In ancient days by emperor and clown:
Perhaps the self-same song that found a path
    Through the sad heart of Ruth, when, sick for home,
        She stood in tears amid the alien corn;
                The same that oft-times hath
    Charm'd magic casements, opening on the foam
        Of perilous seas, in faery lands forlorn.

8.
Forlorn! the very word is like a bell
    To toll me back from thee to my sole self!
Adieu! the fancy cannot cheat so well
    As she is fam'd to do, deceiving elf.
Adieu! adieu! thy plaintive anthem fades
    Past the near meadows, over the still stream,
        Up the hill-side; and now 'tis buried deep
                In the next valley-glades:
    Was it a vision, or a waking dream?
        Fled is that music:—Do I wake or sleep?`
    },
  ],
  essays: [
    {
      title: "Self-Reliance",
      author: "Ralph Waldo Emerson",
      year: 1841,
      source: "Emerson Central",
      url: "https://emersoncentral.com/texts/essays-first-series/self-reliance/",
      note: "A foundational call for individual thought.",
    },
    {
      title: "Civil Disobedience",
      author: "Henry David Thoreau",
      year: 1849,
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/71",
      note: "A fierce argument for conscience over compliance.",
    },
    {
      title: "A Room of One’s Own",
      author: "Virginia Woolf",
      year: 1929,
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/14036",
      note: "A luminous essay on art, space, and freedom.",
    },
    {
      title: "A Modest Proposal",
      author: "Jonathan Swift",
      year: 1729,
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/files/1080/1080-h/1080-h.htm",
      note: "A satirical masterpiece on rational cruelty.",
      text: `It is a melancholy object to those, who walk through this great town, or travel in the country, when they see the streets, the roads, and cabbin-doors crowded with beggars of the female sex, followed by three, four, or six children, all in rags, and importuning every passenger for an alms.

I think it is agreed by all parties, that this prodigious number of children in the arms, or on the backs, or at the heels of their mothers, and frequently of their fathers, is in the present deplorable state of the kingdom, a very great additional grievance; and therefore whoever could find out a fair, cheap and easy method of making these children sound and useful members of the commonwealth, would deserve so well of the publick, as to have his statue set up for a preserver of the nation.

But my intention is very far from being confined to provide only for the children of professed beggars: it is of a much greater extent, and shall take in the whole number of infants at a certain age, who are born of parents in effect as little able to support them, as those who demand our charity in the streets.

As to my own part, having turned my thoughts for many years upon this important subject, and maturely weighed the several schemes of our projectors, I have always found them grossly mistaken in their computation. It is true, a child just dropt from its dam, may be supported by her milk, for a solar year, with little other nourishment: at most not above the value of two shillings, which the mother may certainly get, or the value in scraps, by her lawful occupation of begging; and it is exactly at one year old that I propose to provide for them in such a manner, as, instead of being a charge upon their parents, or the parish, or wanting food and raiment for the rest of their lives, they shall, on the contrary, contribute to the feeding, and partly to the clothing of many thousands.

I shall now therefore humbly propose my own thoughts, which I hope will not be liable to the least objection.

I have been assured by a very knowing American of my acquaintance in London, that a young healthy child well nursed, is, at a year old, a most delicious nourishing and wholesome food, whether stewed, roasted, baked, or boiled; and I make no doubt that it will equally serve in a fricasee, or a ragoust.

I do therefore humbly offer it to publick consideration, that of the hundred and twenty thousand children, already computed, twenty thousand may be reserved for breed, whereof only one fourth part to be males; which is more than we allow to sheep, black cattle, or swine, and my reason is, that these children are seldom the fruits of marriage, a circumstance not much regarded by our savages, therefore, one male will be sufficient to serve four females. That the remaining hundred thousand may, at a year old, be offered in sale to the persons of quality and fortune, through the kingdom, always advising the mother to let them suck plentifully in the last month, so as to render them plump, and fat for a good table. A child will make two dishes at an entertainment for friends, and when the family dines alone, the fore or hind quarter will make a reasonable dish, and seasoned with a little pepper or salt, will be very good boiled on the fourth day, especially in winter.

I have reckoned upon a medium, that a child just born will weigh 12 pounds, and in a solar year, if tolerably nursed, encreaseth to 28 pounds.

I grant this food will be somewhat dear, and therefore very proper for landlords, who, as they have already devoured most of the parents, seem to have the best title to the children.

I can think of no one objection, that will possibly be raised against this proposal, unless it should be urged, that the number of people will be thereby much lessened in the kingdom. This I freely own, and was indeed one principal design in offering it to the world. I desire the reader will observe, that I calculate my remedy for this one individual Kingdom of Ireland, and for no other that ever was, is, or, I think, ever can be upon Earth. Therefore let no man talk to me of other expedients: Of taxing our absentees at five shillings a pound: Of using neither clothes, nor houshold furniture, except what is of our own growth and manufacture: Of utterly rejecting the materials and instruments that promote foreign luxury: Of curing the expensiveness of pride, vanity, idleness, and gaming in our women: Of introducing a vein of parsimony, prudence and temperance: Of learning to love our country, wherein we differ even from Laplanders, and the inhabitants of Topinamboo: Of quitting our animosities and factions, nor acting any longer like the Jews, who were murdering one another at the very moment their city was taken: Of being a little cautious not to sell our country and consciences for nothing: Of teaching landlords to have at least one degree of mercy towards their tenants. Lastly, of putting a spirit of honesty, industry, and skill into our shopkeepers, who, if a resolution could now be taken to buy only our native goods, would immediately unite to cheat and exact upon us in the price, the measure, and the goodness, nor could ever yet be brought to make one fair proposal of just dealing, though often and earnestly invited to it.

Therefore I repeat, let no man talk to me of these and the like expedients, till he hath at least some glympse of hope, that there will ever be some hearty and sincere attempt to put them into practice.

I profess in the sincerity of my heart, that I have not the least personal interest in endeavouring to promote this necessary work, having no other motive than the publick good of my country, by advancing our trade, providing for infants, relieving the poor, and giving some pleasure to the rich. I have no children, by which I can propose to get a single penny; the youngest being nine years old, and my wife past child-bearing.`
    },
    {
      title: "Politics and the English Language",
      author: "George Orwell",
      year: 1946,
      source: "The Orwell Foundation",
      url: "https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/",
      note: "A defense of clear thinking and clear writing.",
    },
  ],
  stories: [
    {
      title: "The Gift of the Magi",
      author: "O. Henry",
      year: 1905,
      source: "American Literature",
      url: "https://americanliterature.com/author/o-henry/short-story/the-gift-of-the-magi",
      note: "A classic tale of sacrifice and love.",
      text: `One dollar and eighty-seven cents. That was all. And sixty cents of it was in pennies. Pennies saved one and two at a time by bulldozing the grocer and the vegetable man and the butcher until one’s cheeks burned with the silent imputation of parsimony that such close dealing implied. Three times Della counted it. One dollar and eighty-seven cents. And the next day would be Christmas.

There was clearly nothing to do but flop down on the shabby little couch and howl. So Della did it. Which instigates the moral reflection that life is made up of sobs, sniffles, and smiles, with sniffles predominating.

While the mistress of the home is gradually subsiding from the first stage to the second, take a look at the home. A furnished flat at $8 per week. It did not exactly beggar description, but it certainly had that word on the lookout for the mendicancy squad.

In the vestibule below was a letter-box into which no letter would go, and an electric button from which no mortal finger could coax a ring. Also appertaining thereunto was a card bearing the name “Mr. James Dillingham Young.”

The “Dillingham” had been flung to the breeze during a former period of prosperity when its possessor was being paid $30 per week. Now, when the income was shrunk to $20, though, they were thinking seriously of contracting to a modest and unassuming D. But whenever Mr. James Dillingham Young came home and reached his flat above he was called “Jim” and greatly hugged by Mrs. James Dillingham Young, already introduced to you as Della. Which is all very good.

Della finished her cry and attended to her cheeks with the powder rag. She stood by the window and looked out dully at a gray cat walking a gray fence in a gray backyard. Tomorrow would be Christmas Day, and she had only $1.87 with which to buy Jim a present. She had been saving every penny she could for months, with this result. Twenty dollars a week doesn’t go far. Expenses had been greater than she had calculated. They always are. Only $1.87 to buy a present for Jim. Her Jim. Many a happy hour she had spent planning for something nice for him. Something fine and rare and sterling—something just a little bit near to being worthy of the honor of being owned by Jim.

There was a pier glass between the windows of the room. Perhaps you have seen a pier glass in an $8 flat. A very thin and very agile person may, by observing his reflection in a rapid sequence of longitudinal strips, obtain a fairly accurate conception of his looks. Della, being slender, had mastered the art.

Suddenly she whirled from the window and stood before the glass. Her eyes were shining brilliantly, but her face had lost its color within twenty seconds. Rapidly she pulled down her hair and let it fall to its full length.

Now, there were two possessions of the James Dillingham Youngs in which they both took a mighty pride. One was Jim’s gold watch that had been his father’s and his grandfather’s. The other was Della’s hair. Had the queen of Sheba lived in the flat across the airshaft, Della would have let her hair hang out the window some day to dry just to depreciate Her Majesty’s jewels and gifts. Had King Solomon been the janitor, with all his treasures piled up in the basement, Jim would have pulled out his watch every time he passed, just to see him pluck at his beard from envy.

So now Della’s beautiful hair fell about her rippling and shining like a cascade of brown waters. It reached below her knee and made itself almost a garment for her. And then she did it up again nervously and quickly. Once she faltered for a minute and stood still while a tear or two splashed on the worn red carpet.

On went her old brown jacket; on went her old brown hat. With a whirl of skirts and with the brilliant sparkle still in her eyes, she fluttered out the door and down the stairs to the street.

Where she stopped the sign read: “Mme. Sofronie. Hair Goods of All Kinds.” One flight up Della ran, and collected herself, panting. Madame, large, too white, chilly, hardly looked the “Sofronie.”

“Will you buy my hair?” asked Della.

“I buy hair,” said Madame. “Take yer hat off and let’s have a sight at the looks of it.”

Down rippled the brown cascade.

“Twenty dollars,” said Madame, lifting the mass with a practised hand.

“Give it to me quick,” said Della.

Oh, and the next two hours tripped by on rosy wings. Forget the hashed metaphor. She was ransacking the stores for Jim’s present.

She found it at last. It surely had been made for Jim and no one else. There was no other like it in any of the stores, and she had turned all of them inside out. It was a platinum fob chain simple and chaste in design, properly proclaiming its value by substance alone and not by meretricious ornamentation—as all good things should do. It was even worthy of The Watch. As soon as she saw it she knew that it must be Jim’s. It was like him. Quietness and value—the description applied to both. Twenty-one dollars they took from her for it, and she hurried home with the 87 cents. With that chain on his watch Jim might be properly anxious about the time in any company. Grand as the watch was, he sometimes looked at it on the sly on account of the old leather strap that he used in place of a chain.

When Della reached home her intoxication gave way a little to prudence and reason. She got out her curling irons and lighted the gas and went to work repairing the ravages made by generosity added to love. Which is always a tremendous task, dear friends—a mammoth task.

Within forty minutes her head was covered with tiny, close-lying curls that made her look wonderfully like a truant schoolboy. She looked at her reflection in the mirror long, carefully, and critically.

“If Jim doesn’t kill me,” she said to herself, “before he takes a second look at me, he’ll say I look like a Coney Island chorus girl. But what could I do—oh! what could I do with a dollar and eighty-seven cents?”

At 7 o’clock the coffee was made and the frying-pan was on the back of the stove hot and ready to cook the chops.

Jim was never late. Della doubled the fob chain in her hand and sat on the corner of the table near the door that he always entered. Then she heard his step on the stair away down on the first flight, and she turned white for just a moment. She had a habit of saying a little silent prayer about the simplest everyday things, and now she whispered: “Please God, make him think I am still pretty.”

The door opened and Jim stepped in and closed it. He looked thin and very serious. Poor fellow, he was only twenty-two—and to be burdened with a family! He needed a new overcoat and he was without gloves.

Jim stopped inside the door, as immovable as a setter at the scent of quail. His eyes were fixed upon Della, and there was an expression in them that she could not read, and it terrified her. It was not anger, nor surprise, nor disapproval, nor horror, nor any of the sentiments that she had been prepared for. He simply stared at her fixedly with that peculiar expression on his face.

Della wriggled off the table and went for him.

“Jim, darling,” she cried, “don’t look at me that way. I had my hair cut off and sold because I couldn’t have lived through Christmas without giving you a present. It’ll grow out again—you won’t mind, will you? I just had to do it. My hair grows awfully fast. Say ‘Merry Christmas!’ Jim, and let’s be happy. You don’t know what a nice—what a beautiful, nice gift I’ve got for you.”

“You’ve cut off your hair?” asked Jim, laboriously, as if he had not arrived at that patent fact yet even after the hardest mental labor.

“Cut it off and sold it,” said Della. “Don’t you like me just as well, anyhow? I’m me without my hair, ain’t I?”

Jim looked about the room curiously.

“You say your hair is gone?” he said, with an air almost of idiocy.

“You needn’t look for it,” said Della. “It’s sold, I tell you—sold and gone, too. It’s Christmas Eve, boy. Be good to me, for it went for you. Maybe the hairs of my head were numbered,” she went on with sudden serious sweetness, “but nobody could ever count my love for you. Shall I put the chops on, Jim?”

Out of his trance Jim seemed quickly to wake. He enfolded his Della. For ten seconds let us regard with discreet scrutiny some inconsequential object in the other direction. Eight dollars a week or a million a year—what is the difference? A mathematician or a wit would give you the wrong answer. The magi brought valuable gifts, but that was not among them. This dark assertion will be illuminated later on.

Jim drew a package from his overcoat pocket and threw it upon the table.

“Don’t make any mistake, Dell,” he said, “about me. I don’t think there’s anything in the way of a haircut or a shave or a shampoo that could make me like my girl any less. But if you’ll unwrap that package you may see why you had me going a while at first.”

White fingers and nimble tore at the string and paper. And then an ecstatic scream of joy; and then, alas! a quick feminine change to hysterical tears and wails, necessitating the immediate employment of all the comforting powers of the lord of the flat.

For there lay The Combs—the set of combs, side and back, that Della had worshipped long in a Broadway window. Beautiful combs, pure tortoise shell, with jewelled rims—just the shade to wear in the beautiful vanished hair. They were expensive combs, she knew, and her heart had simply craved and yearned over them without the least hope of possession. And now, they were hers, but the tresses that should have adorned the coveted adornments were gone.

But she hugged them to her bosom, and at length she was able to look up with dim eyes and a smile and say: “My hair grows so fast, Jim!”

And then Della leaped up like a little singed cat and cried, “Oh, oh!”

Jim had not yet seen his beautiful present. She held it out to him eagerly upon her open palm. The dull precious metal seemed to flash with a reflection of her bright and ardent spirit.

“Isn’t it a dandy, Jim? I hunted all over town to find it. You’ll have to look at the time a hundred times a day now. Give me your watch. I want to see how it looks on it.”

Instead of obeying, Jim tumbled down on the couch and put his hands under the back of his head and smiled.

“Dell,” said he, “let’s put our Christmas presents away and keep ’em a while. They’re too nice to use just at present. I sold the watch to get the money to buy your combs. And now suppose you put the chops on.”

The magi, as you know, were wise men—wonderfully wise men—who brought gifts to the Babe in the manger. They invented the art of giving Christmas presents. Being wise, their gifts were no doubt wise ones, possibly bearing the privilege of exchange in case of duplication. And here I have lamely related to you the uneventful chronicle of two foolish children in a flat who most unwisely sacrificed for each other the greatest treasures of their house. But in a last word to the wise of these days let it be said that of all who give gifts these two were the wisest. Of all who give and receive gifts, such as they are wisest. Everywhere they are wisest. They are the magi.`
    },
    {
      title: "The Tell-Tale Heart",
      author: "Edgar Allan Poe",
      year: 1843,
      source: "American Literature",
      url: "https://americanliterature.com/author/edgar-allan-poe/short-story/the-tell-tale-heart",
      note: "A chilling study of guilt and obsession.",
      text: `TRUE! -- nervous -- very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses -- not destroyed -- not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily -- how calmly I can tell you the whole story.

It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. Object there was none. Passion there was none. I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye! yes, it was this! He had the eye of a vulture --a pale blue eye, with a film over it. Whenever it fell upon me, my blood ran cold; and so by degrees -- very gradually --I made up my mind to take the life of the old man, and thus rid myself of the eye forever.

Now this is the point. You fancy me mad. Madmen know nothing. But you should have seen me. You should have seen how wisely I proceeded --with what caution --with what foresight --with what dissimulation I went to work! I was never kinder to the old man than during the whole week before I killed him. And every night, about midnight, I turned the latch of his door and opened it --oh so gently! And then, when I had made an opening sufficient for my head, I put in a dark lantern, all closed, closed, so that no light shone out, and then I thrust in my head. Oh, you would have laughed to see how cunningly I thrust it in! I moved it slowly --very, very slowly, so that I might not disturb the old man's sleep. It took me an hour to place my whole head within the opening so far that I could see him as he lay upon his bed. Ha! --would a madman have been so wise as this? And then, when my head was well in the room, I undid the lantern cautiously --oh, so cautiously --cautiously (for the hinges creaked) --I undid it just so much that a single thin ray fell upon the vulture eye. And this I did for seven long nights --every night just at midnight --but I found the eye always closed; and so it was impossible to do the work; for it was not the old man who vexed me, but his Evil Eye. And every morning, when the day broke, I went boldly into the chamber, and spoke courageously to him, calling him by name in a hearty tone, and inquiring how he has passed the night. So you see he would have been a very profound old man, indeed, to suspect that every night, just at twelve, I looked in upon him while he slept.

Upon the eighth night I was more than usually cautious in opening the door. A watch's minute hand moves more quickly than did mine. Never before that night had I felt the extent of my own powers --of my sagacity. I could scarcely contain my feelings of triumph. To think that there I was, opening the door, little by little, and he not even to dream of my secret deeds or thoughts. I fairly chuckled at the idea; and perhaps he heard me; for he moved on the bed suddenly, as if startled. Now you may think that I drew back --but no. His room was as black as pitch with the thick darkness, (for the shutters were close fastened, through fear of robbers,) and so I knew that he could not see the opening of the door, and I kept pushing it on steadily, steadily.

I had my head in, and was about to open the lantern, when my thumb slipped upon the tin fastening, and the old man sprang up in bed, crying out --"Who's there?"

I kept quite still and said nothing. For a whole hour I did not move a muscle, and in the meantime I did not hear him lie down. He was still sitting up in the bed listening; --just as I have done, night after night, hearkening to the death watches in the wall.

Presently I heard a slight groan, and I knew it was the groan of mortal terror. It was not a groan of pain or of grief --oh, no! --it was the low stifled sound that arises from the bottom of the soul when overcharged with awe. I knew the sound well. Many a night, just at midnight, when all the world slept, it has welled up from my own bosom, deepening, with its dreadful echo, the terrors that distracted me. I say I knew it well. I knew what the old man felt, and pitied him, although I chuckled at heart. I knew that he had been lying awake ever since the first slight noise, when he had turned in the bed. His fears had been ever since growing upon him. He had been trying to fancy them causeless, but could not. He had been saying to himself --"It is nothing but the wind in the chimney --it is only a mouse crossing the floor," or "It is merely a cricket which has made a single chirp." Yes, he had been trying to comfort himself with these suppositions: but he had found all in vain. All in vain; because Death, in approaching him had stalked with his black shadow before him, and enveloped the victim. And it was the mournful influence of the unperceived shadow that caused him to feel --although he neither saw nor heard --to feel the presence of my head within the room.

When I had waited a long time, very patiently, without hearing him lie down, I resolved to open a little --a very, very little crevice in the lantern. So I opened it --you cannot imagine how stealthily, stealthily --until, at length a single dim ray, like the thread of the spider, shot from out the crevice and fell full upon the vulture eye.

It was open --wide, wide open --and I grew furious as I gazed upon it. I saw it with perfect distinctness --all a dull blue, with a hideous veil over it that chilled the very marrow in my bones; but I could see nothing else of the old man's face or person: for I had directed the ray as if by instinct, precisely upon the damned spot.

And have I not told you that what you mistake for madness is but over acuteness of the senses? --now, I say, there came to my ears a low, dull, quick sound, such as a watch makes when enveloped in cotton. I knew that sound well, too. It was the beating of the old man's heart. It increased my fury, as the beating of a drum stimulates the soldier into courage.

But even yet I refrained and kept still. I scarcely breathed. I held the lantern motionless. I tried how steadily I could maintain the ray upon the eye. Meantime the hellish tattoo of the heart increased. It grew quicker and quicker, and louder and louder every instant. The old man's terror must have been extreme! It grew louder, I say, louder every moment! --do you mark me well? I have told you that I am nervous: so I am. And now at the dead hour of the night, amid the dreadful silence of that old house, so strange a noise as this excited me to uncontrollable terror. Yet, for some minutes longer I refrained and stood still. But the beating grew louder, louder! I thought the heart must burst. And now a new anxiety seized me --the sound would be heard by a neighbor! The old man's hour had come! With a loud yell, I threw open the lantern and leaped into the room. He shrieked once --once only. In an instant I dragged him to the floor, and pulled the heavy bed over him. I then smiled gaily, to find the deed so far done. But, for many minutes, the heart beat on with a muffled sound. This, however, did not vex me; it would not be heard through the wall. At length it ceased. The old man was dead. I removed the bed and examined the corpse. Yes, he was stone, stone dead. I placed my hand upon the heart and held it there many minutes. There was no pulsation. He was stone dead. His eye would trouble me no more.

If still you think me mad, you will think so no longer when I describe the wise precautions I took for the concealment of the body. The night waned, and I worked hastily, but in silence. First of all I dismembered the corpse. I cut off the head and the arms and the legs.

I then took up three planks from the flooring of the chamber, and deposited all between the scantlings. I then replaced the boards so cleverly, so cunningly, that no human eye -- not even his --could have detected any thing wrong. There was nothing to wash out --no stain of any kind --no blood-spot whatever. I had been too wary for that. A tub had caught all --ha! ha!

When I had made an end of these labors, it was four o'clock --still dark as midnight. As the bell sounded the hour, there came a knocking at the street door. I went down to open it with a light heart, --for what had I now to fear? There entered three men, who introduced themselves, with perfect suavity, as officers of the police. A shriek had been heard by a neighbor during the night; suspicion of foul play had been aroused; information had been lodged at the police office, and they (the officers) had been deputed to search the premises.

I smiled, --for what had I to fear? I bade the gentlemen welcome. The shriek, I said, was my own in a dream. The old man, I mentioned, was absent in the country. I took my visitors all over the house. I bade them search --search well. I led them, at length, to his chamber. I showed them his treasures, secure, undisturbed. In the enthusiasm of my confidence, I brought chairs into the room, and desired them here to rest from their fatigues, while I myself, in the wild audacity of my perfect triumph, placed my own seat upon the very spot beneath which reposed the corpse of the victim.

The officers were satisfied. My manner had convinced them. I was singularly at ease. They sat, and while I answered cheerily, they chatted of familiar things. But, ere long, I felt myself getting pale and wished them gone. My head ached, and I fancied a ringing in my ears: but still they sat and still chatted. The ringing became more distinct: --it continued and became more distinct: I talked more freely to get rid of the feeling: but it continued and gained definiteness --until, at length, I found that the noise was not within my ears.

No doubt I now grew very pale; --but I talked more fluently, and with a heightened voice. Yet the sound increased --and what could I do? It was a low, dull, quick sound --much such a sound as a watch makes when enveloped in cotton. I gasped for breath -- and yet the officers heard it not. I talked more quickly --more vehemently; but the noise steadily increased. I arose and argued about trifles, in a high key and with violent gesticulations; but the noise steadily increased. Why would they not be gone? I paced the floor to and fro with heavy strides, as if excited to fury by the observations of the men -- but the noise steadily increased. Oh God! what could I do? I foamed --I raved --I swore! I swung the chair upon which I had been sitting, and grated it upon the boards, but the noise arose over all and continually increased. It grew louder --louder --louder! And still the men chatted pleasantly, and smiled. Was it possible they heard not? Almighty God! --no, no! They heard! --they suspected! --they knew! --they were making a mockery of my horror! --this I thought, and this I think. But anything was better than this agony! Anything was more tolerable than this derision! I could bear those hypocritical smiles no longer! I felt that I must scream or die! --and now --again! --hark! louder! louder! louder! louder! --

"Villains!" I shrieked, "dissemble no more! I admit the deed! --tear up the planks! --here, here! --it is the beating of his hideous heart!"`
    },
    {
      title: "The Story of an Hour",
      author: "Kate Chopin",
      year: 1894,
      source: "American Literature",
      url: "https://americanliterature.com/author/kate-chopin/short-story/the-story-of-an-hour",
      note: "A razor-sharp exploration of freedom.",
      text: `Knowing that Mrs. Mallard was afflicted with a heart trouble, great care was taken to break to her as gently as possible the news of her husband's death.

It was her sister Josephine who told her, in broken sentences; veiled hints that revealed in half concealing. Her husband's friend Richards was there, too, near her. It was he who had been in the newspaper office when intelligence of the railroad disaster was received, with Brently Mallard's name leading the list of "killed." He had only taken the time to assure himself of its truth by a second telegram, and had hastened to forestall any less careful, less tender friend in bearing the sad message.

She did not hear the story as many women have heard the same, with a paralyzed inability to accept its significance. She wept at once, with sudden, wild abandonment, in her sister's arms. When the storm of grief had spent itself she went away to her room alone. She would have no one follow her.

There stood, facing the open window, a comfortable, roomy armchair. Into this she sank, pressed down by a physical exhaustion that haunted her body and seemed to reach into her soul.

She could see in the open square before her house the tops of trees that were all aquiver with the new spring life. The delicious breath of rain was in the air. In the street below a peddler was crying his wares. The notes of a distant song which some one was singing reached her faintly, and countless sparrows were twittering in the eaves.

There were patches of blue sky showing here and there through the clouds that had met and piled one above the other in the west facing her window.

She sat with her head thrown back upon the cushion of the chair, quite motionless, except when a sob came up into her throat and shook her, as a child who has cried itself to sleep continues to sob in its dreams.

She was young, with a fair, calm face, whose lines bespoke repression and even a certain strength. But now there was a dull stare in her eyes, whose gaze was fixed away off yonder on one of those patches of blue sky. It was not a glance of reflection, but rather indicated a suspension of intelligent thought.

There was something coming to her and she was waiting for it, fearfully. What was it? She did not know; it was too subtle and elusive to name. But she felt it, creeping out of the sky, reaching toward her through the sounds, the scents, the color that filled the air.

Now her bosom rose and fell tumultuously. She was beginning to recognize this thing that was approaching to possess her, and she was striving to beat it back with her will--as powerless as her two white slender hands would have been. When she abandoned herself a little whispered word escaped her slightly parted lips. She said it over and over under hte breath: "free, free, free!" The vacant stare and the look of terror that had followed it went from her eyes. They stayed keen and bright. Her pulses beat fast, and the coursing blood warmed and relaxed every inch of her body.

She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.

There would be no one to live for during those coming years; she would live for herself. There would be no powerful will bending hers in that blind persistence with which men and women believe they have a right to impose a private will upon a fellow-creature. A kind intention or a cruel intention made the act seem no less a crime as she looked upon it in that brief moment of illumination.

And yet she had loved him--sometimes. Often she had not. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!

"Free! Body and soul free!" she kept whispering.

Josephine was kneeling before the closed door with her lips to the keyhold, imploring for admission. "Louise, open the door! I beg; open the door--you will make yourself ill. What are you doing, Louise? For heaven's sake open the door."

"Go away. I am not making myself ill." No; she was drinking in a very elixir of life through that open window.

Her fancy was running riot along those days ahead of her. Spring days, and summer days, and all sorts of days that would be her own. She breathed a quick prayer that life might be long. It was only yesterday she had thought with a shudder that life might be long.

She arose at length and opened the door to her sister's importunities. There was a feverish triumph in her eyes, and she carried herself unwittingly like a goddess of Victory. She clasped her sister's waist, and together they descended the stairs. Richards stood waiting for them at the bottom.

Some one was opening the front door with a latchkey. It was Brently Mallard who entered, a little travel-stained, composedly carrying his grip-sack and umbrella. He had been far from the scene of the accident, and did not even know there had been one. He stood amazed at Josephine's piercing cry; at Richards' quick motion to screen him from the view of his wife.

When the doctors came they said she had died of heart disease--of the joy that kills.`
    },
    {
      title: "The Last Question",
      author: "Isaac Asimov",
      year: 1956,
      source: "East of the Web",
      url: "https://www.eastoftheweb.com/short-stories/UBooks/LastQues.shtml",
      note: "A cosmic story about humanity and entropy.",
    },
    {
      title: "The Open Window",
      author: "Saki",
      year: 1914,
      source: "Project Gutenberg",
      url: "https://www.gutenberg.org/ebooks/1477",
      note: "A witty, unsettling twist in miniature.",
    },
  ],
};

let libraryData = LOCAL_DATA;

const fetchLibrary = async () => {
  if (!db) return; // Fallback to local
  
  try {
    // 1. Fetch Stats/Counts
    const statsSnap = await getDoc(doc(db, "meta", "stats"));
    if (!statsSnap.exists()) {
      console.warn("No stats found in DB. Run migration or population script.");
      return;
    }
    const counts = statsSnap.data();

    // 2. Calculate IDs based on today's Global Seed
    // We use a predefined seed so everyone gets the same "Random" books today
    const seed = hashSeed(isoDate(new Date())); 
    const random = mulberry32(seed);

    // Pick a random index for each category
    // (Math.floor(random() * total)) ensure we stay in bounds
    const idxPoem = Math.floor(random() * counts.poems); 
    const idxStory = Math.floor(random() * counts.stories); 
    const idxEssay = Math.floor(random() * counts.essays);

    console.log(`Fetching Daily Layout: Poem #${idxPoem}, Story #${idxStory}, Essay #${idxEssay}`);

    // 3. Fetch ONLY the target documents (Security & Performance)
    // IDs are formatted like 'poems-5', 'stories-12'
    const [poemSnap, storySnap, essaySnap] = await Promise.all([
      getDoc(doc(db, "library", `poems-${idxPoem}`)),
      getDoc(doc(db, "library", `stories-${idxStory}`)),
      getDoc(doc(db, "library", `essays-${idxEssay}`))
    ]);

    // 4. Update Library Data with just these items
    if (poemSnap.exists()) libraryData.poems = [poemSnap.data()];
    if (storySnap.exists()) libraryData.stories = [storySnap.data()];
    if (essaySnap.exists()) libraryData.essays = [essaySnap.data()];
    
    console.log("Values loaded via Secure Random Indexing.");
  } catch (error) {
    console.error("Error fetching library:", error);
  }
};


const STORAGE_KEY = "rb-daily-quest-v3";
const ARCHIVE_KEY = "rb-daily-quest-archive-v3";
const READ_KEY = "rb-daily-quest-read-history-v3";

const loadReadHistory = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const saveReadHistory = (history) => {
  localStorage.setItem(READ_KEY, JSON.stringify([...history]));
};

const dailyContent = document.getElementById("daily-content");
const dateList = document.getElementById("date-list");
const fullArchiveList = document.getElementById("full-archive-list");
const todayDate = document.getElementById("today-date");
// const archiveCount = document.getElementById("archive-count");
const shareButton = document.getElementById("share-btn");
const toast = document.getElementById("toast");
const siteHeader = document.getElementById("site-header");
// const heroLabel = document.getElementById("hero-label");
const dailyHeaderTitle = document.getElementById("daily-header-title");
const backToTodayBtn = document.getElementById("back-to-today");

// Archive View Elements
const viewArchiveBtn = document.getElementById("view-archive-btn");
const archiveView = document.getElementById("archive-view");
const archiveBack = document.getElementById("archive-back");

// Reader View Elements
const homeView = document.getElementById("home-view");
const readerView = document.getElementById("reader-view");
const readerBack = document.getElementById("reader-back");
const readerLabel = document.getElementById("reader-label");
const readerTitle = document.getElementById("reader-title");
const readerMeta = document.getElementById("reader-meta");
const readerNote = document.getElementById("reader-note");
const readerText = document.getElementById("reader-text");
const readerSource = document.getElementById("reader-source");
const readerNextNav = document.getElementById("reader-next-nav");

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const hashSeed = (input) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const pickRandom = (items, random) =>
  items[Math.floor(random() * items.length)];

const createEntry = (dateKey) => {
  const seed = hashSeed(dateKey);
  const random = mulberry32(seed);
  return {
    date: dateKey,
    poem: pickRandom(libraryData.poems, random),
    story: pickRandom(libraryData.stories, random),
    essay: pickRandom(libraryData.essays, random),
  };
};

const loadArchive = () => {
  const stored = localStorage.getItem(ARCHIVE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (error) {
    return {};
  }
};

const saveArchive = (archive) => {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
};

const ensureTodayEntry = () => {
  const today = new Date();
  const dateKey = isoDate(today);
  const archive = loadArchive();

  if (!archive[dateKey]) {
    archive[dateKey] = createEntry(dateKey);
    saveArchive(archive);
  }

  return { today: archive[dateKey], archive };
};

const hydrateEntry = (entry) => {
  // Returns a new entry object with updated items if available in the loaded library
  if (!entry) return entry;
  const newEntry = { ...entry };
  const typeMap = { poem: 'poems', story: 'stories', essay: 'essays' };
  
  // Map for known title upgrades (Local Snippet -> Global Book)
  // Ensure we use the exact title string found in Firestore
  const SUPPRESS_MAP = {
    "Self-Reliance": "Essays — First Series",
    "Civil Disobedience": "On the Duty of Civil Disobedience",
    "The Road Not Taken": "Mountain Interval",
    "The Gift of the Magi": "The Four Million"
  };

  ['poem', 'story', 'essay'].forEach(key => {
      const item = entry[key];
      if (!item) return;
      
      const libraryKey = typeMap[key];
      const list = libraryData[libraryKey];
      if (!list) return;

      // 1. Direct Title Match
      let match = list.find(i => i.title === item.title);
      
      // 2. Map Match
      if (!match && SUPPRESS_MAP[item.title]) {
           match = list.find(i => i.title === SUPPRESS_MAP[item.title]);
      }

      if (match) {
          newEntry[key] = match;
      }
  });
  return newEntry;
};

const formatReaderText = (text) => 
  text.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

const buildCard = (label, item, dateKey) => {
  const card = document.createElement("article");
  card.className = "card";

  const readHistory = loadReadHistory();
  const isRead = readHistory.has(item.url);
  const hasFullText = item.year < 1929 && item.text;

  // Map label to data key category
  const categoryMap = { "Poem": "poem", "Short Story": "story", "Essay": "essay" };
  const category = categoryMap[label];

  // Construct URL or Link
  // We use query params to trigger reader view
  const href = hasFullText 
    ? `?read=true&date=${dateKey}&category=${category}`
    : item.url;

  card.innerHTML = `
    <a 
      href="${href}" 
      class="card-front"
      ${hasFullText ? "" : 'target="_blank" rel="noopener noreferrer"'}
    >
      <span class="tag">${label}</span>
      <h3>${item.title}</h3>
      <p class="byline">${item.author} (${item.year})</p>
      <p>${item.note}</p>
      <span class="read-btn ${isRead ? "read" : ""}">
        ${isRead ? "Read \u2713" : (hasFullText ? "Read Now" : `Read from ${item.source} &rarr;`)}
      </span>
    </a>
  `;

  const link = card.querySelector(".card-front");
  const btn = card.querySelector(".read-btn");

  link.addEventListener("click", () => {
    if (!readHistory.has(item.url)) {
      readHistory.add(item.url);
      saveReadHistory(readHistory);
      if (btn.textContent !== "Read \u2713") {
         btn.textContent = "Read \u2713";
         btn.classList.add("read");
      }
      // Refresh archive badges
      const archive = loadArchive();
      updateArchives(archive);
    }
    // If it's a reader link, we let the browser handle the navigation (reload with params)
  });

  return card;
};

const renderDaily = (entry) => {
  const todayKey = isoDate(new Date());
  const isToday = entry.date === todayKey;

  // Update UI state for Archive vs Today
  if (isToday) {
     // heroLabel removed
     dailyHeaderTitle.textContent = "Today’s Reading";
     backToTodayBtn.classList.add("hidden");
  } else {
     // heroLabel removed
     dailyHeaderTitle.textContent = "Reading"; // or `Reading Quest: ${entry.date}`
     backToTodayBtn.classList.remove("hidden");
  }
  
  todayDate.textContent = dateFormatter.format(parseLocalDate(entry.date));
  
  dailyContent.innerHTML = "";
  dailyContent.append(
    buildCard("Poem", entry.poem, entry.date),
    buildCard("Short Story", entry.story, entry.date),
    buildCard("Essay", entry.essay, entry.date)
  );
};

const toastMessage = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
};

const getCompletionStatus = (entry) => {
  const history = loadReadHistory();
  const urls = [entry.poem.url, entry.story.url, entry.essay.url];
  const readCount = urls.filter(u => history.has(u)).length;
  
  if (readCount === 3) return { label: "Complete", cls: "complete" };
  if (readCount > 0) return { label: `${readCount}/3 Read`, cls: "partial" };
  return { label: "Not Started", cls: "none" };
};

const createArchiveItem = (entry) => {
  const wrapper = document.createElement("div");
  wrapper.className = "archive-item";

  const status = getCompletionStatus(entry);

  const label = document.createElement("div");
  label.innerHTML = `
    <h4>
      ${dateFormatter.format(parseLocalDate(entry.date))}
      <span class="status-badge ${status.cls}">${status.label}</span>
    </h4>
    <p class="muted">Poem: ${entry.poem.title} • Story: ${entry.story.title} • Essay: ${entry.essay.title}</p>
  `;

  const button = document.createElement("button");
  button.textContent = "View";
  button.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("read");
    url.searchParams.delete("category");
    url.searchParams.set("date", entry.date);
    window.history.pushState({}, "", url);
    
    renderDaily(entry);
    
    // Switch to Home View
    archiveView.classList.add("hidden");
    readerView.classList.add("hidden");
    homeView.classList.remove("hidden");
    
    toastMessage(`Showing ${entry.date}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  wrapper.append(label, button);
  return wrapper;
};

const renderArchiveList = (entries, container) => {
  container.innerHTML = "";
  if (!entries.length) {
    container.innerHTML = "<p class=\"muted\">No archive yet.</p>";
    return;
  }
  entries.forEach(entry => container.append(createArchiveItem(entry)));
};

const updateArchives = (archive) => {
  const todayKey = isoDate(new Date());
  const entries = Object.values(archive)
    .filter(entry => entry.date !== todayKey)
    .sort((a, b) => (a.date < b.date ? 1 : -1));


  // Render recent (top 3)
  renderArchiveList(entries.slice(0, 3), dateList);
  
  // Render full
  renderArchiveList(entries, fullArchiveList);
};


const shareEntry = async (dateKey) => {
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateKey);
  url.searchParams.delete("read");
  url.searchParams.delete("category");
  
  const shareData = {
    title: "RB Daily Quest",
    text: `Daily reading quest for ${dateKey}`,
    url: url.toString(),
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed', err);
      }
      // If user aborted or share failed, fallback to copy not strictly necessary 
      // but good UX if something weird happened. 
      // However, usually AbortError means user cancelled.
      if (err.name === 'AbortError') return;
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url.toString());
    toastMessage("Link copied");
  } catch (error) {
    toastMessage("Share failed");
  }
};

const showReader = (entry, category) => {
  const item = entry[category];
  if (!item) return;

  siteHeader.classList.add("hidden");
  homeView.classList.add("hidden");
  readerView.classList.remove("hidden");
  window.scrollTo(0, 0);

  const labelMap = { "poem": "Poem", "story": "Short Story", "essay": "Essay" };
  readerLabel.textContent = labelMap[category] || "Work";
  readerTitle.textContent = item.title;
  readerMeta.textContent = `${item.author} (${item.year})`;
  readerNote.textContent = item.note || "";
  readerSource.textContent = item.source || "Source";
  readerSource.href = item.url;
  
  readerText.innerHTML = item.text ? formatReaderText(item.text) : "<p>Text not available.</p>";

  // Populate Bottom Navigation
  readerNextNav.innerHTML = "";
  const categories = ["poem", "story", "essay"];
  
  categories.forEach(cat => {
    if (cat === category) return; // Skip current
    
    // Check if item exists and has text (simple check, or just link to it?)
    // If it's internal text, we can link directly.
    // If external, we can still show it but it will open external link?
    // User requested "options like 'poem' 'short story' 'essay'".
    // We should treat them like the cards do.
    
    const catItem = entry[cat];
    const catLabel = labelMap[cat];
    if (!catItem) return;

    const btn = document.createElement("button");
    btn.className = "next-nav-btn";
    btn.textContent = `Read ${catLabel}`;
    
    const hasFullText = catItem.year < 1929 && catItem.text;

    btn.addEventListener("click", () => {
       if (hasFullText) {
         // Internal navigation
         const url = new URL(window.location.href);
         url.searchParams.set("read", "true");
         url.searchParams.set("category", cat);
         window.history.pushState({}, "", url);
         showReader(entry, cat);
         window.scrollTo(0, 0);
       } else {
         // External link
         window.open(catItem.url, "_blank");
         // Also mark as read? Yes, consistency with cards
         const readHistory = loadReadHistory();
         readHistory.add(catItem.url);
         saveReadHistory(readHistory);
       }
    });
    
    readerNextNav.append(btn);
  });

  // Home Button
  const homeBtn = document.createElement("button");
  homeBtn.className = "next-nav-btn home-btn";
  homeBtn.textContent = "Home";
  homeBtn.addEventListener("click", () => {
     readerBack.click(); // Reuse existing back logic
  });
  readerNextNav.append(homeBtn);
};

const init = async () => {
  await fetchLibrary();
  let { today, archive } = ensureTodayEntry();
  
  // Hydrate today's entry with latest/fetched data
  // This seamlessly upgrades cached local entries to full-text versions
  today = hydrateEntry(today);
  // Update the archive with the improved version
  archive[today.date] = today;
  saveArchive(archive); // Persist the upgrade

  const params = new URLSearchParams(window.location.search);
  const isReadMode = params.get("read") === "true";
  const dateParam = params.get("date");
  const categoryParam = params.get("category");

  // Determine active entry
  let activeEntry = today;
  if (dateParam) {
    if (archive[dateParam]) {
       activeEntry = hydrateEntry(archive[dateParam]); // Hydrate past entries too
    } else {
       // Valid date but not in archive? Generate it.
       if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
         activeEntry = createEntry(dateParam);
         // No need to hydrate newly created entries as they use current libraryData
       }
    }
  }

  // todayDate update is now handled in renderDaily
  
  if (isReadMode && categoryParam && activeEntry[categoryParam] && activeEntry[categoryParam].text) {
    showReader(activeEntry, categoryParam);
  } else {
    siteHeader.classList.remove("hidden");
    homeView.classList.remove("hidden");
    readerView.classList.add("hidden");
    renderDaily(activeEntry);
  }

  updateArchives(archive);

  if (shareButton) {
    shareButton.addEventListener("click", () => shareEntry(activeEntry.date));
  }
  
  backToTodayBtn.addEventListener("click", () => {
    // Return to today's entry
    const url = new URL(window.location.href);
    url.searchParams.delete("date");
    window.history.pushState({}, "", url);
    
    renderDaily(today);
    toastMessage("Back to today");
  });

  readerBack.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("read");
    url.searchParams.delete("category");
    // Keeps date param if it was there
    window.history.pushState({}, "", url);
    
    siteHeader.classList.remove("hidden");
    homeView.classList.remove("hidden");
    readerView.classList.add("hidden");
    renderDaily(activeEntry);
    
    // Also re-update archives to refresh status badges
    updateArchives(archive);
    
    window.scrollTo(0, 0);
  });

  // Archive View Navigation
  viewArchiveBtn.addEventListener("click", () => {
    siteHeader.classList.add("hidden");
    homeView.classList.add("hidden");
    archiveView.classList.remove("hidden");
    window.scrollTo(0, 0);
  });

  archiveBack.addEventListener("click", () => {
    archiveView.classList.add("hidden");
    homeView.classList.remove("hidden");
    siteHeader.classList.remove("hidden");
    window.scrollTo(0, 0);
  });
};

init();
