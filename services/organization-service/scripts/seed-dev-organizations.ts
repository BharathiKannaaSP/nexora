// Dev only: ACTIVE organizations with members, so the join-organization
// directory has something to show. Run with
// `pnpm --filter @nexora/organization-service seed:dev` (1000 organizations),
// or `... seed:dev --count=200` for another total.
//
// The first organizations are the ones in the design; the rest are generated
// from a fixed seed, so every run produces the same names, slugs and member
// counts.
//
// Idempotent: an organization is found by slug and created only if missing,
// and members `dev-seed-<slug>-<n>` already there are skipped, so running it
// again only fills in what's missing.
import "dotenv/config"
import "temporal-polyfill/full/global"

import {
  ORGANIZATION_INDUSTRIES,
  ORGANIZATION_SIZES,
  type OrganizationIndustry,
  type OrganizationSize,
} from "@nexora/schemas/onboarding/create-organization"

import { env } from "../src/config/organization-env"
import { db } from "../src/prisma/organization-db"

interface SeedOrganization {
  name: string
  slug: string
  countryCode: string
  industry: OrganizationIndustry
  size: OrganizationSize
  members: number
  website: string
  taxId: string
  address: {
    addressLine1: string
    city: string
    state: string
    postalCode: string
  }
}

const SEED_ORGANIZATIONS: readonly SeedOrganization[] = [
  {
    name: "Trendslane India",
    slug: "trendslane-india",
    countryCode: "IN",
    industry: "ECOMMERCE",
    size: "51-200",
    members: 128,
    website: "https://in.trendslane.example",
    taxId: "29ABCDE1234F1Z5",
    address: {
      addressLine1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
    },
  },
  {
    name: "Trendslane UAE",
    slug: "trendslane-uae",
    countryCode: "AE",
    industry: "ECOMMERCE",
    size: "51-200",
    members: 96,
    website: "https://ae.trendslane.example",
    taxId: "100123456700003",
    address: {
      addressLine1: "Office 804, Bay Square",
      city: "Dubai",
      state: "Dubai",
      postalCode: "",
    },
  },
  {
    name: "Trendslane Germany",
    slug: "trendslane-germany",
    countryCode: "DE",
    industry: "ECOMMERCE",
    size: "51-200",
    members: 75,
    website: "https://de.trendslane.example",
    taxId: "DE123456789",
    address: {
      addressLine1: "Friedrichstraße 68",
      city: "Berlin",
      state: "Berlin",
      postalCode: "10117",
    },
  },
  {
    name: "Nike India",
    slug: "nike-india",
    countryCode: "IN",
    industry: "RETAIL",
    size: "201-500",
    members: 320,
    website: "https://in.nike.example",
    taxId: "27AAACN1234B1Z2",
    address: {
      addressLine1: "Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400051",
    },
  },
  {
    name: "Northwind Apparel UK",
    slug: "northwind-apparel-uk",
    countryCode: "GB",
    industry: "FASHION_APPAREL",
    size: "11-50",
    members: 42,
    website: "https://northwind-apparel.example",
    taxId: "GB123456789",
    address: {
      addressLine1: "221 Oxford Street",
      city: "London",
      state: "England",
      postalCode: "W1D 1BS",
    },
  },
  {
    name: "Urban Thread Co.",
    slug: "urban-thread-co",
    countryCode: "US",
    industry: "FASHION_APPAREL",
    size: "51-200",
    members: 64,
    website: "https://urbanthread.example",
    taxId: "12-3456789",
    address: {
      addressLine1: "500 Broadway",
      city: "New York",
      state: "NY",
      postalCode: "10012",
    },
  },
  {
    name: "Lumen Wear Singapore",
    slug: "lumen-wear-singapore",
    countryCode: "SG",
    industry: "FASHION_APPAREL",
    size: "11-50",
    members: 28,
    website: "https://lumenwear.example",
    taxId: "201912345K",
    address: {
      addressLine1: "2 Orchard Turn",
      city: "Singapore",
      state: "Singapore",
      postalCode: "238801",
    },
  },
  {
    name: "Trendslane Singapore",
    slug: "trendslane-singapore",
    countryCode: "SG",
    industry: "ECOMMERCE",
    size: "11-50",
    members: 34,
    website: "https://sg.trendslane.example",
    taxId: "202012345M",
    address: {
      addressLine1: "1 Raffles Place",
      city: "Singapore",
      state: "Singapore",
      postalCode: "048616",
    },
  },
]

