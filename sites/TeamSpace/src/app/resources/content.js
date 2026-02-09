import { InlineCode } from "@/once-ui/components";

const person = {
  firstName: "Nihal",
  lastName: "Desai",
  get name() {
    return `${this.firstName} ${this.lastName}`;
  },
  role: "Software Developer & AI/Data Science Student",
  avatar: "/images/ProfilePhoto.jpg",
  location: "Australia/Sydney", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: ["English"], // optional: Leave the array empty if you don't want to display languages
};

const newsletter = {
  display: true,
  title: <>Subscribe to {person.firstName}'s Newsletter</>,
  description: (
    <>
      I occasionally write about software engineering, React Native, Appwrite, and applied AI/ML in
      sports tech and cybersecurity.
    </>
  ),
};

const social = [
  {
    name: "GitHub",
    icon: "github",
    link: "https://github.com/ndesa07",
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    link: "https://www.linkedin.com/in/nihal-desai-a7052b24b/",
  },
  {
    name: "X",
    icon: "x",
    link: "",
  },
  {
    name: "Email",
    icon: "email",
    link: "desai.nihal715@gmail.com",
  },
];

const home = {
  label: "Home",
  title: `${person.name}'s Portfolio`,
  description: `Portfolio website showcasing my work as a ${person.role}`,
  headline: <>Software developer and student</>,
  subline: (
    <>
      I'm {person.firstName}, building <InlineCode>TeamSpace</InlineCode> in React&nbsp;Native with
      an Appwrite backend, and studying AI &amp; Data Analytics at UTS.
      <br /> I also play Grade 1 Cricket in NSW Premier Competition for UNSW. 
    </>
  ),
};

const about = {
  label: "About",
  title: "About me",
  description: `Meet ${person.name}, ${person.role} from ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Introduction",
    description: (
      <>
        Nihal is a Sydney-based junior software developer and AI/Data Science student focused on
        React&nbsp;Native apps, Appwrite backends, and applied machine learning. He builds TeamSpace
        for sports clubs, explores NLP projects, and plays and coaches cricket.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Work Experience",
    experiences: [
      {
        company: "TeamSpace",
        timeframe: "2025 - Present",
        role: "Founder & Junior Software Developer",
        achievements: [
          <>
            Built a React&nbsp;Native + Appwrite app for club management (announcements, schedules,
            roles, sort-code onboarding) and a Figma→Code pipeline that sped up UI delivery ~40%.
          </>,
          <>
            Implemented token-driven theming, CI codegen, and verified transactional email for smooth
            onboarding and consistent UX across screens.
          </>,
        ],
        images: [
          {
            src: "/images/TeamsFilled.jpg",
            alt: "TeamSpace Project",
            width: 9,
            height: 16,
          },
          {
            src: "/images/Schedule.jpg",
            alt: "TeamSpace Project",
            width: 9,
            height: 16,
          },
        ],
      },
      {
        company: "Sport Logic",
        timeframe: "2024-2025",
        role: "Junior Software Developer",
        achievements: [
          <>
            Coverted a legacy desktop application to a web application using Vaadin and Java. Impletmented modern UI features and ensured a smooth transition. 
          </>,
          <>
            Onboarded 3 clients to the web applicaition smoothly and ensured all their requirments are met. 
          </>,
        ],
        images: [
        ],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Studies",
    institutions: [
      {
        name: "University of Technology Sydney (UTS)",
        description: <>MSc in AI &amp; Data Analytics — projects in NLP, cybersecurity, and ML.</>,
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Technical skills",
    skills: [
      {
        title: "React Native & Expo",
        description: <>Building cross-platform apps with reusable components and token-based theming.</>,
        images: [
          {
            src: "/images/TrainingModal.jpg",
            alt: "Project image",
            width: 9,
            height: 16,
          },
          {
            src: "/images/AddEvent.jpg",
            alt: "Project image",
            width: 9,
            height: 16,
          },
        ],
      },
      {
        title: "Appwrite & CI",
        description: <>Auth, DB, Functions, and GitHub Actions for automated builds and deployments.</>,
        images: [
          {
            src: "/images/SignUp.jpg",
            alt: "Project image",
            width: 9,
            height: 16,
          },
        ],
      },
    ],
  },
};

const blog = {
  display: false,
  label: "Blog",
  title: "Writing about code, AI, and sports tech...",
  description: `Read what ${person.name} has been up to recently`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work = {
  label: "Work",
  title: "My projects",
  description: `Software and ML projects by ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery = {
  label: "Gallery",
  title: "My photo gallery",
  description: `A photo collection by ${person.name}`,
  // Images from https://pexels.com
  images: [
    {
      src: "/images/AddEvent.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/SignUp.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/TeamsEmtpy.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/TeamsFilled.jpg",
      alt: "image",
      orientation: "vertical",
    },
    {
      src: "/images/TrainingModal.jpg",
      alt: "image",
      orientation: "vertical",
    },
  ],
};

export { person, social, newsletter, home, about, blog, work, gallery };
