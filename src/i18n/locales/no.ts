import type { Dictionary } from '../types'

export const no: Dictionary = {
  nav: {
    home: 'Hjem',
    about: 'Om oss',
    projects: 'Prosjekter',
    contact: 'Kontakt',
  },
  hero: {
    learnMore: 'Lær mer',
  },
  about: {
    title: 'Om oss',
    body: 'Sushi Systems er et teknologiselskap grunnlagt i 2024 av brødrene Mustafa og Mahmut Yavuz Garip. Selskapet fokuserer på å bygge en fysikkdrevet virtuell verden inspirert av naturlovene, og visker ut grensen mellom et spill og en svært naturtro simulering.',
    cta: 'Om oss',
  },
  projects: {
    title: 'Våre prosjekter',
    viewAll: 'Se alle prosjekter',
    items: {
      sushiruntime: {
        info: 'Fysikkmotor',
        year: '2025 - Nå',
        overview: ['Vi jobber med siden.'],
      },
      projectfs: {
        info: 'Flysimulator',
        year: '2022 - Nå',
        overview: ['Vi jobber med siden.'],
      },
      projectmobilerts: {
        info: 'Mobil taktisk strategiplattform i sanntid',
        headline: 'Full dybde, rett i lomma.',
        year: '2024 - Nå',
        overview: [
          'Mobilspill har lenge vært preget av grunne valg og repetitive sløyfer. Det endrer vi nå. Dette er en militær sanntidsstrategiplattform bygget for å bringe taktisk dybde til mobilskjermen. Ved å utnytte de spesifikke tekniske mulighetene til Sushi Systems gir vi et solid miljø for spillere som krever realistisk militær logikk i stedet for forenklede mobilmekanikker. Det er bokstavelig talt 3D-sjakk for den moderne befalingsmannen.',
        ],
        about: [
          'Tilnærmingen vår er enkel: «ingenting lagt til, ingenting tatt bort». Finnes det i virkelig strid, finnes det her. Vi presser mobil maskinvare til grensen for å huse en seriøs militær simulering i Sushi Systems-universet.',
          'Prosjektets tekniske kjerne fokuserer på realisme på høyt nivå. Vi har integrert terminalballistikk og penetrasjonssimuleringer som håndterer alt fra APDSFS og Tandem-HEAT til HESH. Disse mekanikkene fungerer sammen med prosedyregenerert terreng og klima for å gjøre hver slagmark unik. Vi simulerer også menneskelige elementer, som enheters moral og erfaring, slik at verden reagerer naturlig i kampens hete.',
          'For å holde handlingen ikke-repetitiv drives operasjonene av «Artificial SushiIntelligence», vår eksperimentelle KI. Vi har også utviklet et eget RTS-kamera og kommandogrensesnitt fra bunnen av. Dette oppsettet holder spillingen flytende og enkel å navigere, samtidig som den taktiske dybden bevares så mye som mulig. Det er en demonstrasjon av hva Sushi Systems kan få til med begrenset mobil maskinvare, og skaper en plattform der strategi faktisk betyr noe.',
        ],
        outcome: {
          intro: [
            'Dette prosjektet omdefinerer hva som er mulig på en mobil enhet. Når det lanseres, må spillerne ikke lenger velge mellom «mobil bekvemmelighet» og «strategisk kompleksitet». Du får en ikke-repetitiv militær opplevelse der du opptrer som befalingsmann.',
            'Flyten er direkte:',
          ],
          bullets: [
            { lead: 'Forbered:', text: 'Bygg kortstokken din med virkelige enheter i Sushi Systems-verdenen.' },
            { lead: 'Engasjer:', text: 'Gå inn i krigsskueplassen.' },
            { lead: 'Strategiser:', text: 'Legg den langsiktige planen din.' },
            { lead: 'Utfør:', text: 'Bruk presise taktikker i sanntid.' },
            { lead: 'Vinn:', text: 'Sei med overlegen logikk og realistisk simulering.' },
          ],
          outro: [
            'Til slutt vil vi ha bevist at militær strategi passer perfekt for en avansert mobilplattform.',
          ],
        },
      },
    },
  },
  projectPage: {
    overview: 'Oversikt',
    about: 'Om prosjektet',
    outcome: 'Resultat',
    other: 'Andre prosjekter',
    back: 'Tilbake til prosjekter',
  },
  faq: {
    title: 'Ofte stilte spørsmål',
    items: [
      {
        question: 'Hvorfor navnet «Sushi Systems»?',
        answer:
          'Kallenavnet «Sushi» kommer fra barndomskallenavnet til Mustafa Garip i nabolaget hans, Küçükçekmece / Atakent. Navnet «Sushi Systems» ble valgt for å gjenspeile ingeniørarbeidet og systemene som er utviklet spesielt for datamaskiner.',
      },
      {
        question: 'Hva er selskapets modell?',
        answer:
          'Sushi Systems utvikler fysikkdrevet sanntidssimuleringsteknologi som brukes både i spill og i industrielle bruksområder som digitale tvillinger og høyytelsessimuleringer. Ett felles simuleringsfundament driver alle bruksområdene og danner grunnlaget for en langsiktig plattform.',
      },
      {
        question: 'Hva skiller dere fra andre?',
        answer:
          'Vi tilnærmer oss simulering med bakgrunn fra interaktive systemer og spillutvikling, fremfor tradisjonelle akademiske eller utdaterte programvarekjeder. Selv om vi bygger på etablerte fysiske og numeriske metoder, lager vi dem med moderne verktøy og arbeidsflyter. Dette perspektivet lar oss designe simuleringssystemer som er mer integrerte, fleksible og brukervennlige – uten å gå på akkord med korrektheten.',
      },
    ],
  },
  news: {
    title: 'SISTE NYTT',
    subtitle: 'Hold deg oppdatert med våre siste kunngjøringer, oppdateringer og sniktitter!',
  },
  projectsPage: {
    heroTop: 'VÅRE',
    heroAccent: 'PROSJEKTER',
    subtitle:
      'Utforsk systemene vi bygger — fra fysikkmotorer til flysimulatorer og taktiske sanntidsstrategiplattformer.',
  },
  contact: {
    titleTop: 'KONTAKT',
    titleAccent: 'OSS',
    tagline: 'Har du et spørsmål eller en henvendelse? Ta gjerne direkte kontakt med oss. Vi er alltid åpne for tilbakemeldinger, samarbeid og nye muligheter.',
    orMail: 'Eller bare send oss en e-post',
    form: {
      name: 'Navn',
      email: 'E-post',
      message: 'Melding',
      submit: 'Send melding',
      sending: 'Sender…',
      success: 'Takk — vi tar kontakt med deg snart.',
      error: 'Noe gikk galt. Vennligst prøv igjen eller send oss en e-post direkte.',
    },
  },
  footer: {
    copyright: '© 2026 Sushi Systems. Alle rettigheter forbeholdt.',
  },
  aboutPage: {
    heroTop: 'BLI KJENT MED',
    heroAccent: 'OSS',
    intro: [
      {
        title: 'Om oss',
        text: 'Sushi Systems er et teknologiselskap grunnlagt i 2024 av brødrene Mustafa og Mahmut Yavuz Garip. Selskapet fokuserer på å bygge en fysikkdrevet virtuell verden inspirert av naturlovene, og visker ut grensen mellom et spill og en svært naturtro simulering.',
      },
      {
        title: 'Vår visjon',
        text: 'Å gi alle tilgang til et samlet virtuelt univers, fra enkeltpersoner til globale organisasjoner; et sted der brukerne enten kan ta strategiske beslutninger med høy innsats eller utforske kreativ underholdning. Visjonen vår er en fremtid der enhver konsekvens — enten i næringslivet eller i spill — kun betales med tid, slik at feil ikke lenger koster milliarder av kroner eller menneskeliv.',
      },
      {
        title: 'Vårt oppdrag',
        text: 'Å støtte veksten til små og mellomstore bedrifter og store virksomheter gjennom realistiske, nøyaktige og tilgjengelige simuleringer, samtidig som enkeltpersoner får styrket sin intellektuelle utvikling og kan virkeliggjøre ambisjonene sine ved å skape unike verk innen simulering og strategi.',
      },
    ],
    coreTitle: 'Vår kjerne',
    core: [
      {
        title: 'Hva gjør vi?',
        text: 'Vi utvikler avanserte simuleringer.',
      },
      {
        title: 'Hvordan gjør vi det?',
        text: 'Vi bygger våre egne programvarestabler og spesialtilpassede pakker, slik at vi har direkte kontroll over hvor nøyaktig og raskt simuleringene kjører.',
      },
      {
        title: 'Hvorfor gjør vi det?',
        text: 'For å redusere feilraten i menneskelige prosjekter og fjerne de tilknyttede risikoene for samfunnet og miljøet. Vi tror at ved å forbedre beslutninger i en virtuell verden kan vi sikre suksess i den fysiske.',
      },
    ],
    systems: {
      title: 'Våre systemer',
      text: 'Sushi Systems utvikler teknologien sin som én samlet simuleringspipeline. Vi bygger vår egen kjøretid for beregning, fysikksystemene og kjernematematikken som driver dem, for å beholde kontrollen over ytelse og korrekthet. Dette felles fundamentet lar oss utvikle både simuleringer og spill i de samme miljøene, med de samme underliggende systemene i stedet for separate verktøykjeder.',
    },
  },
  notFound: {
    title: 'IKKE FUNNET',
    goHome: '← Til forsiden',
  },
  pageTitles: {
    home: 'Sushi Systems',
    about: 'Om oss',
    projects: 'Prosjekter',
    contact: 'Kontakt oss',
    notFound: 'Side ikke funnet',
  },
}
