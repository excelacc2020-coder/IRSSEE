import type { LessonTopic } from '../types';

// Lesson plan derived from EA_Lesson_Plan_Aug-Oct_2025_with_videos.xlsx
// Days 1–50 in exact study sequence across 10 weeks
export const LESSON_PLAN: LessonTopic[] = [

  // ── WEEK 1: Level 1 — Client Intake & Filing Foundations ──────────────────
  {
    day: 1, week: 1, part: 1,
    topic: 'Client Intake, Identity & Filing Requirements',
    irsPublications: ['Pub 519', 'Pub 17 Ch. 1', 'Pub 4012'],
    videoKeywords: ['IRS EA exam client intake 1040 overview', 'ITIN SSN residency SEE exam'],
    videoUrl: 'https://www.youtube.com/watch?v=cyPxZmkGqSs&t=205',
    videoNotes: 'P1 V1 — Client intake / 1040 overview [00:03:25]; ITIN/SSN [01:16:47]; residency [01:21:25]',
  },
  {
    day: 2, week: 1, part: 1,
    topic: 'Filing Status & Dependents',
    irsPublications: ['Pub 501', 'Pub 17 Ch. 2-3'],
    videoKeywords: ['filing status SEE exam', 'qualifying child relative tiebreaker EA exam'],
    videoUrl: 'https://www.youtube.com/watch?v=cyPxZmkGqSs&t=5798',
    videoNotes: 'P1 V1 — Filing status [01:36:38]; QC test [01:49:26]; QR test [01:51:00]; tiebreakers [02:24:19]',
  },
  {
    day: 3, week: 1, part: 1,
    topic: 'ACA Coverage & Premium Tax Credit',
    irsPublications: ['Pub 974', 'Pub 17', 'Form 8962 Instructions'],
    videoKeywords: ['ACA premium tax credit SEE exam', 'Form 8962 advance PTC MAGI household'],
    videoUrl: 'https://www.youtube.com/watch?v=fIaY44fhBBA&t=2288',
    videoNotes: 'P1 V5 — ACA / Premium Tax Credit [00:38:08]; advance PTC, household income, MAGI, repayment',
  },

  // ── WEEK 1 (cont.): Level 2 — Income & Property (Segment A) ───────────────
  {
    day: 4, week: 1, part: 1,
    topic: 'W-2 Wages, Tips & Fringe Benefits',
    irsPublications: ['Pub 525', 'Pub 15-B', 'Pub 17 Ch. 5'],
    videoKeywords: ['W-2 wages fringe benefits SEE exam', 'constructive receipt taxable compensation EA'],
    videoNotes: 'P1 V2 — no transcript available (PDF study only)',
  },
  {
    day: 5, week: 1, part: 1,
    topic: 'Interest, Dividends & Kiddie Tax',
    irsPublications: ['Pub 550', 'Pub 929', 'Pub 17 Ch. 7-8'],
    videoKeywords: ['interest dividend income 1099-INT DIV', 'kiddie tax unearned income SEE'],
    videoUrl: 'https://www.youtube.com/watch?v=fIaY44fhBBA&t=1034',
    videoNotes: 'P1 V5 — Kiddie tax [00:17:14]; Note: 1099-INT/DIV in P1 V2 (no transcript)',
  },

  // ── WEEK 2: Level 2 (cont.) ────────────────────────────────────────────────
  {
    day: 6, week: 2, part: 1,
    topic: 'Self-Employment Income & Schedule C',
    irsPublications: ['Pub 334', 'Pub 535', 'Pub 583'],
    videoKeywords: ['Schedule C self-employment 1099-NEC SEE exam', 'hobby vs business loss EA exam'],
    videoNotes: 'P1 V2 — no transcript available (PDF study only)',
  },
  {
    day: 7, week: 2, part: 1,
    topic: 'Pass-Through Income — K-1 & QBI Overview',
    irsPublications: ['Pub 541', 'Pub 550', 'Pub 535'],
    videoKeywords: ['Schedule K-1 pass-through income SEE', 'QBI 199A deduction EA exam'],
    videoUrl: 'https://www.youtube.com/watch?v=37OVYs7zvSA&t=7574',
    videoNotes: 'P1 V4 — QBI/199A overview [02:06:14]',
  },
  {
    day: 8, week: 2, part: 1,
    topic: 'Retirement Income — IRAs, 1099-R & Form 8606',
    irsPublications: ['Pub 590-A', 'Pub 590-B', 'Pub 575'],
    videoKeywords: ['1099-R retirement income SEE exam', 'traditional Roth IRA rollover conversion Form 8606'],
    videoNotes: 'P1 V6 — missing from playlist (PDF study only)',
  },
  {
    day: 9, week: 2, part: 1,
    topic: 'Social Security, RRB Benefits & Gambling Income',
    irsPublications: ['Pub 915', 'Pub 505', 'Pub 525'],
    videoKeywords: ['Social Security provisional income taxable SEE exam', 'gambling income W-2G EA exam'],
    videoNotes: 'P1 V6 — missing from playlist (PDF study only)',
  },
  {
    day: 10, week: 2, part: 1,
    topic: 'Other Income — COD, Scholarships & Alimony',
    irsPublications: ['Pub 525', 'Pub 4681', 'Pub 970'],
    videoKeywords: ['cancellation of debt 1099-C SEE exam', 'alimony scholarship foreign income EA'],
    videoUrl: 'https://www.youtube.com/watch?v=RwFJCQVmyrk&t=6546',
    videoNotes: 'P1 V3 — COD/1099-C [01:49:06]',
  },

  // ── WEEK 3: Level 4 — Adjustments, Deductions & Credits ───────────────────
  {
    day: 11, week: 3, part: 1,
    topic: 'Above-the-Line Adjustments — HSA, IRA & SE Tax',
    irsPublications: ['Pub 969', 'Pub 590-A', 'Pub 560'],
    videoKeywords: ['above the line adjustments SEE exam', 'HSA IRA SEP SIMPLE student loan interest EA'],
    videoUrl: 'https://www.youtube.com/watch?v=37OVYs7zvSA&t=157',
    videoNotes: 'P1 V4 — Above-the-line adjustments [00:02:37]; HSA [00:05:33]; IRA/SEP/SIMPLE [00:10:42]; SE tax [00:15:56]; student loan interest [00:11:21]',
  },
  {
    day: 12, week: 3, part: 1,
    topic: 'Itemized Deductions — Medical, SALT, Interest & Charitable',
    irsPublications: ['Pub 502', 'Pub 526', 'Pub 936'],
    videoKeywords: ['itemized deductions standard deduction SEE exam', 'SALT medical charitable mortgage interest EA'],
    videoUrl: 'https://www.youtube.com/watch?v=37OVYs7zvSA&t=1262',
    videoNotes: 'P1 V4 — Standard deduction [00:21:02]; itemized overview [00:33:24]; medical [00:34:19]; SALT [00:43:25]; mortgage interest [00:49:22]; charitable [00:57:58]',
  },
  {
    day: 13, week: 3, part: 1,
    topic: 'Tax Credits I — CTC, Child Care & EITC',
    irsPublications: ['Pub 596', 'Pub 503', 'Pub 972'],
    videoKeywords: ['child tax credit CTC EITC SEE exam', 'child dependent care credit due diligence EA'],
    videoUrl: 'https://www.youtube.com/watch?v=fIaY44fhBBA&t=3525',
    videoNotes: 'P1 V5 — CTC [00:58:45]; ODC [01:02:10]; Child & Dependent Care [01:04:50]; EITC [01:09:27]',
  },
  {
    day: 14, week: 3, part: 1,
    topic: 'Tax Credits II — Education, Adoption & Energy',
    irsPublications: ['Pub 970', 'Pub 17 Ch. 37'],
    videoKeywords: ['AOTC lifetime learning credit SEE exam', 'adoption credit energy credits EA exam'],
    videoUrl: 'https://www.youtube.com/watch?v=fIaY44fhBBA&t=4750',
    videoNotes: 'P1 V5 — AOTC/LLC education credits [01:19:10]; adoption credit [01:28:19]; energy credits [01:35:55]',
  },
  {
    day: 15, week: 3, part: 1,
    topic: 'Tax Computation — AMT, NIIT & Estimated Tax',
    irsPublications: ['Pub 505', 'Pub 17 Ch. 28-29'],
    videoKeywords: ['AMT alternative minimum tax SEE exam', 'NIIT net investment income estimated tax penalty EA'],
    videoUrl: 'https://www.youtube.com/watch?v=fIaY44fhBBA&t=0',
    videoNotes: 'P1 V5 — Tax computation [00:00:00]; ordinary vs CG rates [00:14:24]; AMT [00:24:23]; NIIT [00:53:26]; estimated tax [01:47:49]',
  },

  // ── WEEK 4: Level 3 — Income & Property (Segment B) ───────────────────────
  {
    day: 16, week: 4, part: 1,
    topic: 'Basis Fundamentals — Purchased, Gifted & Inherited',
    irsPublications: ['Pub 550', 'Pub 551'],
    videoKeywords: ['cost basis stock purchased gifted inherited SEE', 'PTP basis stock splits EA exam'],
    videoUrl: 'https://www.youtube.com/watch?v=RwFJCQVmyrk&t=708',
    videoNotes: 'P1 V3 — Basis fundamentals [00:11:48]; stock splits [00:21:49]; inherited/gifted [00:25:26]; PTP basis [01:06:34]',
  },
  {
    day: 17, week: 4, part: 1,
    topic: 'Capital Gains & Losses — Netting, Wash Sales & Crypto',
    irsPublications: ['Pub 550', 'Pub 544'],
    videoKeywords: ['capital gains losses short long term SEE exam', 'wash sale virtual currency crypto EA'],
    videoUrl: 'https://www.youtube.com/watch?v=RwFJCQVmyrk&t=2007',
    videoNotes: 'P1 V3 — Short/long-term CG [00:33:27]; netting [00:37:08]; wash sales [00:58:18]; virtual currency [01:26:35]',
  },
  {
    day: 18, week: 4, part: 1,
    topic: 'Home Sale (IRC 121), Installment Sales & Like-Kind Exchanges',
    irsPublications: ['Pub 523', 'Pub 537', 'Pub 544'],
    videoKeywords: ['home sale exclusion IRC 121 SEE exam', 'installment sale like-kind exchange 1031 EA'],
    videoUrl: 'https://www.youtube.com/watch?v=RwFJCQVmyrk&t=5834',
    videoNotes: 'P1 V3 — Home sale IRC 121 [01:37:14]; installment sales [01:51:49]; like-kind exchange 1031 [01:56:23]',
  },
  {
    day: 19, week: 4, part: 1,
    topic: 'Royalties, 1099-MISC & 1099-NEC Irregularities',
    irsPublications: ['Pub 535', 'Pub 17 Ch. 9'],
    videoKeywords: ['royalties Schedule E 1099-MISC corrections SEE', '1099-NEC irregularities EA exam'],
    videoUrl: 'https://www.youtube.com/watch?v=2QD66GRtD60&t=243',
    videoNotes: 'P2 V8 — Royalties on Schedule E [00:04:03]',
  },
  {
    day: 20, week: 4, part: 1,
    topic: 'Advising Individual Taxpayers & QBI (199A) Orientation',
    irsPublications: ['Pub 542', 'Pub 17', 'Pub 535'],
    videoKeywords: ['QBI 199A deduction planning SEE exam', 'advising individual taxpayer estate retirement EA'],
    videoUrl: 'https://www.youtube.com/watch?v=37OVYs7zvSA&t=7574',
    videoNotes: 'P1 V4 — QBI/199A orientation [02:06:14]',
  },

  // ── WEEK 5: Level 5 — Specialized Individuals + Business Basics ───────────
  {
    day: 21, week: 5, part: 1,
    topic: 'Estate Tax Fundamentals — Form 706 & Form 1041',
    irsPublications: ['Pub 950', 'Pub 559', 'Form 706 Instructions'],
    videoKeywords: ['estate tax Form 706 gross estate SEE exam', 'marital deduction portability Form 1041 EA'],
    videoUrl: 'https://www.youtube.com/watch?v=4pi-30kZrPI&t=2698',
    videoNotes: 'P2 V9 — Trust/estate income tax Form 1041 [00:44:58]; Note: Form 706 in P1 V7 (missing)',
  },
  {
    day: 22, week: 5, part: 1,
    topic: 'Gift Tax — Annual Exclusion, Splitting & Form 709',
    irsPublications: ['Pub 559', 'Form 709 Instructions'],
    videoKeywords: ['gift tax annual exclusion gift splitting SEE exam', 'unified credit Form 709 EA exam'],
    videoNotes: 'P1 V7 — Gift tax / Form 709 (missing from playlist; PDF study only)',
  },
  {
    day: 23, week: 5, part: 1,
    topic: 'International Reporting — FBAR, Form 8938 & Forms 3520/5471',
    irsPublications: ['Pub 54', 'Pub 514', 'FinCEN 114 Instructions'],
    videoKeywords: ['FBAR Form 8938 international reporting SEE exam', 'Forms 3520 5471 8865 EA exam penalties'],
    videoUrl: 'https://www.youtube.com/watch?v=JOv9KGtkR3E&t=4872',
    videoNotes: 'P2 V1 — FBAR/international reporting [01:21:12]; Form 3520 briefly in P2 V9 [00:56:30]',
  },
  {
    day: 24, week: 5, part: 2,
    topic: 'Business Entities Overview — Sole Prop to Corporations',
    irsPublications: ['Pub 334', 'Pub 542', 'Pub 3402'],
    videoKeywords: ['business entity types sole proprietor LLC SEE exam', 'entity classification EIN tax year EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=JOv9KGtkR3E&t=100',
    videoNotes: 'P2 V1 — Business entities overview [00:01:40]',
  },
  {
    day: 25, week: 5, part: 2,
    topic: 'C Corporations — E&P, Dividends, Distributions & Liquidations',
    irsPublications: ['Pub 542', 'Pub 17'],
    videoKeywords: ['C corporation Form 1120 SEE exam', 'E&P earnings profits dividends liquidation EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=fieJ_RrqPJ0&t=0',
    videoNotes: 'P2 V6 — C corps overview [00:00:00]; Form 1120 due date [00:03:55]; E&P [00:40:58]; distributions [00:49:27]',
  },

  // ── WEEK 6: Level 6 — Entity Formation & Pass-Through Operations ──────────
  {
    day: 26, week: 6, part: 2,
    topic: 'Corporate Formation — IRC 351, Boot & Basis',
    irsPublications: ['Pub 542', 'Pub 544'],
    videoKeywords: ['IRC 351 corporate formation boot basis SEE exam', 'services for stock control test EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=fieJ_RrqPJ0&t=1938',
    videoNotes: 'P2 V6 — Forming corp / IRC 351 [00:32:18]; boot treatment [00:37:02]; control test and basis rules',
  },
  {
    day: 27, week: 6, part: 2,
    topic: 'S Corporations — Election, Shareholder Basis & Distributions',
    irsPublications: ['Pub 589', 'Pub 3402', 'Form 2553 Instructions'],
    videoKeywords: ['S corporation eligibility election SEE exam', 'shareholder basis stock loan distributions EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=t762Hrza3Mc&t=0',
    videoNotes: 'P2 V7 — S corps overview [00:00:00]; eligibility/election Form 2553 [00:04:38]',
  },
  {
    day: 28, week: 6, part: 2,
    topic: 'Partnerships I — Formation, Contributions & Guaranteed Payments',
    irsPublications: ['Pub 541'],
    videoKeywords: ['partnership formation contributions basis SEE exam', 'guaranteed payments partner capital BBA audit EA'],
    videoUrl: 'https://www.youtube.com/watch?v=gm4NcpOaW68&t=787',
    videoNotes: 'P2 V5 — Partnership formation [00:13:07]; guaranteed payments [00:22:00]; partner capital/basis [00:31:04]; contributions incl. debt [00:44:07]',
  },
  {
    day: 29, week: 6, part: 2,
    topic: 'Partnerships II — Operations, Distributions & Sale',
    irsPublications: ['Pub 541', 'Pub 550'],
    videoKeywords: ['partnership distributions allocations SEE exam', 'partnership termination sale dealer EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=gm4NcpOaW68&t=2044',
    videoNotes: 'P2 V5 — Partnership operations/allocations [00:34:04]; distributions [00:36:54]; sale/termination [01:04:56]',
  },
  {
    day: 30, week: 6, part: 2,
    topic: 'Business Income — Gross Receipts, COGS & Home Office',
    irsPublications: ['Pub 334', 'Pub 587'],
    videoKeywords: ['business income Schedule C gross receipts SEE exam', 'COGS inventory UNICAP home office EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=tzDIlAHSosQ&t=2859',
    videoNotes: 'P2 V2 — Gross receipts/business income [00:47:39]; COGS/inventory [00:55:49]; UNICAP [01:00:24]',
  },

  // ── WEEK 7: Level 7 — Business Deductions, Assets & Analysis ─────────────
  {
    day: 31, week: 7, part: 2,
    topic: 'Business Expenses — Travel, Meals, Vehicles & Fringe Benefits',
    irsPublications: ['Pub 15-B', 'Pub 463', 'Pub 535'],
    videoKeywords: ['business expenses travel meals vehicle SEE exam', 'fringe benefits accountable plan family employment EA'],
    videoUrl: 'https://www.youtube.com/watch?v=XDItsFiTh_E&t=0',
    videoNotes: 'P2 V4 — Business expenses [00:00:00]; travel/meals [00:40:07]; vehicle expenses',
  },
  {
    day: 32, week: 7, part: 2,
    topic: 'Business Assets — Depreciation, Sec. 179 & Bonus',
    irsPublications: ['Pub 946', 'Pub 535'],
    videoKeywords: ['depreciation Section 179 bonus depreciation SEE exam', 'de minimis safe harbor repairs capitalization EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=Q_XecgWSQLM&t=0',
    videoNotes: 'P2 V3 — Depreciation/179/bonus [00:00:00]; basis of business assets [00:01:57]; de minimis safe harbor; repairs vs. capitalization',
  },
  {
    day: 33, week: 7, part: 2,
    topic: 'Book-to-Tax Analysis — M-1/M-2/M-3 & Related Parties',
    irsPublications: ['Pub 542', 'Pub 544'],
    videoKeywords: ['M-1 M-2 M-3 book to tax reconciliation SEE exam', 'related party transactions K-1 separately stated EA'],
    videoUrl: 'https://www.youtube.com/watch?v=fieJ_RrqPJ0&t=3975',
    videoNotes: 'P2 V6 — Related-party transactions [01:09:35]; M-1/M-2/M-3 book-to-tax [01:21:44]',
  },
  {
    day: 34, week: 7, part: 2,
    topic: 'Advising Business Taxpayers — Worker Classification & 1099s',
    irsPublications: ['Pub 15', 'Pub 1779', 'Pub 15-A'],
    videoKeywords: ['worker classification employee contractor SEE exam', 'ACA compliance 1099 Form 8300 payroll EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=JOv9KGtkR3E&t=5051',
    videoNotes: 'P2 V1 — Payroll/Form 941 [01:24:11]; worker classification [01:30:54]; ACA compliance in P2 V4 [01:36:39]',
  },
  {
    day: 35, week: 7, part: 2,
    topic: 'Trust & Estate Income Tax — DNI & Beneficiary Allocations',
    irsPublications: ['Pub 559', 'Pub 17'],
    videoKeywords: ['trust estate income tax DNI distributable net income SEE', 'Form 1041 trust types simple complex grantor EA'],
    videoUrl: 'https://www.youtube.com/watch?v=4pi-30kZrPI&t=2698',
    videoNotes: 'P2 V9 — Trust/estate income tax [00:44:58]; trust types simple/complex/grantor [00:47:52]; DNI, deductions, beneficiary allocations',
  },

  // ── WEEK 8: Level 8 — Specialized Business & Representation Kickoff ───────
  {
    day: 36, week: 8, part: 2,
    topic: 'Exempt Organizations — 501(c) Status, UBIT & Form 990',
    irsPublications: ['Pub 557', 'Pub 4221-PC'],
    videoKeywords: ['exempt organizations 501c3 UBIT SEE exam', 'Form 990 Form 1023 1024 EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=2QD66GRtD60&t=3871',
    videoNotes: 'P2 V8 — Exempt orgs [01:04:31]; 501(c)(3) [01:04:46]; Form 990 [01:07:12]; UBIT [01:10:43]',
  },
  {
    day: 37, week: 8, part: 2,
    topic: 'Business Retirement Plans — SEP, SIMPLE & Prohibited Transactions',
    irsPublications: ['Pub 560', 'Pub 590-A'],
    videoKeywords: ['SEP SIMPLE 401k business retirement plans SEE exam', 'prohibited transactions defined benefit EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=4pi-30kZrPI&t=46',
    videoNotes: 'P2 V9 — Business retirement plans [00:00:46]; SEP/SIMPLE [00:01:45]; 401(k)/defined benefit [00:10:44]',
  },
  {
    day: 38, week: 8, part: 2,
    topic: 'Farmers — Schedule F, Farm Income & Estimated Tax',
    irsPublications: ['Pub 225', 'Pub 51'],
    videoKeywords: ['farm income Schedule F Schedule SE SEE exam', 'farmer estimated tax disaster provisions EA Part 2'],
    videoUrl: 'https://www.youtube.com/watch?v=2QD66GRtD60&t=1764',
    videoNotes: 'P2 V8 — Farmers/Schedule F [00:29:24]; farm accounting methods [00:32:07]; estimated tax rules [01:00:48]',
  },
  {
    day: 39, week: 8, part: 2,
    topic: 'Rental Property — Passive Loss, $25K Allowance & Vacation Homes',
    irsPublications: ['Pub 527', 'Pub 925'],
    videoKeywords: ['rental property passive loss $25000 allowance SEE exam', 'real estate professional vacation home mixed use EA'],
    videoUrl: 'https://www.youtube.com/watch?v=2QD66GRtD60&t=59',
    videoNotes: 'P2 V8 — Rental property [00:00:59]; $25K PAL allowance [00:10:25]; real estate professional [00:13:19]; vacation home/mixed-use [00:18:37]',
  },
  {
    day: 40, week: 8, part: 3,
    topic: 'Practice Before the IRS — EA Requirements & Circular 230',
    irsPublications: ['Pub 947', 'Circular 230', 'Form W-12 Instructions'],
    videoKeywords: ['enrolled agent EA practice before IRS SEE exam', 'Circular 230 PTIN due diligence CE requirements Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=qawJ6Dn3x-8&t=301',
    videoNotes: 'P3 V1 — Practice before IRS [00:05:01]; who may practice [00:05:58]; PTIN [00:17:20]; CE requirements [00:24:08]; due diligence [00:36:54]',
  },

  // ── WEEK 9: Level 9 — Representation Deep Dive ────────────────────────────
  {
    day: 41, week: 9, part: 3,
    topic: 'Circular 230 — Sanctionable Acts & Preparer Penalties',
    irsPublications: ['Circular 230', 'Pub 17'],
    videoKeywords: ['Circular 230 sanctionable acts preparer penalties SEE exam', 'negligence substantial understatement EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=qawJ6Dn3x-8&t=5756',
    videoNotes: 'P3 V1 — Sanctionable acts [01:35:56]; preparer penalties/negligence [01:12:54]; substantial understatement [01:53:16]',
  },
  {
    day: 42, week: 9, part: 3,
    topic: 'Power of Attorney — Forms 2848, 8821 & CAF',
    irsPublications: ['Pub 947', 'Form 2848 Instructions', 'Form 8821 Instructions'],
    videoKeywords: ['Form 2848 power of attorney CAF SEE exam', 'Form 8821 tax information authorization EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=sQWhke-esIA&t=0',
    videoNotes: 'P3 V2 — Form 2848/POA [00:00:00]; CAF [00:13:23]; Form 8821 [00:24:47]; client privacy/confidentiality [00:26:43]',
  },
  {
    day: 43, week: 9, part: 3,
    topic: 'Building the Case — Transcripts, Conflicts & E-Services',
    irsPublications: ['Pub 1', 'Circular 230'],
    videoKeywords: ['IRS transcript e-services building case SEE exam', 'conflicts competence criminal aspects EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=sQWhke-esIA&t=2459',
    videoNotes: 'P3 V2 — Building the case [00:40:59]; identifying issues; e-services/transcripts [00:44:41]',
  },
  {
    day: 44, week: 9, part: 3,
    topic: 'IRS Collections — IA, OIC, CNC & Financial Standards',
    irsPublications: ['Pub 594', 'Pub 1854'],
    videoKeywords: ['installment agreement OIC CNC SEE exam', 'IRS collection financial standards bankruptcy EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=sQWhke-esIA&t=2925',
    videoNotes: 'P3 V2 — Financial situation [00:48:45]; IA/OIC/CNC [00:49:04]; IRS Collection Financial Standards [00:53:02]; bankruptcy [00:56:05]',
  },
  {
    day: 45, week: 9, part: 3,
    topic: 'Legal Authority — IRC/CFR, Liens, Levies & TFRP',
    irsPublications: ['Pub 1', 'Pub 594'],
    videoKeywords: ['IRC CFR revenue rulings legal authority SEE exam', 'liens levies TFRP passport revocation EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=sQWhke-esIA&t=3634',
    videoNotes: 'P3 V2 — Legal authority/IRC/CFR [01:00:34]; regulations [01:02:12]; FOIA [01:53:20]',
  },

  // ── WEEK 10: Level 10 — Collections, Audits, Appeals & Filing ────────────
  {
    day: 46, week: 10, part: 3,
    topic: 'Collections Process — Extensions, OIC & CSED',
    irsPublications: ['Pub 594', 'Pub 1546'],
    videoKeywords: ['IRS collections installment agreement CSED SEE exam', 'OIC offer in compromise TAS passport EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=ZQwIyqMqONA&t=66',
    videoNotes: 'P3 V3 — Collections/IAs [00:01:06]; extensions to pay [00:09:20]; OIC [00:12:28]; passport actions [00:29:46]; CNC [00:36:57]; CSED [00:39:24]',
  },
  {
    day: 47, week: 10, part: 3,
    topic: 'Penalty & Interest Abatement — First-Time & Reasonable Cause',
    irsPublications: ['Pub 17', 'IRM 20.1'],
    videoKeywords: ['penalty abatement first-time abatement SEE exam', 'reasonable cause interest abatement EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=ZQwIyqMqONA&t=2556',
    videoNotes: 'P3 V3 — Penalty/interest abatement [00:42:36]; first-time abatement [00:44:42]; reasonable cause [00:48:15]; interest abatement [00:54:00]',
  },
  {
    day: 48, week: 10, part: 3,
    topic: 'Audits & Examinations — Statute of Limitations & 30-Day Letter',
    irsPublications: ['Pub 556', 'Pub 1'],
    videoKeywords: ['IRS audit examination statute of limitations SEE exam', 'CP-2000 RAR 30-day letter 90-day letter EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=ZQwIyqMqONA&t=3489',
    videoNotes: 'P3 V3 — Audits/examinations [00:58:09]; 30-day letter [01:08:34]; 90-day letter/notice of deficiency [01:08:50]',
  },
  {
    day: 49, week: 10, part: 3,
    topic: 'IRS Appeals — EA Representation & Tax Court Options',
    irsPublications: ['Pub 5', 'Pub 556'],
    videoKeywords: ['IRS appeals request for consideration SEE exam', 'EA appearance Tax Court settlement function EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=ZQwIyqMqONA&t=4426',
    videoNotes: 'P3 V3 — IRS appeals [01:13:46]; request for consideration [01:16:02]; settlement/Tax Court [01:14:04]',
  },
  {
    day: 50, week: 10, part: 3,
    topic: 'Return Filing — E-Filing (EFIN/ERO), Records & Data Security',
    irsPublications: ['Pub 4557', 'Pub 3112'],
    videoKeywords: ['e-filing EFIN ERO data security SEE exam', 'return accuracy record retention EA Part 3'],
    videoUrl: 'https://www.youtube.com/watch?v=IuEZ7PQcsJM&t=68',
    videoNotes: 'P3 V4 — Return accuracy [00:01:08]; record retention [00:08:15]; EFIN/e-filing [00:17:49]; ERO [00:21:09]',
  },
];

export function getTopicByDay(day: number): LessonTopic | undefined {
  return LESSON_PLAN.find(t => t.day === day);
}

export function getTopicsByPart(part: 1 | 2 | 3): LessonTopic[] {
  return LESSON_PLAN.filter(t => t.part === part);
}

export const PART_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Part 1 — Individuals',
  2: 'Part 2 — Businesses',
  3: 'Part 3 — Representation',
};