// ---------------------------------------------------------------------------
// Generated organizations
// ---------------------------------------------------------------------------

const DEFAULT_COUNT = 1000

/** mulberry32: a small PRNG, so generated data is the same on every run. */
const createRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const random = createRandom(20261105)
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)]!
const digits = (length: number) =>
  Array.from({ length }, () => Math.floor(random() * 10)).join("")
const letters = (length: number) =>
  Array.from({ length }, () =>
    String.fromCharCode(65 + Math.floor(random() * 26))
  ).join("")

interface CountryProfile {
  name: string
  domain: string
  cities: readonly { city: string; state: string; postalCode: () => string }[]
  taxId: () => string
}

/** The 20 supported countries (SUPPORTED_COUNTRIES), with real cities. */
const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  IN: {
    name: "India",
    domain: "in",
    cities: [
      {
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: () => `560${digits(3)}`,
      },
      {
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: () => `400${digits(3)}`,
      },
      {
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: () => `600${digits(3)}`,
      },
      {
        city: "New Delhi",
        state: "Delhi",
        postalCode: () => `110${digits(3)}`,
      },
      {
        city: "Hyderabad",
        state: "Telangana",
        postalCode: () => `500${digits(3)}`,
      },
      { city: "Kochi", state: "Kerala", postalCode: () => `682${digits(3)}` },
    ],
    taxId: () => `29${letters(5)}${digits(4)}${letters(1)}1Z${digits(1)}`,
  },
  FR: {
    name: "France",
    domain: "fr",
    cities: [
      {
        city: "Paris",
        state: "Île-de-France",
        postalCode: () => `750${digits(2)}`,
      },
      {
        city: "Lyon",
        state: "Auvergne-Rhône-Alpes",
        postalCode: () => `6900${digits(1)}`,
      },
    ],
    taxId: () => `FR${digits(11)}`,
  },
  DE: {
    name: "Germany",
    domain: "de",
    cities: [
      { city: "Berlin", state: "Berlin", postalCode: () => `10${digits(3)}` },
      { city: "Munich", state: "Bavaria", postalCode: () => `80${digits(3)}` },
      { city: "Hamburg", state: "Hamburg", postalCode: () => `20${digits(3)}` },
    ],
    taxId: () => `DE${digits(9)}`,
  },
  SA: {
    name: "Saudi Arabia",
    domain: "sa",
    cities: [
      { city: "Riyadh", state: "Riyadh", postalCode: () => `1${digits(4)}` },
      { city: "Jeddah", state: "Makkah", postalCode: () => `2${digits(4)}` },
    ],
    taxId: () => `3${digits(13)}3`,
  },
  JP: {
    name: "Japan",
    domain: "jp",
    cities: [
      {
        city: "Tokyo",
        state: "Tokyo",
        postalCode: () => `1${digits(2)}-${digits(4)}`,
      },
      {
        city: "Osaka",
        state: "Osaka",
        postalCode: () => `5${digits(2)}-${digits(4)}`,
      },
    ],
    taxId: () => `T${digits(13)}`,
  },
  CN: {
    name: "China",
    domain: "cn",
    cities: [
      {
        city: "Shanghai",
        state: "Shanghai",
        postalCode: () => `200${digits(3)}`,
      },
      {
        city: "Shenzhen",
        state: "Guangdong",
        postalCode: () => `518${digits(3)}`,
      },
    ],
    taxId: () => `91${digits(16)}`,
  },
  ES: {
    name: "Spain",
    domain: "es",
    cities: [
      { city: "Madrid", state: "Madrid", postalCode: () => `280${digits(2)}` },
      {
        city: "Barcelona",
        state: "Catalonia",
        postalCode: () => `080${digits(2)}`,
      },
    ],
    taxId: () => `ESB${digits(8)}`,
  },
  US: {
    name: "USA",
    domain: "us",
    cities: [
      { city: "New York", state: "NY", postalCode: () => `100${digits(2)}` },
      { city: "Los Angeles", state: "CA", postalCode: () => `900${digits(2)}` },
      { city: "Chicago", state: "IL", postalCode: () => `606${digits(2)}` },
      { city: "Austin", state: "TX", postalCode: () => `787${digits(2)}` },
    ],
    taxId: () => `${digits(2)}-${digits(7)}`,
  },
  GB: {
    name: "UK",
    domain: "uk",
    cities: [
      {
        city: "London",
        state: "England",
        postalCode: () => `W1${letters(1)} ${digits(1)}${letters(2)}`,
      },
      {
        city: "Manchester",
        state: "England",
        postalCode: () => `M${digits(1)} ${digits(1)}${letters(2)}`,
      },
    ],
    taxId: () => `GB${digits(9)}`,
  },
  AE: {
    name: "UAE",
    domain: "ae",
    cities: [
      { city: "Dubai", state: "Dubai", postalCode: () => "" },
      { city: "Abu Dhabi", state: "Abu Dhabi", postalCode: () => "" },
    ],
    taxId: () => `100${digits(12)}`,
  },
  CA: {
    name: "Canada",
    domain: "ca",
    cities: [
      {
        city: "Toronto",
        state: "ON",
        postalCode: () =>
          `M${digits(1)}${letters(1)} ${digits(1)}${letters(1)}${digits(1)}`,
      },
      {
        city: "Vancouver",
        state: "BC",
        postalCode: () =>
          `V${digits(1)}${letters(1)} ${digits(1)}${letters(1)}${digits(1)}`,
      },
    ],
    taxId: () => `${digits(9)}RT0001`,
  },
  AU: {
    name: "Australia",
    domain: "au",
    cities: [
      { city: "Sydney", state: "NSW", postalCode: () => `20${digits(2)}` },
      { city: "Melbourne", state: "VIC", postalCode: () => `30${digits(2)}` },
    ],
    taxId: () => `${digits(11)}`,
  },
  IT: {
    name: "Italy",
    domain: "it",
    cities: [
      { city: "Milan", state: "Lombardy", postalCode: () => `201${digits(2)}` },
      { city: "Rome", state: "Lazio", postalCode: () => `001${digits(2)}` },
    ],
    taxId: () => `IT${digits(11)}`,
  },
  NL: {
    name: "Netherlands",
    domain: "nl",
    cities: [
      {
        city: "Amsterdam",
        state: "North Holland",
        postalCode: () => `10${digits(2)} ${letters(2)}`,
      },
      {
        city: "Rotterdam",
        state: "South Holland",
        postalCode: () => `30${digits(2)} ${letters(2)}`,
      },
    ],
    taxId: () => `NL${digits(9)}B01`,
  },
  SG: {
    name: "Singapore",
    domain: "sg",
    cities: [
      {
        city: "Singapore",
        state: "Singapore",
        postalCode: () => `0${digits(5)}`,
      },
    ],
    taxId: () => `20${digits(7)}${letters(1)}`,
  },
  MY: {
    name: "Malaysia",
    domain: "my",
    cities: [
      {
        city: "Kuala Lumpur",
        state: "Kuala Lumpur",
        postalCode: () => `50${digits(3)}`,
      },
      { city: "Penang", state: "Penang", postalCode: () => `10${digits(3)}` },
    ],
    taxId: () => `C${digits(10)}`,
  },
  KR: {
    name: "South Korea",
    domain: "kr",
    cities: [
      { city: "Seoul", state: "Seoul", postalCode: () => `0${digits(4)}` },
      { city: "Busan", state: "Busan", postalCode: () => `4${digits(4)}` },
    ],
    taxId: () => `${digits(3)}-${digits(2)}-${digits(5)}`,
  },
  BR: {
    name: "Brazil",
    domain: "br",
    cities: [
      {
        city: "São Paulo",
        state: "SP",
        postalCode: () => `01${digits(3)}-${digits(3)}`,
      },
      {
        city: "Rio de Janeiro",
        state: "RJ",
        postalCode: () => `20${digits(3)}-${digits(3)}`,
      },
    ],
    taxId: () => `${digits(2)}.${digits(3)}.${digits(3)}/0001-${digits(2)}`,
  },
  MX: {
    name: "Mexico",
    domain: "mx",
    cities: [
      {
        city: "Mexico City",
        state: "CDMX",
        postalCode: () => `06${digits(3)}`,
      },
      {
        city: "Guadalajara",
        state: "Jalisco",
        postalCode: () => `44${digits(3)}`,
      },
    ],
    taxId: () => `${letters(3)}${digits(6)}${letters(2)}${digits(1)}`,
  },
  CH: {
    name: "Switzerland",
    domain: "ch",
    cities: [
      { city: "Zurich", state: "Zurich", postalCode: () => `80${digits(2)}` },
      { city: "Geneva", state: "Geneva", postalCode: () => `12${digits(2)}` },
    ],
    taxId: () => `CHE-${digits(3)}.${digits(3)}.${digits(3)}`,
  },
}

