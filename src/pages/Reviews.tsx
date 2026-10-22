import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Star, Quote } from "lucide-react";
const reviews = [
  {
    id: 1,
    name: "rollcancel.",
    avatar: "RC",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 11, 2026",
    text: "w script fast and easy purchase and alot of things on it",
  },
  {
    id: 2,
    name: "im him",
    avatar: "IH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 10, 2026",
    text: "W script works pretty well + lot of features and the devs reply so quickly, really good service and super nice people overall.",
  },
  {
    id: 3,
    name: "PABLO",
    avatar: "PB",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 10, 2026",
    text: "W script using for 3 days and didnt turn off my laptop for 3 days",
  },
  {
    id: 4,
    name: "carlosss28_",
    avatar: "C2",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 9, 2026",
    text: "w script, listens to the community, actually adds the suggestions, should buy for 15$ its so worth it",
  },
  {
    id: 5,
    name: "geo",
    avatar: "GE",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 8, 2026",
    text: "+rep works great, got mih rq",
  },
  {
    id: 6,
    name: "NotKami",
    avatar: "NK",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 8, 2026",
    text: "W script works pretty well + lot of features",
  },
  {
    id: 7,
    name: "Panda",
    avatar: "PA",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 8, 2026",
    text: "this script changed my life 🤤",
  },
  {
    id: 8,
    name: "Complexity",
    avatar: "CM",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 8, 2026",
    text: "I am just chilling, this script worth every penny",
  },
  {
    id: 9,
    name: "Complexity",
    avatar: "CM",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 8, 2026",
    text: "Buy lifetime key use autoroll get nami first try.",
  },
  {
    id: 10,
    name: "ÊrrørRBLX",
    avatar: "ER",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "Works as intended amazing overall",
  },
  {
    id: 11,
    name: "PanhIaChay",
    avatar: "PC",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "W voiding mechanic, kira raid in under 2 minutes",
  },
  {
    id: 12,
    name: "ℜ𝔶𝔬𝔪𝔢𝔫 𝒮𝓊𝓀𝓊𝓃𝒶",
    avatar: "RY",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "The script works great, I'm glad I bought lifetime, I couldn't expect less! W script W moderators",
  },
  {
    id: 13,
    name: "Xvelvette",
    avatar: "XV",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "Works as advertised, tested with delta",
  },
  {
    id: 14,
    name: "Phantom",
    avatar: "PH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "tuff! easy buying and great product",
  },
  {
    id: 15,
    name: "Ck",
    avatar: "CK",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 5, 2026",
    text: "Script for mobile is so good i finish maki in 4 minutes",
  },
  {
    id: 16,
    name: "yeetbeex2",
    avatar: "YB",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 7, 2026",
    text: "A script that helps you progress faster in Bizarre Lineage can make the game much easier and less time-consuming. Players can level up quicker and unlock stronger Stands and abilities faster than they would by playing normally.",
  },
  {
    id: 17,
    name: "Glitched",
    avatar: "GL",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 3, 2026",
    text: "I've had experience with a lot of script hubs some have ip loggers or shitty quality but this one i can comfortably say it's one of the best scripts around",
  },
  {
    id: 18,
    name: "Glitched",
    avatar: "GL",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 3, 2026",
    text: "Lwk Crazy hub, i recommend it to everybody. I know the key systems must be worked on but in general the scripts are solid reliable.",
  },
  {
    id: 19,
    name: "maxling_",
    avatar: "MX",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 4, 2026",
    text: "sss rank in 2 min best script",
  },
  {
    id: 20,
    name: "m1_a4",
    avatar: "M1",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 28, 2026",
    text: "15 minutes and max lvl, W script",
  },
  {
    id: 21,
    name: "bmwseries7",
    avatar: "BM",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 18, 2026",
    text: "So for people who think about buying: the community is small, the devs talk to u anytime u want and answer questions and help you if you have problems and the things you suggest actually get implemented in the scripts",
  },
  {
    id: 22,
    name: "Jordy3322",
    avatar: "JO",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 5, 2026",
    text: "THNX LUCID",
  },
  {
    id: 23,
    name: "✨bleyu✨",
    avatar: "BL",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 27, 2026",
    text: "VOUCH goated ahh script ong",
  },
  {
    id: 24,
    name: "himhau",
    avatar: "HH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 1, 2026",
    text: "vouch the best bizarre lineage script oat",
  },
  {
    id: 25,
    name: "✝M1CAH✝",
    avatar: "MC",
    rating: 5,
    game: "Anime Battle Arena",
    date: "Feb 25, 2026",
    text: "Goated script got all the legendaries I wanted and some good macroes on the ABA script",
  },
  {
    id: 26,
    name: "Complexity",
    avatar: "CM",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 6, 2026",
    text: "Buy it, run it, leave it and come back to goodness 😍😩",
  },
  {
    id: 27,
    name: "Jordy3322",
    avatar: "JO",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 2, 2026",
    text: "Thnx lucid ! i love you",
  },
  {
    id: 28,
    name: "Jordy3322",
    avatar: "JO",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 18, 2026",
    text: "The new update works perfectly and kills the boss as indicated in the script. It's worth the purchase!",
  },
  {
    id: 29,
    name: "Haunt",
    avatar: "HA",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 17, 2026",
    text: "tuff dude he even gave me da discount yo",
  },
  {
    id: 30,
    name: "Complexity",
    avatar: "CM",
    rating: 5,
    game: "Kaizen",
    date: "Feb 17, 2026",
    text: "The Kaizen script is absolutely amazing! I will definitely be saving some pocket money to buy premium script and support the devs of this group! ❤️",
  },
  {
    id: 31,
    name: "Oskii",
    avatar: "OS",
    rating: 5,
    game: "Kaizen",
    date: "Feb 16, 2026",
    text: "Kaizen script is TUFF, amazing level script, chest farm etc",
  },
  {
    id: 32,
    name: "rip_r8",
    avatar: "RR",
    rating: 5,
    game: "Kaizen",
    date: "Feb 16, 2026",
    text: "Vouch kaizen script the dupe is op",
  },
  {
    id: 33,
    name: "xartix",
    avatar: "XA",
    rating: 5,
    game: "Kaizen",
    date: "Feb 16, 2026",
    text: "The kaizen script is good as hell and cheap af big W",
  },
  {
    id: 34,
    name: "TheSinFather",
    avatar: "TS",
    rating: 5,
    game: "Kaizen",
    date: "Feb 16, 2026",
    text: "This Kaizen script is nothing to sleep on. Starting lvl 0 - 20mins later Grade 2 and 50k quantity per item.",
  },
  {
    id: 35,
    name: "k4zz_s",
    avatar: "KZ",
    rating: 5,
    game: "Kaizen",
    date: "Feb 15, 2026",
    text: "vouch this, very good script and very good service",
  },
  {
    id: 36,
    name: "brotherhood",
    avatar: "BR",
    rating: 5,
    game: "Kaizen",
    date: "Feb 15, 2026",
    text: "vouch this script have a good potential big W to the owner",
  },
  {
    id: 37,
    name: "bmwseries7",
    avatar: "BM",
    rating: 5,
    game: "Project Delta",
    date: "Feb 28, 2026",
    text: "vouch good script for project delta I ended up wiping the server with the aimbot",
  },
  {
    id: 38,
    name: "LebigRR",
    avatar: "LB",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 20, 2026",
    text: "ez in hour maki sword 🤡",
  },
  {
    id: 39,
    name: "Bjornito",
    avatar: "BJ",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 20, 2026",
    text: "Crazy work",
  },
  {
    id: 40,
    name: "@Xposed",
    avatar: "XP",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Feb 17, 2026",
    text: "+rep aprc8 it twin",
  },
  {
    id: 41,
    name: "0010088",
    avatar: "00",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 12, 2026",
    text: "best script maki farm goated",
  },
  {
    id: 42,
    name: "1kenny_1",
    avatar: "1K",
    rating: 5,
    game: "Anime Battle Arena",
    date: "Mar 12, 2026",
    text: "vouch, the macro is so smooth",
  },
  {
    id: 43,
    name: "1xeeeeeeee",
    avatar: "1X",
    rating: 5,
    game: "Grand Piece Online",
    date: "Mar 13, 2026",
    text: "W fruit sniper",
  },
  {
    id: 44,
    name: "6366j",
    avatar: "63",
    rating: 5,
    game: "Everwind",
    date: "Mar 13, 2026",
    text: "Everwind script is a literal cheat code",
  },
  {
    id: 45,
    name: "7.8paali",
    avatar: "78",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 14, 2026",
    text: "vouch vouch vouch",
  },
  {
    id: 46,
    name: "87k8",
    avatar: "87",
    rating: 5,
    game: "Project Delta",
    date: "Mar 14, 2026",
    text: "Aimbot is perfect for wipes",
  },
  {
    id: 47,
    name: "_.ap.",
    avatar: "AP",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 14, 2026",
    text: "+rep active support",
  },
  {
    id: 48,
    name: "__bwee__",
    avatar: "BW",
    rating: 5,
    game: "Anime Battle Arena",
    date: "Mar 15, 2026",
    text: "W script, got everything I needed",
  },
  {
    id: 49,
    name: "_blindstrike",
    avatar: "BS",
    rating: 5,
    game: "Everwind",
    date: "Mar 15, 2026",
    text: "best hub for everwind no cap",
  },
  {
    id: 50,
    name: "_chalks",
    avatar: "CH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 15, 2026",
    text: "tuff script, works on delta mobile too",
  },
  {
    id: 51,
    name: "_naud_",
    avatar: "NA",
    rating: 5,
    game: "Project Delta",
    date: "Mar 15, 2026",
    text: "very clean esp",
  },
  {
    id: 52,
    name: "_senjuoo1",
    avatar: "SE",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 15, 2026",
    text: "W voucher, been using for weeks",
  },
  {
    id: 53,
    name: "ahoneybun40",
    avatar: "AH",
    rating: 5,
    game: "Universal",
    date: "Mar 15, 2026",
    text: "vouch for universal support",
  },
  {
    id: 54,
    name: "alejobz",
    avatar: "AL",
    rating: 5,
    game: "Kaizen",
    date: "Mar 14, 2026",
    text: "W script, worth the 15 bucks",
  },
  {
    id: 55,
    name: "anthopo",
    avatar: "AN",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 14, 2026",
    text: "+rep real",
  },
  {
    id: 56,
    name: "argames2018",
    avatar: "AR",
    rating: 5,
    game: "Everwind",
    date: "Mar 14, 2026",
    text: "best update yet",
  },
  {
    id: 57,
    name: "astro2gooddd",
    avatar: "AS",
    rating: 5,
    game: "Project Delta",
    date: "Mar 14, 2026",
    text: "aimbot + esp = admin lol",
  },
  {
    id: 58,
    name: "blackstagex",
    avatar: "BX",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 13, 2026",
    text: "maki farm is 10/10",
  },
  {
    id: 59,
    name: "bram5918",
    avatar: "BR",
    rating: 5,
    game: "Anime Battle Arena",
    date: "Mar 13, 2026",
    text: "W macro simple to use",
  },
  {
    id: 60,
    name: "bright_bomber3",
    avatar: "BB",
    rating: 5,
    game: "Grand Piece Online",
    date: "Mar 13, 2026",
    text: "no lag at all",
  },
  {
    id: 61,
    name: "btq1",
    avatar: "BT",
    rating: 5,
    game: "Everwind",
    date: "Mar 13, 2026",
    text: "highly recommend",
  },
  {
    id: 62,
    name: "buggsbunmy122",
    avatar: "BB",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 12, 2026",
    text: "best script in the market",
  },
  {
    id: 63,
    name: "business0567",
    avatar: "BS",
    rating: 5,
    game: "Project Delta",
    date: "Mar 12, 2026",
    text: "W script undetected 1 month",
  },
  {
    id: 64,
    name: "byorl",
    avatar: "BY",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 12, 2026",
    text: "aimbot is super sticky",
  },
  {
    id: 65,
    name: "christaans",
    avatar: "CH",
    rating: 5,
    game: "Everwind",
    date: "Mar 12, 2026",
    text: "+rep",
  },
  {
    id: 66,
    name: "dendecollector",
    avatar: "DC",
    rating: 5,
    game: "Project Delta",
    date: "Mar 11, 2026",
    text: "vouch :fire:",
  },
  {
    id: 67,
    name: "deon03377",
    avatar: "DE",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 11, 2026",
    text: "worth the lifetime key",
  },
  {
    id: 68,
    name: "ego0942",
    avatar: "EG",
    rating: 5,
    game: "Project Delta",
    date: "Mar 11, 2026",
    text: "W scrip",
  },
  {
    id: 69,
    name: "eh1t",
    avatar: "EH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 11, 2026",
    text: "vouch",
  },
  {
    id: 70,
    name: "ep1w",
    avatar: "EP",
    rating: 5,
    game: "Everwind",
    date: "Mar 10, 2026",
    text: "W W W",
  },
  {
    id: 71,
    name: "erroor2641",
    avatar: "ER",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 10, 2026",
    text: "script goes hard",
  },
  {
    id: 72,
    name: "f90moh",
    avatar: "F9",
    rating: 5,
    game: "Grand Piece Online",
    date: "Mar 10, 2026",
    text: "best gpo script",
  },
  {
    id: 73,
    name: "felipeeewashere",
    avatar: "FE",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 09, 2026",
    text: "VOUCH",
  },
  {
    id: 74,
    name: "for5187",
    avatar: "FO",
    rating: 5,
    game: "Project Delta",
    date: "Mar 09, 2026",
    text: "smooth silent aim",
  },
  {
    id: 75,
    name: "formypast",
    avatar: "FP",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 09, 2026",
    text: "W maki farmer",
  },
  {
    id: 76,
    name: "fortune00",
    avatar: "FO",
    rating: 5,
    game: "Universal",
    date: "Mar 08, 2026",
    text: "+rep highly recommended",
  },
  {
    id: 77,
    name: "fusonixscriptzz",
    avatar: "FS",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 08, 2026",
    text: "W dev team",
  },
  {
    id: 78,
    name: "gabby.pogi",
    avatar: "GP",
    rating: 5,
    game: "Project Delta",
    date: "Mar 07, 2026",
    text: "too good",
  },
  {
    id: 79,
    name: "ggnex",
    avatar: "GG",
    rating: 5,
    game: "Anime Battle Arena",
    date: "Mar 07, 2026",
    text: "vouch",
  },
  {
    id: 80,
    name: "himhau",
    avatar: "HH",
    rating: 5,
    game: "Bizarre Lineage",
    date: "Mar 06, 2026",
    text: "W script :heart:",
  },
];


