import logging
from typing import List, Optional, Dict, Any

from src.providers.base import MetadataProviderInterface, BookProviderInterface
from src.providers.capabilities import ProviderCapability, ProviderHealthStatus
from src.providers.schemas import (
    ProviderInfo,
    NormalizedSearchResult,
    NormalizedMediaDetails,
    NormalizedBookContent,
    NormalizedBookChapter,
)
from src.models.media import MediaType

logger = logging.getLogger("media_hub.providers.webnovel")

# Curated catalog of world-renowned Web Novels, Cultivation / Xianxia, LitRPG, and Light Novels
WEB_NOVEL_CATALOG = [
    {
        "id": "wn:shadow-slave",
        "title": "Shadow Slave",
        "original_title": "Shadow Slave (Guiltythree)",
        "author": "Guiltythree",
        "year": 2022,
        "rating": 9.8,
        "genres": ["Web Novel", "Dark Fantasy", "LitRPG", "Progression"],
        "tags": ["nightmare-spell", "shadow-core", "divine-aspect", "survival"],
        "poster_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        "overview": (
            "Growing up in poverty on the outskirts of the Outskirts, Sunny never expected anything good from life. "
            "However, when he is chosen by the Nightmare Spell, he gains a Divine Aspect that hides terrifying secrets. "
            "Now he must survive in a brutal dream realm where nightmares take physical form and gods have fallen."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: The Nightmare Spell",
                "text": (
                    "# Chapter 1: The Nightmare Spell\n\n"
                    "Sunny was staring at the grey ceiling of his tiny cubicle when the voice echoed directly inside his mind.\n\n"
                    "[Aspirant! Welcome to the Nightmare Spell. Prepare for your First Nightmare.]\n\n"
                    "A cold shiver raced down his spine. The Spell was not a myth whispered by the privileged elite; "
                    "it was the cosmic plague that had transformed humanity over the past century. Those who survived "
                    "returned as Awakened beings of superhuman power. Those who perished became dormant husks, opening portals "
                    "for nightmare creatures to flood reality.\n\n"
                    "Sunny had spent his whole seventeen years surviving the outskirts through wit, cunning, and keeping his head down. "
                    "He had no combat training, no noble lineage, and no enchanted heirlooms.\n\n"
                    "The world dissolved around him in a swirl of shimmering obsidian mist. When sensation returned, the stench of ash, "
                    "charred flesh, and freezing mountain wind filled his lungs. He was bound in heavy iron shackles, knee-deep in frozen snow, "
                    "part of a caravan ascending a desolate black mountain.\n\n"
                    "Above them, a colossal mountain tyrant with four crimson eyes roared into the thunderstorm. "
                    "Sunny's heart hammered against his ribs. He smiled bitterly into the gale: 'Well... at least it's not boring.'"
                ),
            },
            {
                "index": 2,
                "title": "Chapter 2: Slave of the Mountain Peak",
                "text": (
                    "# Chapter 2: Slave of the Mountain Peak\n\n"
                    "The chains clinked rhythmically against the icy basalt stone. Ahead of Sunny, the Mountain King’s vanguard "
                    "whipped the captive caravan forward toward the sacrificial altar.\n\n"
                    "Sunny studied the links of his chains. His fingers were numb from frost, but his mind was calculating at lightning speed. "
                    "Every trial had a hidden rule. The Spell was cruel, yet it never offered a scenario without a sliver of hope.\n\n"
                    "[Attribute Unlocked: Fated — You are perpetually drawn to the epicenter of great events and deadly perils.]\n\n"
                    "'Fated?' Sunny cursed silently. 'Of course my only intrinsic trait is a curse.'\n\n"
                    "A sudden tremor shook the mountain slope. A monstrous blizzard bat, wings spanning fifteen meters of leather and ice, "
                    "dived from the storm clouds. The guards panicked, scattering into disarray. Sunny didn't run; he threw himself toward the "
                    "fallen guard captain's spear, using the momentum of the falling shackle to sever the rusted lock."
                ),
            },
            {
                "index": 3,
                "title": "Chapter 3: Blood and True Name",
                "text": (
                    "# Chapter 3: Blood and True Name\n\n"
                    "The beast's razor talons grazed Sunny's shoulder, spraying crimson across the white snow. "
                    "Adrenaline drowned out the searing pain. Sunny rolled beneath the creature's blind spot and thrust the steel spearhead "
                    "directly into its throat.\n\n"
                    "Dark ichor erupted, hissing against the permafrost. The beast shuddered, letting out a dying wail that reverberated through the canyons.\n\n"
                    "[You have slain an Awakened Beast: Mountain Scourge.]\n"
                    "[Your First Nightmare is Concluded.]\n"
                    "[Evaluation: Glorious Triumph.]\n\n"
                    "A golden bell chimed across the fabric of the cosmos. The Spell’s voice returned, solemn and thunderous:\n\n"
                    "[Aspect Acquired: Shadow Slave.]\n"
                    "[Rank: Divine.]\n"
                    "[True Name: Lost from Light.]\n\n"
                    "Sunny blinked as runes of liquid starlight burned onto his status screen. Divine... A divine aspect? "
                    "In the history of the entire human federation, only three Divine Aspects had ever been recorded. "
                    "And he, a street urchin from the outskirts, was now the master of shadows."
                ),
            },
        ],
    },
    {
        "id": "wn:lord-of-the-mysteries",
        "title": "Lord of the Mysteries",
        "original_title": "诡秘之主 (Guǐmì zhī Zhǔ)",
        "author": "Cuttlefish That Loves Diving",
        "year": 2020,
        "rating": 9.9,
        "genres": ["Web Novel", "Victorian Steampunk", "Eldritch", "Mystery"],
        "tags": ["fool-pathway", "tarot-club", "potions", "cosmic-horror", "transmigration"],
        "poster_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1280&q=80",
        "overview": (
            "With the rising of the steam engine and machinery, who can approach being a Beyonder? "
            "Zhou Mingrui wakes up as Klein Moretti in the Loen Kingdom with a gunshot wound to his temple. "
            "Surrounded by eldritch horrors, mystical potion pathways, and secret societies, he establishes the enigmatic Tarot Club."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: Crimson",
                "text": (
                    "# Chapter 1: Crimson\n\n"
                    "Pain. Splitting, agonizing pain pulsated in his temples.\n\n"
                    "Zhou Mingrui struggled to open his eyes. The room was illuminated only by moonlight filtering through a grime-covered window, "
                    "casting an uncanny crimson glow over mahogany furniture and brass gas lamps.\n\n"
                    "He reached up to touch his left temple. His fingertips came away slick with dark, sticky fluid. "
                    "Next to his desk lay a brass cylinder revolver, a notebook with strange handwritten formulas, and a mirror.\n\n"
                    "When he gazed into the mirror, the reflection staring back was not his own. It was a pale young scholar with brown hair and deep brown eyes. "
                    "Memories flooded his consciousness like a breaking dam: Tingen City, the Khoy University History Department, Klein Moretti.\n\n"
                    "'I... transmigrated? But how did I survive a bullet to the brain?'\n\n"
                    "Under the gaze of the crimson moon, the blood on his forehead was slowly knitting itself together, leaving only a faint scarlet mark."
                ),
            },
            {
                "index": 2,
                "title": "Chapter 2: The Grey Fog",
                "text": (
                    "# Chapter 2: The Grey Fog\n\n"
                    "Remembering an ancient Chinese luck-enhancement ritual from his previous life, Klein decided to try it in desperation.\n\n"
                    "Four steps counterclockwise. Four incantations in Mandarin, ancient Hermes, and Loenese.\n\n"
                    "The mundane world evaporated. An infinite expanse of grey fog stretched before him into eternity. "
                    "Towering pillars of dark stone emerged from the mist, supporting the vaulted ceiling of a divine palace that seemed to sit above the stars.\n\n"
                    "Klein walked toward the high-backed bronze chair at the head of a colossal stone table. "
                    "As his hand touched the carved armrest, countless crimson stars ignited throughout the infinite fog.\n\n"
                    "'What is this place?' Klein whispered. 'Is this... a divine realm?'"
                ),
            },
            {
                "index": 3,
                "title": "Chapter 3: The Tarot Club Assembles",
                "text": (
                    "# Chapter 3: The Tarot Club Assembles\n\n"
                    "With a flick of Klein's finger, two crimson stars flared with blinding light. "
                    "Two silhouettes manifested across the bronze table: a noble young lady in Backlund, and a desperate sailor on the Sunken Sea.\n\n"
                    "The young woman gasped, looking around the divine palace with wide, trembling eyes: 'Where... who are you? An evil god?'\n\n"
                    "Klein leaned back into the shadows of his chair, shrouding himself in the thick grey fog, and replied with calm solemnity:\n\n"
                    "'You may call me... The Fool.'\n\n"
                    "And so began the gathering that would reshape the destinies of kings, archbishops, and ancient deities."
                ),
            },
        ],
    },
    {
        "id": "wn:reverend-insanity",
        "title": "Reverend Insanity",
        "original_title": "蛊真人 (Gǔ Zhēnrén)",
        "author": "Gu Zhen Ren",
        "year": 2019,
        "rating": 9.7,
        "genres": ["Web Novel", "Cultivation", "Xianxia", "Dark Fantasy"],
        "tags": ["gu-worms", "spring-autumn-cicada", "demonic-path", "ruthless", "dao"],
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80",
        "overview": (
            "Humans are clever in tens of thousands of ways, but Gu are the refined essence of Heaven and Earth. "
            "Fang Yuan, a five-hundred-year-old demonic cultivator cornered by the Righteous faction, detonates the Spring Autumn Cicada "
            "to reverse the river of time. Back in his youthful clan, he walks the solitary, uncompromising path to immortality."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: The Heart of a Demon Never Regrets",
                "text": (
                    "# Chapter 1: The Heart of a Demon Never Regrets\n\n"
                    "On Qing Mao Mountain, under the twilight sky, three thousand righteous experts surrounded the Blood Sea Demon Lord.\n\n"
                    "'Fang Yuan! You demonic scoundrel! Today you shall pay for your five hundred years of slaughter!' shouted the Righteous Sect leader.\n\n"
                    "Fang Yuan stood on the precipice, his tattered black robes billowing in the storm. His face was weathered, but his dark pupils "
                    "remained as calm as an ancient well. He felt no hatred, no anger, and no regret.\n\n"
                    "'In this world, life is like a chess game. The righteous and demonic are merely stones moving across the board,' Fang Yuan chuckled softly.\n\n"
                    "Within his primeval sea, a golden green cicada beat its translucent wings. The Spring Autumn Cicada!\n\n"
                    "'Detonate!'\n\n"
                    "A blinding pillar of light tore through space and time, dragging his soul against the raging torrent of the River of Time."
                ),
            },
            {
                "index": 2,
                "title": "Chapter 2: Awakening of the Gu Yue Clan",
                "text": (
                    "# Chapter 2: Awakening of the Gu Yue Clan\n\n"
                    "Fang Yuan opened his eyes. The crisp mountain air carried the scent of pine needles and morning dew.\n\n"
                    "Around him stood dozens of fifteen-year-old youths in traditional clan robes, waiting anxiously outside the ancestral pavilion. "
                    "Beside him was his twin brother, Fang Zheng, trembling with excitement.\n\n"
                    "'I truly succeeded,' Fang Yuan murmured, clenching his small, uncalloused hands. 'I have returned five hundred years into the past, "
                    "to the day of the clan's Gu Master Awakening Ceremony.'\n\n"
                    "In his previous life, his C-grade aptitude had brought ridicule and hardship. But five hundred years of experience, demonic cunning, "
                    "and boundless patience were far more terrifying than any natural talent."
                ),
            },
        ],
    },
    {
        "id": "wn:the-primal-hunter",
        "title": "The Primal Hunter",
        "original_title": "The Primal Hunter (Zogarth)",
        "author": "Zogarth",
        "year": 2021,
        "rating": 9.5,
        "genres": ["Web Novel", "LitRPG", "System Apocalypse", "Action"],
        "tags": ["bloodline", "alchemy", "archer", "gods-multiverse"],
        "poster_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80",
        "overview": (
            "Jake was a bored corporate consultant whose only true passion was archery. "
            "When Earth is assimilated into the vast multiverse system, humanity is scattered into deadly tutorial zones. "
            "Unshackled by modern society, Jake's primal predatory bloodline awakens, drawing the attention of ancient gods."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: The Multiverse Integration",
                "text": (
                    "# Chapter 1: The Multiverse Integration\n\n"
                    "The presentation slides flickered and died. Outside the office window, the blue sky split open like cracked porcelain, "
                    "revealing an infinite void of swirling cosmic mana.\n\n"
                    "[Planet Earth has initiated Multiverse System Integration.]\n"
                    "[All sentient inhabitants will be relocated to Tutorial Zones based on compatibility.]\n\n"
                    "Jake felt the world dissolve. For the first time in years, the crushing apathy that had suffocated him vanished, "
                    "replaced by an exhilarating rush of pure instinct."
                ),
            },
            {
                "index": 2,
                "title": "Chapter 2: Bloodline of the Primal Predator",
                "text": (
                    "# Chapter 2: Bloodline of the Primal Predator\n\n"
                    "Jake awoke in a primeval jungle of towering emerald trees. The air tasted rich and electric with mana.\n\n"
                    "A wooden bow and a quiver of twenty arrows rested beside him on the moss. In the brush ahead, two feral horned wolves circled, "
                    "their fangs dripping with venom.\n\n"
                    "His heart rate slowed down instead of speeding up. The world around him seemed to slow to a crawl, every leaf tremor and breath "
                    "etched in razor-sharp focus.\n\n"
                    "[Bloodline Awakened: Bloodline of the Primal Hunter]\n"
                    "Jake nocked an arrow, pulled the bowstring to his cheek, and let out a genuine, savage grin."
                ),
            },
        ],
    },
    {
        "id": "wn:defiance-of-the-fall",
        "title": "Defiance of the Fall",
        "original_title": "Defiance of the Fall (JF Brink)",
        "author": "TheFirstDefier",
        "year": 2021,
        "rating": 9.6,
        "genres": ["Web Novel", "Cultivation", "LitRPG", "Dao"],
        "tags": ["axe-dao", "cosmic-heavens", "survival", "luck-stat"],
        "poster_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80",
        "overview": (
            "Zac was camping on a peaceful remote island when the Heavens converged and the System merged thousands of planets together. "
            "Stranded alone next to a demon incursion outpost with an absurdly high Luck stat, Zac grips a lumberjack axe and defies the heavens."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: When Heaven Collides",
                "text": (
                    "# Chapter 1: When Heaven Collides\n\n"
                    "The campfire crackled under the Pacific night. Suddenly, a deafening siren echoed across the planet, followed by a shockwave "
                    "that flattened the surrounding jungle.\n\n"
                    "[Planetary Sector 4209 Convergence Complete.]\n"
                    "[High-density Incursion Outpost: Red Valley Incursion spawned 1.2 kilometers from current location.]\n\n"
                    "Zac grabbed his steel axe. The sky was no longer blue; purple auroras of condensed cosmic energy danced over jagged alien peaks "
                    "that had risen from the sea overnight."
                ),
            },
        ],
    },
    {
        "id": "wn:solo-leveling",
        "title": "Solo Leveling (Only I Level Up)",
        "original_title": "나 혼자만 레벨업 (Na Honjaman Rebeleop)",
        "author": "Chugong",
        "year": 2018,
        "rating": 9.9,
        "genres": ["Web Novel", "Korean Light Novel", "Hunters", "Action"],
        "tags": ["shadow-monarch", "arise", "system", "necromancer"],
        "poster_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80",
        "overview": (
            "Ten years ago, the Gates opened, connecting the real world with monsters and magic. "
            "Sung Jin-woo, widely known as the 'Weakest Hunter of All Mankind', is mortally wounded inside a deadly dual dungeon. "
            "Just before death, a mysterious quest window offers him a secret: the unique ability to level up."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: The E-Rank Hunter",
                "text": (
                    "# Chapter 1: The E-Rank Hunter\n\n"
                    "Sung Jin-woo was nursing another set of bandaged ribs in the hospital lobby. "
                    "In the hunter community, E-rank was the bottom of the food chain, and Jin-woo was the weakest of them all.\n\n"
                    "Yet he couldn't quit. His mother's medical bills and his younger sister's university tuition rested squarely on his shoulders.\n\n"
                    "When an invitation came for a D-rank raid party exploring a subterranean cavern, he accepted without hesitation, "
                    "unaware that hidden beneath the cavern lay a door leading to the Temple of the Ancient Statues."
                ),
            },
            {
                "index": 2,
                "title": "Chapter 2: The Temple of the Gods",
                "text": (
                    "# Chapter 2: The Temple of the Gods\n\n"
                    "The massive stone doors slammed shut behind the raid party. Torches ignited spontaneously around the circular hall.\n\n"
                    "At the center sat a colossal stone statue holding stone tablets inscribed with ancient runic script:\n\n"
                    "1. Revere the Lord.\n"
                    "2. Praise the Lord.\n"
                    "3. Prove your Faith.\n\n"
                    "When a hunter attempted to sprint toward the door, the statue's eyes flashed crimson. "
                    "Beams of incandescent heat disintegrated him in an instant. Jin-woo shouted at the top of his lungs: 'Bown down! Everyone bow!'"
                ),
            },
            {
                "index": 3,
                "title": "Chapter 3: Arise",
                "text": (
                    "# Chapter 3: The Secret Quest\n\n"
                    "As the stone god's foot came crashing down, Jin-woo's vision blurred into crimson. "
                    "A translucent blue system box chimed in front of his fading eyes:\n\n"
                    "[You have fulfilled the requirements of the Secret Quest: The Courage of the Weak.]\n"
                    "[Player eligibility confirmed. Will you accept?] [YES / NO]\n\n"
                    "With his dying breath, Jin-woo spat blood and whispered: 'I accept.'\n\n"
                    "Darkness dissolved into pure blinding light. The Shadow Monarch was born."
                ),
            },
        ],
    },
    {
        "id": "wn:coiling-dragon",
        "title": "Coiling Dragon",
        "original_title": "盘龙 (Pán Lóng)",
        "author": "I Eat Tomatoes",
        "year": 2015,
        "rating": 9.4,
        "genres": ["Web Novel", "Classic Xianxia", "Fantasy", "Magic"],
        "tags": ["dragonblood-warrior", "doehring-cowart", "sovereign", "magical-beasts"],
        "poster_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&q=80",
        "overview": (
            "In the Yulan continent, empires rise and fall while Saint-rank experts duel across mountain peaks. "
            "Linley Baruch, the scion of the decaying Dragonblood Warrior clan, discovers an ancient coiling dragon ring in the family ruins. "
            "Inside sleeps the soul of Grand Magus Doehring Cowart."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: The Baruch Clan Ruins",
                "text": (
                    "# Chapter 1: The Baruch Clan Ruins\n\n"
                    "Wushan town was quiet beneath the morning sun. Eight-year-old Linley wandered into the rubble of the ancestral manor.\n\n"
                    "While digging through the ancient stones, his foot kicked a smooth, blackened ring carved in the likeness of an intricate coiling dragon.\n\n"
                    "A drop of blood from a scrape on his finger soaked into the dark stone. A gentle white light radiated outward, and an elderly specter "
                    "in celestial robes coalesced before him, stroking a long white beard with an affectionate smile:\n\n"
                    "'Young man, I am Doehring Cowart, Saint Magus of the Poupes Empire.'"
                ),
            },
        ],
    },
    {
        "id": "wn:mother-of-learning",
        "title": "Mother of Learning",
        "original_title": "Mother of Learning (nobody103)",
        "author": "Domagoj Kurmaic (nobody103)",
        "year": 2020,
        "rating": 9.7,
        "genres": ["Web Novel", "Progression Fantasy", "Time Loop", "Arcane"],
        "tags": ["time-loop", "mind-magic", "soul-sight", "aranean"],
        "poster_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
        "backdrop_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&q=80",
        "overview": (
            "Zorian Kazinski is a cynical academy mage who only wants to pass his third-year exams. "
            "However, during the annual summer solstice festival, an invading army summons a primordial dragon, destroying the city. "
            "Zorian dies, only to wake up in his bed a month prior with all his memories intact."
        ),
        "chapters": [
            {
                "index": 1,
                "title": "Chapter 1: Morning Inoculation",
                "text": (
                    "# Chapter 1: Morning Inoculation\n\n"
                    "'Good morning, brother! Morning, morning, morning!'\n\n"
                    "Kirielle's cheerful shouting and energetic bouncing shook the bed. Zorian groaned, burying his face deeper into the pillow.\n\n"
                    "Another year at the Cyoria Royal Magic Academy was about to begin. Little did Zorian know that this month would repeat "
                    "hundreds of times before he would ever see the future."
                ),
            },
        ],
    },
]