const COUNTRY_CODES = Object.keys(COUNTRY_PROFILES)

const BRANDS = [
  "Aurora",
  "Bloom",
  "Cobalt",
  "Driftwood",
  "Ember",
  "Fable",
  "Garnet",
  "Harbor",
  "Indigo",
  "Juniper",
  "Kestrel",
  "Linen",
  "Maple",
  "Nimbus",
  "Onyx",
  "Pebble",
  "Quill",
  "Rosewood",
  "Saffron",
  "Tidal",
  "Umber",
  "Velvet",
  "Willow",
  "Zephyr",
  "Atlas",
  "Birch",
  "Cedar",
  "Dune",
  "Echo",
  "Fern",
  "Grove",
  "Haven",
  "Iris",
  "Jade",
  "Kite",
  "Lotus",
  "Meadow",
  "North",
  "Opal",
  "Prism",
  "Quartz",
  "Ridge",
  "Sable",
  "Terra",
] as const

const SUFFIXES: Record<OrganizationIndustry, readonly string[]> = {
  FASHION_APPAREL: ["Apparel", "Couture", "Threads", "Wear", "Fashion House"],
  RETAIL: ["Retail", "Stores", "Mart", "Outlet"],
  ECOMMERCE: ["Commerce", "Online", "Marketplace", "Direct"],
  HEALTH_BEAUTY: ["Beauty", "Cosmetics", "Wellness", "Skin Co."],
  ELECTRONICS: ["Electronics", "Devices", "Tech Retail"],
  HOME_FURNITURE: ["Home", "Living", "Interiors", "Furnishings"],
  MANUFACTURING: ["Textiles", "Mills", "Manufacturing", "Works"],
  TECHNOLOGY: ["Labs", "Digital", "Systems"],
  LOGISTICS: ["Logistics", "Freight", "Supply"],
  EDUCATION: ["Academy", "Institute", "Learning"],
  OTHER: ["Group", "Collective", "Ventures"],
}