function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= rating ? "fill-primary text-primary drop-shadow-[0_0_4px_hsl(var(--pumpkin))]" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  const shown = reviews;

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <PageHeader eyebrow="TESTIMONIALS" title="USER" accent="REVIEWS">
          What the community says about Lucid. Real people, real feedback.
        </PageHeader>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="spooky-card mb-10 grid gap-8 p-8 md:grid-cols-[auto_1fr] md:items-center"
        >
          <div className="text-center md:border-r md:border-border md:pr-10">
            <p className="gradient-fire font-mono text-7xl font-bold leading-none">{avgRating}</p>
            <div className="mt-3 flex justify-center">
              <StarRating rating={5} size={16} />
            </div>
            <p className="mt-2 font-mono text-[10px] tracking-widest text-muted-foreground">{reviews.length} REVIEWS</p>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = reviews.filter((r) => r.rating === n).length;
              return (
                <div key={n} className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                  <span className="w-6">{n}★</span>
                  <div className="h-1.5 flex-1 bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c / reviews.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-[hsl(var(--witch))]"
                    />
                  </div>
                  <span className="w-8 text-right">{c}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Reviews grid */}
        <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((review, i) => (
              <motion.div
                layout
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.3 }}
                className="spooky-card group relative flex flex-col p-6"
              >
                <Quote size={28} strokeWidth={1} className="absolute right-4 top-4 text-primary/10 transition-colors group-hover:text-primary/30" />
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">
                    {review.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-foreground">{review.name}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">"{review.text}"</p>
                <p className="mt-4 font-mono text-[10px] text-muted-foreground/60">{review.date}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </Layout>
  );
}