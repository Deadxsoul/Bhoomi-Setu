import { useState } from 'react';

const CATEGORIES = [
  {
    title: 'Land acquisition & records',
    blurb: 'The laws and national programmes this platform itself is built on top of.',
    schemes: [
      {
        name: 'RFCTLARR Act, 2013',
        tag: 'Central law',
        desc: "The law behind every compensation and rehabilitation figure on this platform. Replaced the colonial-era Land Acquisition Act of 1894, in force since 1 January 2014.",
        whoFor: 'Every landowner and livelihood-dependent family affected by a government land acquisition, anywhere in India (except Jammu & Kashmir).',
        offers: [
          'A mandatory Social Impact Assessment (SIA) before acquisition, reviewed by an independent expert group that can recommend cancelling a project if the social cost is too high',
          'Multi-crop irrigated farmland can\u2019t be acquired except in exceptional cases, to protect food security',
          'Compensation isn\u2019t discretionary — it\u2019s a formula: market value \u00d7 a rural/urban multiplier (1.0\u20132.0x for rural land depending on distance from town), plus a 100% solatium on top, plus separate value for crops, trees, wells, and structures',
          'A landowner who thinks the award is unfair has a formal legal path to challenge it, not just an informal complaint',
        ],
        howTo: 'Applies automatically to any acquisition under this Act — nothing to apply for. If you disagree with an award, you can formally contest it through the Land Acquisition, Rehabilitation and Resettlement Authority (LARRA) in your state.',
        link: 'https://dolr.gov.in/en/act-rules/',
      },
      {
        name: 'DILRMP',
        tag: 'Central scheme',
        desc: 'Digital India Land Records Modernisation Programme — the national push to digitize land records and link them with registration, tax, and ownership data in one place.',
        whoFor: 'All states and UTs — implemented through state revenue departments, not something an individual applies to directly.',
        offers: [
          '100% centrally funded (unlike its predecessor, which required state co-funding)',
          'A single, unified record instead of the old system of separate textual records (RoR), maps, and registration documents that often contradicted each other',
          'Feeds directly into ULPIN and SVAMITVA below',
        ],
        howTo: 'Rolled out state-by-state through the revenue department — check your state\u2019s land records portal to see how far your district has been digitized.',
        link: 'https://dolr.gov.in/',
      },
      {
        name: 'ULPIN ("Bhu-Aadhaar")',
        tag: 'Central scheme',
        desc: "A unique 14-digit ID given to every surveyed land parcel in India — an Aadhaar number, but for land. Launched in 2021, adopted by 26+ states/UTs so far.",
        whoFor: 'Any landowner whose district has completed the survey — this is what your parcel\u2019s Land ID on this platform is standing in for.',
        offers: [
          'One number that reliably identifies a parcel by its exact geo-coordinates, encoding state, district, taluka, and village into the code itself',
          'The number stays the same even when ownership is transferred, so a sale never resets the ID',
          'Makes duplicate registrations and fraudulent double-sales much harder to pull off',
        ],
        howTo: 'Generated automatically once your area is surveyed under DILRMP/SVAMITVA — check with your local revenue/tehsildar office or state land records portal for your parcel\u2019s ULPIN.',
        link: 'https://dolr.gov.in/en/ulpin/',
      },
      {
        name: 'SVAMITVA Scheme',
        tag: 'Central scheme',
        desc: 'Drone-surveyed property cards for rural inhabited (abadi) land — different from farmland records, this covers village residential plots.',
        whoFor: 'Rural households living on land that has never had a formal property record (very common in villages).',
        offers: [
          'A legal property card you can actually use as collateral for a bank loan',
          'Clear boundaries that head off the neighbour-vs-neighbour disputes that come from undocumented plots',
          'Better data for gram panchayats to plan development and collect property tax fairly',
        ],
        howTo: 'Conducted as a village-wide drone survey by the state, not an individual application — property cards are distributed once your village has been surveyed.',
        link: 'https://svamitva.nic.in/',
      },
    ],
  },
  {
    title: 'Buying & selling land',
    blurb: 'Worth knowing before you submit a sale — these can change what you actually pay.',
    schemes: [
      {
        name: 'Stamp duty concession for women',
        tag: 'State-level',
        desc: 'Most states give a 1–2% stamp duty waiver when the buyer, or a co-owner, is a woman.',
        whoFor: 'Any woman buying property, or being added as a co-owner alongside a male buyer — exact rate and rules vary by state.',
        offers: [
          '1–2% lower stamp duty than the standard rate, a direct saving on registration cost',
          'Some banks (e.g. SBI\u2019s Her Ghar scheme) also offer a slightly lower home-loan interest rate when a woman is the applicant',
          'Combines with PMAY housing subsidies below if the land is being bought to build a home',
        ],
        howTo: 'Applied automatically at the sub-registrar\u2019s office when the deed names a woman as buyer/co-owner — no separate application, just make sure her name is on the sale deed correctly.',
        link: null,
      },
    ],
  },
  {
    title: 'Resettlement & rehabilitation',
    blurb: "For families displaced by acquisition — what they're entitled to beyond the cash compensation.",
    schemes: [
      {
        name: 'RFCTLARR — R&R benefits',
        tag: 'Central law',
        desc: 'The rehabilitation and resettlement half of the same Act that governs compensation — this is what your R&R module should be tracking per family.',
        whoFor: 'Families displaced by an acquisition, and anyone whose livelihood (not just ownership) depended on the acquired land — tenants and farm labourers included, not just titleholders.',
        offers: [
          'Housing assistance — either a built house or an equivalent allowance',
          'Relocation and transportation allowances for the actual move',
          'In some cases, an annuity or employment support for the household, not a one-time payment only',
          'No displacement is allowed to happen until the replacement site has been surveyed and basic services are actually functional there',
        ],
        howTo: 'Assessed and disbursed as part of the acquisition\u2019s formal R&R plan — your district administration\u2019s land acquisition office manages this alongside the compensation award.',
        link: 'https://dolr.gov.in/en/act-rules/',
      },
      {
        name: 'PMAY — Gramin',
        tag: 'Central scheme',
        desc: 'The rural housing scheme resettled families are commonly routed into for rebuilding a pucca (permanent) home.',
        whoFor: 'Rural households without a pucca house, selected through the SECC 2011 census data plus an Awaas+ survey and Gram Sabha approval — not a walk-in application.',
        offers: [
          'Financial assistance to build a durable house with sanitation, electricity, and water access',
          'Convergence with other schemes: MGNREGA can fund labour days for construction, Swachh Bharat Mission covers toilet construction, PM Ujjwala Yojana covers the LPG connection',
          'A strong focus on women\u2019s ownership — over 74% of sanctioned houses nationally are owned solely or jointly by women',
        ],
        howTo: 'Selection happens through the SECC list and a village-level Awaas+ survey with Gram Sabha sign-off — check status through the PMAY-Gramin portal using your registration/assessment ID.',
        link: 'https://pmayg.gov.in/',
      },
    ],
  },
];