// Mostly fashion and retail, since that's who Nexora is for.
const INDUSTRY_WEIGHTS: Record<OrganizationIndustry, number> = {
  FASHION_APPAREL: 30,
  RETAIL: 18,
  ECOMMERCE: 18,
  HEALTH_BEAUTY: 8,
  HOME_FURNITURE: 6,
  MANUFACTURING: 6,
  ELECTRONICS: 4,
  TECHNOLOGY: 3,
  LOGISTICS: 3,
  EDUCATION: 2,
  OTHER: 2,
}

const pickIndustry = (): OrganizationIndustry => {
  const total = ORGANIZATION_INDUSTRIES.reduce(
    (sum, industry) => sum + INDUSTRY_WEIGHTS[industry],
    0
  )
  let roll = random() * total
  for (const industry of ORGANIZATION_INDUSTRIES) {
    roll -= INDUSTRY_WEIGHTS[industry]
    if (roll < 0) return industry
  }
  return "OTHER"
}

/** Seeded members per size band: a few per org, so 1000 orgs stay quick. */
const MEMBER_RANGE: Record<OrganizationSize, [number, number]> = {
  "1-10": [1, 10],
  "11-50": [11, 50],
  "51-200": [51, 120],
  "201-500": [121, 200],
  "501-1000": [201, 260],
  "1001+": [261, 320],
}

// Small companies are the most common.
const SIZE_WEIGHTS = [30, 30, 20, 10, 6, 4]

