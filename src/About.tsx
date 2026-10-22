import { Coffee, Bot, Bike, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import type { Language } from './i18n';

export const aboutCopy = {
  nl: {
    teamNav: 'Team', disclaimer: 'Disclaimer',
    teamEyebrow: '03 / TEAM',
    teamTitle: 'Gemaakt door het NL Vibe Coder Team.',
    teamText: 'Een klein Nederlands team met grote vibes. Wij geloven dat je van een idee bij de koffie tot een werkende app kunt komen vóór de lunch — mits de koffie sterk genoeg is.',
    members: [
      ['De Vibe Coder', 'Kapitein & ideeënfabriek', 'Bedenkt om 9:00 een feature, wil hem om 9:05 in productie. Denkt het best op de racefiets; de beste ideeën ontstaan rond kilometer 40, met tegenwind.'],
      ['De AI-copiloot', 'Typt sneller dan zijn schaduw', 'Vraagt nooit om vrij, wel om context. Schreef 29 tests, puur om te bewijzen dat hij gelijk had. Vindt "kun je het nog iets mooier maken?" een prima specificatie.'],
      ['De Pixelpolitie', 'Design & micro-interacties', 'Schuift elementen net zo lang één pixel op tot het goed vóélt. Heeft een allergie voor standaard blauwe knoppen en Bootstrap-flashbacks.'],
      ['De Privacy-waakhond', 'Security & AVG', 'Blaft bij elke upload-knop. Zorgt dat je documenten je browser nooit verlaten — wij willen ze echt niet hebben, eerlijk.'],
      ['De Koffiemachine', 'Ongenoemde held', '99,9% uptime. Enige teamlid zonder meningen over tabs versus spaties. Wordt na elke release als eerste bedankt.'],
    ],
    stats: [['∞', 'koppen koffie'], ['0', 'klantdocumenten op onze server'], ['1px', 'gemiddelde designdiscussie'], ['100%', 'Nederlandse nuchterheid*']],
    statsNote: '* Behalve wanneer de build groen wordt. Dan wordt er gejuicht.',
    disclaimerTitle: 'Disclaimer',
    disclaimerIntro: 'Feedbacker is met zorg gemaakt, maar het blijft een hulpmiddel. Lees dit even door voordat je er belangrijke beslissingen op baseert.',
    disclaimerShort: 'Feedbacker is een onafhankelijk hulpmiddel van het NL Vibe Coder Team, geleverd zoals het is, zonder garanties.',
    sections: [
      ['Geleverd zoals het is', 'Feedbacker wordt gratis en "as is" aangeboden, zonder enige garantie op juistheid, volledigheid, beschikbaarheid of geschiktheid voor een bepaald doel. Gebruik is op eigen risico. Voor zover wettelijk toegestaan aanvaarden de makers geen aansprakelijkheid voor directe of indirecte schade door het gebruik van de app.'],
      ['Analyse is indicatief', 'Onderwerpen, sentiment en samenvattingen worden automatisch en regelgebaseerd bepaald. Ze kunnen nuance missen of onjuist zijn. Controleer belangrijke conclusies altijd in de oorspronkelijke bron voordat je er beslissingen op baseert.'],
      ['AI-tools en prompts', 'De promptbouwer en de chat-export maken tekst die jij zelf in een AI-tool kunt gebruiken. Feedbacker roept zelf geen AI-dienst aan. AI-antwoorden kunnen fouten, verzinsels of vooroordelen bevatten; jij blijft verantwoordelijk voor de controle en het gebruik ervan.'],
      ['Privacy en persoonsgegevens', 'Documenten worden alleen in je browser verwerkt en niet naar onze server gestuurd. Jij (of je organisatie) blijft verantwoordelijk voor de rechtmatige verwerking van persoonsgegevens volgens de AVG. Zet je data in een externe AI-tool, dan gelden de voorwaarden en het privacybeleid van die aanbieder. Anonimiseren in Feedbacker is beperkt en geen volledige anonimisering.'],
      ['Externe links en merken', 'Links naar diensten van derden (zoals MeetingSum, Claude, ChatGPT, Codex en Netlify) zijn alleen voor je gemak; wij zijn niet verantwoordelijk voor hun inhoud of werking. Genoemde product- en merknamen zijn eigendom van hun respectieve eigenaren. Vermelding betekent geen samenwerking, sponsoring of goedkeuring.'],
      ['Onafhankelijk', 'Feedbacker is een onafhankelijk project. Het is niet verbonden aan, gesponsord door of goedgekeurd door een softwareleverancier of andere organisatie.'],
      ['Wijzigingen', 'Functies en deze disclaimer kunnen zonder aankondiging wijzigen. Gebruik je Feedbacker na een wijziging, dan geldt de nieuwste versie.'],
    ],
  },
  en: {
    teamNav: 'Team', disclaimer: 'Disclaimer',
    teamEyebrow: '03 / TEAM',
    teamTitle: 'Made by the NL Vibe Coder Team.',
    teamText: 'A small Dutch team with big vibes. We believe you can go from an idea over coffee to a working app before lunch — provided the coffee is strong enough.',
    members: [
      ['The Vibe Coder', 'Captain & idea factory', 'Thinks of a feature at 9:00, wants it in production by 9:05. Thinks best on a road bike; the best ideas show up around kilometre 40, into a headwind.'],
      ['The AI Copilot', 'Types faster than its shadow', 'Never asks for a day off, only for context. Wrote 29 tests purely to prove it was right. Considers "can you make it a bit nicer?" a perfectly good specification.'],
      ['The Pixel Police', 'Design & micro-interactions', 'Nudges elements one pixel at a time until it feels right. Allergic to default blue buttons and Bootstrap flashbacks.'],
      ['The Privacy Watchdog', 'Security & GDPR', 'Barks at every upload button. Makes sure your documents never leave your browser — we genuinely don\'t want them, honestly.'],
      ['The Coffee Machine', 'Unsung hero', '99.9% uptime. The only team member without opinions on tabs versus spaces. Always thanked first after a release.'],
    ],
    stats: [['∞', 'cups of coffee'], ['0', 'customer documents on our server'], ['1px', 'average design debate'], ['100%', 'Dutch down-to-earthness*']],
    statsNote: '* Except when the build turns green. Then there is cheering.',
    disclaimerTitle: 'Disclaimer',
    disclaimerIntro: 'Feedbacker was built with care, but it is still a tool. Please read this before basing important decisions on it.',
    disclaimerShort: 'Feedbacker is an independent tool by the NL Vibe Coder Team, provided as is, without warranties.',
    sections: [
      ['Provided as is', 'Feedbacker is offered free of charge and "as is", without any warranty of accuracy, completeness, availability or fitness for a particular purpose. Use is at your own risk. To the extent permitted by law, the makers accept no liability for direct or indirect damage resulting from use of the app.'],
      ['Analysis is indicative', 'Topics, sentiment and summaries are determined automatically using rules. They can miss nuance or be wrong. Always verify important conclusions in the original source before acting on them.'],
      ['AI tools and prompts', 'The prompt builder and chat export create text you can use in an AI tool yourself. Feedbacker does not call any AI service. AI answers can contain errors, fabrications or bias; you remain responsible for checking and using them.'],
      ['Privacy and personal data', 'Documents are processed only in your browser and are not sent to our server. You (or your organization) remain responsible for lawful processing of personal data under the GDPR. If you put data into an external AI tool, that provider\'s terms and privacy policy apply. Anonymization in Feedbacker is limited and not full anonymization.'],
      ['External links and trademarks', 'Links to third-party services (such as MeetingSum, Claude, ChatGPT, Codex and Netlify) are for convenience only; we are not responsible for their content or operation. Product and brand names mentioned belong to their respective owners. Mention implies no partnership, sponsorship or endorsement.'],
      ['Independent', 'Feedbacker is an independent project. It is not affiliated with, sponsored by or endorsed by any software vendor or other organization.'],
      ['Changes', 'Features and this disclaimer may change without notice. Continued use of Feedbacker after a change means the latest version applies.'],
    ],
  },
};

const memberIcons = [<Bike size={20} />, <Bot size={20} />, <Ruler size={20} />, <ShieldCheck size={20} />, <Coffee size={20} />];

export function TeamSection({ lang }: { lang: Language }) {
  const a = aboutCopy[lang];
  return <section id="team" className="section container team-section">
    <div className="section-heading"><span className="eyebrow"><Sparkles size={15} /> {a.teamEyebrow}</span><h2>{a.teamTitle}</h2><p>{a.teamText}</p></div>
    <div className="team-grid">{a.members.map(([name, role, text], i) => <article className="team-card" key={name} style={{ animationDelay: `${i * 60}ms` }}>
      <div className="team-avatar">{memberIcons[i]}</div>
      <h3>{name}</h3><span className="team-role">{role}</span><p>{text}</p>
    </article>)}</div>
    <div className="team-stats">{a.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
    <p className="team-note">{a.statsNote}</p>
  </section>;
}

export function DisclaimerContent({ lang }: { lang: Language }) {
  const a = aboutCopy[lang];
  return <div className="privacy-content disclaimer-content">
    <p className="muted">{a.disclaimerIntro}</p>
    {a.sections.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
  </div>;
}
