import {
  detectCategory,
  detectExperienceLevel,
  detectMinCgpa,
  detectRemote,
  detectSkills,
} from "../normalize";
import type { JobType, ProviderQuery, ProviderResult, RawJob } from "../types";

/**
 * Curated fallback listings.
 *
 * The two live providers depend on an API key and on BDJobs' markup, neither
 * of which is guaranteed during a lab demo or an offline defence. This
 * provider is modelled on real Bangladeshi student-facing postings so the
 * matching engine, alerts and pipeline all have something to work with.
 *
 * Turn it off with CURATED_JOBS_ENABLED=false once your live sources are
 * reliable. Every listing is stamped source = "CURATED" and is labelled as a
 * sample in the UI, so it is never passed off as a live vacancy.
 */

interface Seed {
  externalId: string;
  title: string;
  company: string;
  location: string;
  jobType: JobType;
  daysAgo: number;
  deadlineInDays: number | null;
  salaryText: string | null;
  description: string;
}

const SEEDS: Seed[] = [
  {
    externalId: "curated-swe-intern-brainstation",
    title: "Software Engineer Intern (Web)",
    company: "BrainStation 23",
    location: "Mohakhali, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 1,
    deadlineInDays: 18,
    salaryText: "Tk 10,000 - 15,000 (monthly stipend)",
    description:
      "Join our web engineering pod for a six-month internship. You will build features in React and Next.js, write TypeScript, consume REST APIs and pick up Git-based team workflows through code review. Final-year Computer Science and Engineering students with a CGPA of 3.00 or above are encouraged to apply. Strong JavaScript fundamentals matter more than a long CV.",
  },
  {
    externalId: "curated-data-intern-pathao",
    title: "Data Analytics Intern",
    company: "Pathao",
    location: "Gulshan, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 3,
    deadlineInDays: 12,
    salaryText: "Tk 15,000 (monthly stipend)",
    description:
      "Support the growth team with rider and merchant analytics. Day to day you will write SQL against our warehouse, build dashboards in Power BI, and use Python for cohort analysis. Suitable for students in Computer Science, Statistics or Economics with strong Excel skills and a minimum CGPA of 3.25.",
  },
  {
    externalId: "curated-junior-swe-therapbd",
    title: "Junior Software Engineer",
    company: "Therap BD",
    location: "Banani, Dhaka",
    jobType: "FULL_TIME",
    daysAgo: 5,
    deadlineInDays: 25,
    salaryText: "Negotiable",
    description:
      "Entry-level role for fresh graduates. You will work on Java and Spring Boot services backed by SQL databases, alongside senior engineers who review every change. We look for solid data structures and algorithms knowledge, familiarity with Git, and a CGPA of 3.00 or higher. No prior industry experience required.",
  },
  {
    externalId: "curated-ml-intern-hishab",
    title: "Machine Learning Intern",
    company: "Hishab",
    location: "Remote (Bangladesh)",
    jobType: "INTERNSHIP",
    daysAgo: 2,
    deadlineInDays: 10,
    salaryText: "Tk 20,000 (monthly stipend)",
    description:
      "Work on Bangla speech and language models. You will preprocess audio datasets in Python, run deep learning experiments, and document results. We expect coursework in machine learning, comfort with PyTorch or TensorFlow, and clear written communication. This position is fully remote with optional office days.",
  },
  {
    externalId: "curated-frontend-intern-shopup",
    title: "Frontend Developer Intern",
    company: "ShopUp",
    location: "Banani, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 7,
    deadlineInDays: 6,
    salaryText: "Tk 12,000 (monthly stipend)",
    description:
      "Build merchant-facing screens in React and TypeScript. You will translate Figma designs into responsive components, work with REST APIs, and ship behind feature flags. Portfolio or GitHub work counts more than grades, though a CGPA of 2.75 or above is required by our HR policy.",
  },
  {
    externalId: "curated-eee-intern-walton",
    title: "Electrical Engineering Intern",
    company: "Walton Hi-Tech Industries",
    location: "Chandra, Gazipur",
    jobType: "INTERNSHIP",
    daysAgo: 4,
    deadlineInDays: 20,
    salaryText: "Tk 8,000 (monthly stipend)",
    description:
      "Three-month industrial attachment on our appliance production lines. You will assist with PCB testing, embedded firmware validation on microcontrollers, and quality documentation. Open to Electrical and Electronic Engineering students who have completed embedded systems coursework. AutoCAD familiarity is a plus.",
  },
  {
    externalId: "curated-network-intern-bracnet",
    title: "Network Operations Intern",
    company: "BRACNet",
    location: "Tejgaon, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 9,
    deadlineInDays: 14,
    salaryText: "Tk 10,000 (monthly stipend)",
    description:
      "Shadow our NOC team monitoring fibre links across Dhaka. You will learn routing and switching in practice, log incidents, and support CCNA-level troubleshooting. Suitable for Computer Science or Electrical and Electronic Engineering students interested in networking careers.",
  },
  {
    externalId: "curated-finance-intern-city-bank",
    title: "Finance Intern, Treasury",
    company: "City Bank PLC",
    location: "Gulshan, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 6,
    deadlineInDays: 9,
    salaryText: "Tk 12,000 (monthly stipend)",
    description:
      "Assist the treasury desk with daily liquidity reporting and financial analysis. Heavy Excel work including pivot tables and lookups, plus exposure to accounting entries and regulatory reporting. BBA, Finance or Economics students with a CGPA of 3.25 and above preferred.",
  },
  {
    externalId: "curated-mgmt-trainee-unilever",
    title: "Management Trainee, Supply Chain",
    company: "Unilever Bangladesh",
    location: "Dhaka",
    jobType: "FULL_TIME",
    daysAgo: 8,
    deadlineInDays: 5,
    salaryText: "Competitive graduate package",
    description:
      "Our flagship graduate programme rotates you through planning, procurement and factory operations over eighteen months. We look for graduating students with strong analytical skills, Excel proficiency, leadership evidence from clubs or competitions, and a minimum CGPA of 3.50.",
  },
  {
    externalId: "curated-digital-marketing-intern-daraz",
    title: "Digital Marketing Intern",
    company: "Daraz Bangladesh",
    location: "Bashundhara, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 2,
    deadlineInDays: 16,
    salaryText: "Tk 10,000 (monthly stipend)",
    description:
      "Support campaign execution across social media and search. You will draft content, schedule posts, run Google Ads experiments and report performance with basic SEO analysis. Open to students from any department with strong writing and communication skills.",
  },
  {
    externalId: "curated-qa-intern-selise",
    title: "QA Engineer Intern",
    company: "SELISE Digital Platforms",
    location: "Banani, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 11,
    deadlineInDays: 8,
    salaryText: "Tk 12,000 (monthly stipend)",
    description:
      "Write and execute test cases for enterprise web products. You will report defects, learn automation with JavaScript-based tooling, and sit in on agile ceremonies. Suitable for Computer Science students who enjoy breaking software carefully and documenting exactly how.",
  },
  {
    externalId: "curated-mobile-intern-bkash",
    title: "Mobile App Developer Intern",
    company: "bKash Limited",
    location: "Gulshan, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 1,
    deadlineInDays: 21,
    salaryText: "Tk 18,000 (monthly stipend)",
    description:
      "Contribute to our Android application used by millions. You will write Kotlin, integrate secure APIs, and work with our design system. Coursework or personal projects in Android or Flutter required, plus comfort with Git. Minimum CGPA 3.00.",
  },
  {
    externalId: "curated-parttime-tutor-10ms",
    title: "Part-time Academic Content Creator",
    company: "10 Minute School",
    location: "Remote (Bangladesh)",
    jobType: "PART_TIME",
    daysAgo: 3,
    deadlineInDays: 30,
    salaryText: "Tk 400 - 800 per hour",
    description:
      "Create written and video explanations for university admission and undergraduate topics. Flexible hours built around your class routine, fully remote. We look for strong content writing skills, subject mastery, and clear communication on camera.",
  },
  {
    externalId: "curated-ux-intern-augmedix",
    title: "UI/UX Design Intern",
    company: "Augmedix Bangladesh",
    location: "Mohakhali, Dhaka",
    jobType: "INTERNSHIP",
    daysAgo: 5,
    deadlineInDays: 13,
    salaryText: "Tk 14,000 (monthly stipend)",
    description:
      "Design healthcare workflows used by clinicians every day. You will build wireframes and prototypes in Figma, join usability sessions, and hand off specs to frontend engineers. A portfolio of UI design work is required; department does not matter.",
  },
];