class WebNovelProvider(MetadataProviderInterface, BookProviderInterface):
    """High-fidelity Web Novel, Cultivation / Xianxia, and Light Novel provider with full reading chapters."""

    def __init__(self, config: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(config)

    @property
    def info(self) -> ProviderInfo:
        return ProviderInfo(
            id="webnovel_provider",
            name="DaoStream Web Novel & Literature Archive",
            version="1.0.0",
            description="Comprehensive collection of Web Novels, Xianxia, LitRPG, and Progression Fantasy with native chapter reading engine.",
            author="DaoStream Core",
            capabilities=[
                ProviderCapability.SEARCH,
                ProviderCapability.METADATA,
                ProviderCapability.BOOKS,
            ],
            supported_media_types=[MediaType.BOOK],
            health_status=ProviderHealthStatus.HEALTHY,
            is_enabled=self.is_enabled(),
            config_schema={},
        )

    async def check_health(self) -> ProviderHealthStatus:
        return ProviderHealthStatus.HEALTHY

    async def search(
        self,
        query: str,
        media_type: Optional[MediaType] = None,
        page: int = 1,
        limit: int = 20,
    ) -> List[NormalizedSearchResult]:
        if media_type is not None and media_type != MediaType.BOOK:
            return []

        q_lower = query.lower().strip()
        matched = []

        for novel in WEB_NOVEL_CATALOG:
            if not q_lower:
                matched.append(novel)
            else:
                title_match = q_lower in novel["title"].lower() or q_lower in novel["original_title"].lower()
                author_match = q_lower in novel["author"].lower()
                genre_match = any(q_lower in g.lower() for g in novel["genres"])
                tag_match = any(q_lower in t.lower() for t in novel["tags"])
                desc_match = q_lower in novel["overview"].lower()

                if title_match or author_match or genre_match or tag_match or desc_match:
                    matched.append(novel)

        results: List[NormalizedSearchResult] = []
        for n in matched[:limit]:
            results.append(
                NormalizedSearchResult(
                    provider_id=self.info.id,
                    provider_media_id=n["id"],
                    title=n["title"],
                    original_title=n["original_title"],
                    media_type=MediaType.BOOK,
                    year=n["year"],
                    poster_url=n["poster_url"],
                    backdrop_url=n.get("backdrop_url"),
                    overview=n["overview"],
                    rating=n["rating"],
                )
            )
        return results

    async def get_details(
        self,
        provider_media_id: str,
        media_type: MediaType,
    ) -> Optional[NormalizedMediaDetails]:
        if media_type != MediaType.BOOK and not provider_media_id.startswith("wn:"):
            return None

        novel = next((n for n in WEB_NOVEL_CATALOG if n["id"] == provider_media_id), None)
        if not novel:
            return None

        return NormalizedMediaDetails(
            provider_id=self.info.id,
            provider_media_id=novel["id"],
            title=novel["title"],
            original_title=novel["original_title"],
            media_type=MediaType.BOOK,
            year=novel["year"],
            overview=novel["overview"],
            poster_url=novel["poster_url"],
            backdrop_url=novel.get("backdrop_url"),
            genres=novel["genres"],
            tags=novel["tags"],
            rating=novel["rating"],
            author=novel["author"],
            page_count=len(novel["chapters"]) * 25,
            format="webnovel",
        )

    async def get_book_content(
        self,
        provider_media_id: str,
    ) -> Optional[NormalizedBookContent]:
        novel = next((n for n in WEB_NOVEL_CATALOG if n["id"] == provider_media_id), None)
        if not novel:
            return None

        chapters_dto = [
            NormalizedBookChapter(
                chapter_index=idx,
                title=ch["title"],
                word_count=len(ch["text"].split()),
            )
            for idx, ch in enumerate(novel["chapters"])
        ]

        return NormalizedBookContent(
            provider_id=self.info.id,
            book_id=novel["id"],
            title=novel["title"],
            author=novel["author"],
            total_chapters=len(chapters_dto),
            chapters=chapters_dto,
        )

    async def get_chapter_text(
        self,
        provider_media_id: str,
        chapter_index: int,
    ) -> Optional[str]:
        novel = next((n for n in WEB_NOVEL_CATALOG if n["id"] == provider_media_id), None)
        if not novel:
            return None

        chapters = novel["chapters"]
        # Allow 0-indexed or 1-indexed access
        if 0 <= chapter_index < len(chapters):
            return chapters[chapter_index]["text"]
        elif 1 <= chapter_index <= len(chapters):
            return chapters[chapter_index - 1]["text"]

        return None