export default function Schemes() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-display font-semibold text-ink mb-1">Government schemes</h1>
      <p className="text-sm text-ink-soft mb-8">
        Real central and state schemes relevant to acquisition, resettlement, and buying or selling land —
        for reference, not something this platform administers directly.
      </p>

      {CATEGORIES.map((cat) => (
        <div key={cat.title} className="mb-8">
          <h2 className="font-display font-semibold text-ink mb-1">{cat.title}</h2>
          <p className="text-xs text-ink-soft mb-3">{cat.blurb}</p>

          <div className="space-y-2">
            {cat.schemes.map((s) => {
              const id = `${cat.title}-${s.name}`;
              const isOpen = openIdx === id;
              return (
                <div key={id} className="bg-paper border border-stone rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-ink text-sm">{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wide text-ink-soft bg-cream border border-stone rounded-full px-2 py-0.5">
                        {s.tag}
                      </span>
                    </span>
                    <span className="text-ink-soft text-sm">{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-ink-soft leading-relaxed space-y-3">
                      <p>{s.desc}</p>

                      <div>
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-1">Who it's for</p>
                        <p>{s.whoFor}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-1">What it offers</p>
                        <ul className="list-disc list-outside pl-4 space-y-1">
                          {s.offers.map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-1">How to access it</p>
                        <p>{s.howTo}</p>
                      </div>

                      {s.link && (
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-sage-3 hover:underline text-xs font-medium"
                        >
                          Official page ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