function toRawJob(seed: Seed): RawJob {
  const blob = `${seed.title} ${seed.description}`;
  const now = Date.now();

  return {
    source: "CURATED",
    externalId: seed.externalId,
    url: "https://www.linkedin.com/jobs/",
    title: seed.title,
    company: seed.company,
    companyLogo: null,
    location: seed.location,
    isRemote: detectRemote(seed.location, blob),
    jobType: seed.jobType,
    experienceLevel: detectExperienceLevel(seed.jobType, blob),
    description: seed.description,
    skills: detectSkills(seed.title, seed.description),
    category: detectCategory(seed.title, seed.description),
    salaryText: seed.salaryText,
    minCgpa: detectMinCgpa(seed.description),
    postedAt: new Date(now - seed.daysAgo * 86_400_000),
    deadline:
      seed.deadlineInDays === null
        ? null
        : new Date(now + seed.deadlineInDays * 86_400_000),
  };
}

export async function fetchCuratedJobs(
  query: ProviderQuery,
): Promise<ProviderResult> {
  if (process.env.CURATED_JOBS_ENABLED === "false") {
    return {
      source: "CURATED",
      jobs: [],
      ok: true,
      note: "Sample listings disabled.",
    };
  }

  const jobs = SEEDS.map(toRawJob).slice(0, Math.max(query.limit, SEEDS.length));

  return {
    source: "CURATED",
    jobs,
    ok: true,
    note: `${jobs.length} sample listings loaded so the matcher always has data.`,
  };
}
