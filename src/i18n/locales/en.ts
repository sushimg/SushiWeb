import type { Dictionary } from '../types'

export const en: Dictionary = {
  nav: {
    home: 'Home',
    about: 'About',
    projects: 'Projects',
    contact: 'Contact',
  },
  hero: {
    learnMore: 'Learn More',
  },
  about: {
    title: 'About',
    body: 'Sushi Systems is a technology company founded in 2024 by brothers Mustafa and Mahmut Yavuz Garip. The company focuses on building a physics-driven virtual world inspired by the laws of nature, blending the line between a game and a high-fidelity simulation.',
    cta: 'About Us',
  },
  projects: {
    title: 'Our Projects',
    viewAll: 'View All Projects',
    items: {
      sushiruntime: {
        info: 'Physics Engine',
        year: '2025 - Present',
        overview: ["We're working on the page."],
      },
      projectfs: {
        info: 'Flight Simulator',
        year: '2022 - Present',
        overview: ["We're working on the page."],
      },
      projectmobilerts: {
        info: 'Mobile Real-Time Tactical Strategy Platform',
        headline: 'Total Depth, Right in Your Pocket.',
        year: '2024 - Present',
        overview: [
          'Mobile games have suffered from shallow decision-making and repetitive loops. We are changing that. This is a military real-time strategy platform built to bring tactical depth to the mobile screen. By utilizing the specific technical capabilities of Sushi Systems, we provide a solid environment for players who demand realistic military logic instead of simplified mobile mechanics. It is literally 3D chess for the modern commander.',
        ],
        about: [
          'Our approach is straightforward: "nothing added, nothing taken away". If it exists in real-world combat, it exists here. We are pushing mobile hardware to its limits to host a serious military simulation within the Sushi Systems universe.',
          'The technical core of the project focuses on high-level realism. We have integrated terminal ballistics and penetration simulations that handle everything from APDSFS and Tandem-HEAT to HESH. These mechanics work alongside procedural terrain and climate generation to make every battlefield feel unique. We also simulate human elements, like unit morale and experience, to make sure the world reacts naturally to the heat of battle.',
          'To keep the action non-repetitive, operations are powered by "Artificial SushiIntelligence", our experimental AI. We’ve also developed a custom RTS camera and command interface from scratch. This setup keeps the gameplay fluid and easy to navigate while keeping the tactical depth as deep as possible. It is a showcase of what Sushi Systems can do with limited mobile hardware, creating a platform where strategy actually matters.',
        ],
        outcome: {
          intro: [
            'This project redefines what is possible on a mobile device. Once deployed, players will no longer have to choose between "mobile convenience" and "strategic complexity". You get a non-repetitive military experience where you act as the commander.',
            'The flow is direct:',
          ],
          bullets: [
            { lead: 'Prepare:', text: 'Build your deck with real-world units in the Sushi Systems world.' },
            { lead: 'Engage:', text: 'Enter the theater of war.' },
            { lead: 'Strategize:', text: 'Establish your long-term plan.' },
            { lead: 'Execute:', text: 'Apply precise tactics in real-time.' },
            { lead: 'Win:', text: 'Prevail through superior logic and realistic simulation.' },
          ],
          outro: [
            'By the end, we will have proven that military strategy is the perfect fit for a high-end mobile platform.',
          ],
        },
      },
    },
  },
  projectPage: {
    overview: 'Overview',
    about: 'About the Project',
    outcome: 'Outcome',
    other: 'Other Projects',
    back: 'Back to projects',
  },
  faq: {
    title: 'Most Asked Questions',
    items: [
      {
        question: 'Why the name "Sushi Systems"?',
        answer:
          'The nickname "Sushi" comes from Mustafa Garip\'s childhood nickname in his neighborhood, Küçükçekmece / Atakent. The name "Sushi Systems" was chosen to reflect the engineering and systems designed specifically for computers.',
      },
      {
        question: "What is the company's model?",
        answer:
          'Sushi Systems builds physics-driven real-time simulation technology used for both games and industrial applications such as digital twins and high-performance simulations. A single shared simulation foundation powers all use cases, forming the basis of a long-term platform.',
      },
      {
        question: 'What makes you different from others?',
        answer:
          'We approach simulation from an interactive systems and game engineering background rather than traditional academic or legacy software pipelines. While we rely on established physics and numerical methods, we build them using modern tools and workflows. This perspective allows us to design simulation systems that are more integrated, flexible, and usable, without compromising correctness.',
      },
    ],
  },
  news: {
    title: 'LATEST NEWS',
    subtitle: 'Stay up to date with our latest announcements, updates, and sneak peeks!',
  },
  projectsPage: {
    heroTop: 'OUR',
    heroAccent: 'PROJECTS',
    subtitle:
      'Explore the systems we are building — from physics engines to flight simulators and real-time tactical strategy platforms.',
  },
  contact: {
    titleTop: 'CONTACT',
    titleAccent: 'US',
    tagline: "Have a question or inquiry? Feel free to reach out directly to us. We're always open to feedback, collaboration, and new opportunities.",
    orMail: 'Or just email us',
    form: {
      name: 'Name',
      email: 'Email',
      message: 'Message',
      submit: 'Send message',
      sending: 'Sending…',
      success: "Thanks — we'll get back to you shortly.",
      error: 'Something went wrong. Please try again or email us directly.',
    },
  },
  footer: {
    copyright: '© 2026 Sushi Systems. All rights reserved.',
  },
  aboutPage: {
    heroTop: 'GET TO KNOW',
    heroAccent: 'US',
    intro: [
      {
        title: 'About Us',
        text: 'Sushi Systems is a technology company founded in 2024 by brothers Mustafa and Mahmut Yavuz Garip. The company focuses on building a physics-driven virtual world inspired by the laws of nature, blending the line between a game and a high-fidelity simulation.',
      },
      {
        title: 'Our Vision',
        text: 'To provide access to a unified virtual universe for everyone, from individuals to global organizations; a space where users can either engage in high-stakes strategic decision-making or explore creative entertainment. Our vision is a future where any consequence — whether in industry or play — is paid for only with time, ensuring that mistakes no longer cost billions of dollars or human lives.',
      },
      {
        title: 'Our Mission',
        text: 'To support the growth of SMEs and large enterprises through realistic, accurate, and accessible simulations, while enabling individuals to enhance their intellectual development and realize their aspirations by creating unique works in the fields of simulation and strategy.',
      },
    ],
    coreTitle: 'Our Core',
    core: [
      {
        title: 'What We Do?',
        text: 'We develop advanced simulations.',
      },
      {
        title: 'How We Do It?',
        text: 'We build our own software stacks and custom packages so we have direct control over how accurate and fast our simulations run.',
      },
      {
        title: 'Why We Do It?',
        text: 'To minimize the failure rate of human endeavors and eliminate the associated risks to society and the environment. We believe that by refining decisions in a virtual world, we can ensure success in the physical one.',
      },
    ],
    systems: {
      title: 'Our Systems',
      text: 'Sushi Systems develops its technology as a unified simulation pipeline. We build our own compute runtime, physics systems, and the core math that drives them to maintain control over performance and correctness. This shared foundation allows us to develop both simulations and games within the same environments, using the same underlying systems rather than separate toolchains.',
    },
  },
  notFound: {
    title: 'NOT FOUND',
    goHome: '← Go home',
  },
  pageTitles: {
    home: 'Sushi Systems',
    about: 'About Us',
    projects: 'Projects',
    contact: 'Contact Us',
    notFound: 'Page Not Found',
  },
}