const pickSize = (): OrganizationSize => {
  let roll = random() * SIZE_WEIGHTS.reduce((a, b) => a + b, 0)
  for (const [index, size] of ORGANIZATION_SIZES.entries()) {
    roll -= SIZE_WEIGHTS[index]!
    if (roll < 0) return size
  }
  return "1-10"
}

const toSlug = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** `count` generated organizations, unique by slug, after the design ones. */
const generateOrganizations = (count: number): SeedOrganization[] => {
  const slugs = new Set(SEED_ORGANIZATIONS.map(({ slug }) => slug))
  const generated: SeedOrganization[] = []

  while (generated.length < count) {
    const countryCode = pick(COUNTRY_CODES)
    const country = COUNTRY_PROFILES[countryCode]!
    const industry = pickIndustry()
    const size = pickSize()
    const [min, max] = MEMBER_RANGE[size]
    const location = pick(country.cities)

    // "Aurora Threads India"; a number only when the name is already taken.
    let name = `${pick(BRANDS)} ${pick(SUFFIXES[industry])} ${country.name}`
    let slug = toSlug(name)
    for (let n = 2; slugs.has(slug); n++) {
      name = `${name.replace(/ \d+$/, "")} ${n}`
      slug = toSlug(name)
    }
    slugs.add(slug)

    generated.push({
      name,
      slug,
      countryCode,
      industry,
      size,
      members: min + Math.floor(random() * (max - min + 1)),
      website: `https://${slug}.example`,
      taxId: country.taxId(),
      address: {
        addressLine1: `${1 + Math.floor(random() * 400)} ${pick(["High Street", "Market Road", "Park Avenue", "Station Road", "Main Street"])}`,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode(),
      },
    })
  }

  return generated
}

/** --count=N from the command line, else DEFAULT_COUNT. */
const requestedCount = () => {
  const arg = process.argv.find((value) => value.startsWith("--count="))
  const count = arg ? Number(arg.slice("--count=".length)) : DEFAULT_COUNT
  if (!Number.isInteger(count) || count < 1 || count > 10_000) {
    throw new Error("--count must be a whole number from 1 to 10000")
  }
  return count
}

const SEED_USER_ID = "dev-seed"

const seedOrganization = async (seed: SeedOrganization) => {
  return db.transaction(async (tx) => {
    const existing = await tx.orm.public.Organization.where({
      slug: seed.slug,
    }).first()

    const organization =
      existing ??
      (await tx.orm.public.Organization.create({
        name: seed.name,
        slug: seed.slug,
        description: `${seed.name} (development seed data).`,
        countryCode: seed.countryCode,
        industry: seed.industry,
        size: seed.size,
        website: seed.website,
        logoObjectKey: "dev-seed/none",
        taxDetails: { taxId: seed.taxId, registrationNumber: "" },
        address: { ...seed.address, addressLine2: "" },
        status: "ACTIVE",
        createdByUserId: SEED_USER_ID,
      }))

    const members = Array.from({ length: seed.members }, (_, index) => ({
      organizationId: organization.id,
      userId: `${SEED_USER_ID}-${seed.slug}-${index + 1}`,
      status: "ACTIVE" as const,
    }))

    // (organizationId, userId) is unique, so members already there are skipped.
    const addedMembers =
      await tx.orm.public.OrganizationMembership.createAndCount(members, {
        onConflict: "skip",
      })

    return { created: !existing, addedMembers }
  })
}

const main = async () => {
  if (env.NODE_ENV === "production") {
    throw new Error("seed:dev refuses to run with NODE_ENV=production")
  }

  const count = requestedCount()
  const seeds = [
    ...SEED_ORGANIZATIONS.slice(0, count),
    ...generateOrganizations(Math.max(0, count - SEED_ORGANIZATIONS.length)),
  ]

  let created = 0
  let members = 0
  for (const [index, seed] of seeds.entries()) {
    const result = await seedOrganization(seed)
    if (result.created) created++
    members += result.addedMembers
    if ((index + 1) % 100 === 0 || index + 1 === seeds.length) {
      console.log(`${index + 1}/${seeds.length} organizations processed`)
    }
  }

  console.log(
    `Done: ${created} organizations created, ${seeds.length - created} already there, ${members} members added.`
  )
}

main()
  .catch((error: unknown) => {
    console.error("Seeding failed", error)
    process.exitCode = 1
  })
  .finally(() => db.close())
