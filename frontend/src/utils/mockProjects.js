// Mock projects shaped to match the backend Project model (with ownerId populated).
export const mockProjects = [
  {
    id: "p1",
    title: "Neural Synapse Mapping in VR",
    summary: "Real-time volumetric visualization of synaptic pathways for neuroscience labs.",
    description: `Neural Synapse Mapping in VR is a cutting-edge research initiative that bridges computational neuroscience and immersive technology. Our goal is to build a real-time, interactive VR environment where researchers can explore 3D synaptic networks derived from high-resolution brain scan data — rendering volumetric synaptic pathway data at 60fps, allowing annotation and export of individual pathways, and integrating directly with existing neuroimaging pipelines such as NIfTI and DICOM.

This project is in active collaboration with two neuroscience departments and is targeting a working prototype demo by Q1 2025. A collaborative multi-user mode is also planned, enabling remote lab sessions across institutions. We are looking for motivated contributors who are passionate about the intersection of science and immersive computing.`,
    category: "Research",
    imageUrl: "https://t3.ftcdn.net/jpg/05/68/61/90/360_F_568619020_xheWqDcaOhThRulzJv2ty8AAm81pRRyg.jpg",
    techstack: ["Unity", "VR", "Python"],
    rolesNeeded: ["Researcher"],
    commitment: "side_project",
    status: "recruiting",
    ownerId: {
      _id: "u1",
      name: "Dr. Julian Vance",
      email: "julian.vance@example.com",
      avatar: "https://i.pravatar.cc/100?img=11",
    },
    members: [],
    engagement: { likes: 432, views: 1200 },
    createdAt: "2024-08-01T10:00:00.000Z",
    updatedAt: "2024-09-01T10:00:00.000Z",
  },
  {
    id: "p2",
    title: "Autonomous Lunar Swarmers",
    summary: "Decentralized control algorithms for micro-rovers in extreme regolith conditions.",
    description: `Autonomous Lunar Swarmers tackles one of the hardest open problems in space robotics: coordinating a fleet of micro-rovers on the lunar surface without centralized control or reliable communication.

The project focuses on:
• Swarm intelligence algorithms inspired by ant colony and particle systems
• Onboard edge inference for terrain classification using lightweight ML models
• Fault-tolerant mesh networking between individual units
• Physics-accurate simulation of regolith interaction in ROS/Gazebo

We are building toward a hardware-in-the-loop testbed with 1:10 scale rover prototypes. The team has existing funding from a university aerospace grant and is looking for an ML engineer to lead the onboard perception stack.`,
    category: "Engineering",
    imageUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80",
    techstack: ["ROS", "C++", "ML"],
    rolesNeeded: ["ML Engineer"],
    commitment: "startup",
    status: "in_progress",
    ownerId: {
      _id: "u2",
      name: "Elena Thorne",
      email: "elena.thorne@example.com",
      avatar: "https://i.pravatar.cc/100?img=31",
    },
    members: [],
    engagement: { likes: 156, views: 890 },
    createdAt: "2024-07-20T08:30:00.000Z",
    updatedAt: "2024-08-15T08:30:00.000Z",
  },
  {
    id: "p3",
    title: "Ethical AI Frameworks 2.0",
    summary: "Applying symbolic constraints and policy checks to modern language models.",
    description: `Ethical AI Frameworks 2.0 is a research and engineering project that aims to make large language models provably compliant with a defined set of ethical and operational constraints — without sacrificing capability.

What we are building:
• A symbolic constraint layer that intercepts and evaluates LLM outputs before delivery
• Policy DSL (domain-specific language) for expressing ethical rules in structured form
• Evaluation benchmarks comparing constrained vs. unconstrained model behavior
• Open-source SDK for integration into existing LLM pipelines

The project draws from academic work in formal verification, AI safety, and value alignment. We believe compliance should be engineered, not just prompted. This is an open research initiative with the intent to publish results and release tooling under MIT license.`,
    category: "Computing",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    techstack: ["Node.js", "LLM", "Python"],
    rolesNeeded: ["Backend"],
    commitment: "side_project",
    status: "recruiting",
    ownerId: {
      _id: "u3",
      name: "Markus Chen",
      email: "markus.chen@example.com",
      avatar: "https://i.pravatar.cc/100?img=20",
    },
    members: [],
    engagement: { likes: 1100, views: 2400 },
    createdAt: "2024-06-30T11:30:00.000Z",
    updatedAt: "2024-07-21T11:30:00.000Z",
  },
  {
    id: "p4",
    title: "CRISPR for Coral Restoration",
    summary: "Engineering heat-resistant coral strains to protect reef ecosystems.",
    description: `CRISPR for Coral Restoration is a synthetic biology startup working at the frontier of climate adaptation. Coral reefs cover less than 1% of the ocean floor yet support 25% of all marine life — and bleaching events driven by rising sea temperatures are destroying them at an accelerating rate.

Our approach:
• Identify heat-shock response genes in naturally resilient coral species
• Use CRISPR-Cas9 editing to introduce these traits into threatened strains
• Validate edited strains in controlled thermal stress tanks
• Partner with reef restoration programs for controlled open-water seeding

We are currently in the lab validation phase with preliminary results showing a 15% improvement in thermal tolerance. The team is looking for a bioinformatician to help with genomic data analysis and variant annotation pipelines.`,
    category: "Biology",
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80",
    techstack: ["Bioinformatics"],
    rolesNeeded: ["Biologist"],
    commitment: "startup",
    status: "in_progress",
    ownerId: {
      _id: "u4",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@example.com",
      avatar: "https://i.pravatar.cc/100?img=47",
    },
    members: [],
    engagement: { likes: 920, views: 3100 },
    createdAt: "2024-05-20T09:15:00.000Z",
    updatedAt: "2024-06-10T09:15:00.000Z",
  },
  {
    id: "p5",
    title: "Plasma Propulsion Metrics",
    summary: "Benchmarking thrust efficiency for compact plasma propulsion prototypes.",
    description: `Plasma Propulsion Metrics is a hackathon-origin engineering project that has grown into a structured benchmarking initiative for compact Hall-effect thruster prototypes.

Scope of work:
• Design and operate a low-cost vacuum test chamber for sub-10cm thrusters
• Instrument thrust measurement with load cells and Faraday probes
• Build a repeatable data pipeline from raw sensor output to efficiency metrics
• Compare results against published ESA and NASA thruster datasheets

The project is in active testing with two prototype units. All data and methodology are being documented for open publication. We need a data analyst to build the analysis and visualization pipeline in Python/MATLAB.`,
    category: "Space",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    techstack: ["MATLAB", "CFD"],
    rolesNeeded: ["Data Analyst"],
    commitment: "hackathon",
    status: "recruiting",
    ownerId: {
      _id: "u5",
      name: "David Orion",
      email: "david.orion@example.com",
      avatar: "https://i.pravatar.cc/100?img=14",
    },
    members: [],
    engagement: { likes: 88, views: 760 },
    createdAt: "2024-04-20T13:40:00.000Z",
    updatedAt: "2024-05-11T13:40:00.000Z",
  },
  {
    id: "p6",
    title: "Distributed Ledger Consensus",
    summary: "New protocol variants to reduce proof-of-stake energy overhead.",
    description: `Distributed Ledger Consensus is a systems research project investigating alternative consensus mechanisms that reduce the energy and latency overhead of proof-of-stake networks without compromising safety or decentralization guarantees.

Research focus areas:
• Optimistic finality protocols with fraud-proof rollback
• Leader election using verifiable random functions (VRF) with reduced communication rounds
• Formal modeling of liveness properties under partial network partitions
• Comparative benchmarks against Tendermint, Gasper, and HotStuff

The project is written in Rust (core protocol) and Go (network simulation layer). We are aiming to submit a paper to a distributed systems workshop in Q2 2025 and are looking for a frontend engineer to build a live network visualization dashboard.`,
    category: "Software",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    techstack: ["Rust", "Go"],
    rolesNeeded: ["Frontend"],
    commitment: "side_project",
    status: "recruiting",
    ownerId: {
      _id: "u6",
      name: "Aria Sol",
      email: "aria.sol@example.com",
      avatar: "https://i.pravatar.cc/100?img=24",
    },
    members: [],
    engagement: { likes: 610, views: 1500 },
    createdAt: "2024-03-15T12:20:00.000Z",
    updatedAt: "2024-04-03T12:20:00.000Z",
  },
  {
    id: "p7",
    title: "Graphite-Anode Efficiency",
    summary: "Improving battery cycle life using nanostructured graphite surfaces.",
    description: `Graphite-Anode Efficiency was a materials science research sprint that successfully demonstrated a measurable improvement in lithium-ion battery cycle life through controlled nanostructuring of the graphite anode surface.

What was accomplished:
• Synthesized graphite samples with three distinct surface morphologies via chemical vapor deposition
• Ran 500-cycle charge/discharge tests at 1C and 2C rates
• Measured capacity retention, Coulombic efficiency, and impedance growth per cycle
• Published internal report with 12% improvement in 500-cycle retention vs. baseline

The project is now complete. All experimental data, processing scripts, and the final report are available in the project repository. We are open to collaboration for a follow-up study focused on silicon-graphite composite anodes.`,
    category: "Chemistry",
    imageUrl: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=1200&q=80",
    techstack: ["Materials", "Python"],
    rolesNeeded: ["Researcher"],
    commitment: "hackathon",
    status: "completed",
    ownerId: {
      _id: "u7",
      name: "Dr. Robert Hales",
      email: "robert.hales@example.com",
      avatar: "https://i.pravatar.cc/100?img=8",
    },
    members: [],
    engagement: { likes: 112, views: 540 },
    createdAt: "2024-02-10T10:10:00.000Z",
    updatedAt: "2024-03-01T10:10:00.000Z",
  },
  {
    id: "p8",
    title: "Hydro-Kinetic Coastal Mesh",
    summary: "Capturing tidal energy with low-impact flexible polymer grids.",
    description: `Hydro-Kinetic Coastal Mesh was a side project exploring whether flexible polymer grid arrays could be deployed in shallow coastal zones to harvest tidal kinetic energy with minimal ecological footprint.

Project highlights:
• Designed a modular grid unit in CAD optimized for tidal flow velocities of 0.5–2 m/s
• Ran computational fluid dynamics simulations for three coastal site profiles
• Estimated energy yield per unit area and compared with fixed turbine alternatives
• Produced a feasibility report covering installation, maintenance, and decommissioning

The project has been archived following the feasibility study. Results were shared with a regional environmental agency. The CAD files and simulation configs are open-source for anyone wishing to continue the work.`,
    category: "Environment",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    techstack: ["CAD", "Simulation"],
    rolesNeeded: ["Mechanical"],
    commitment: "side_project",
    status: "archived",
    ownerId: {
      _id: "u8",
      name: "Lila Meadows",
      email: "lila.meadows@example.com",
      avatar: "https://i.pravatar.cc/100?img=49",
    },
    members: [],
    engagement: { likes: 445, views: 2100 },
    createdAt: "2024-01-25T16:00:00.000Z",
    updatedAt: "2024-02-20T16:00:00.000Z",
  },
];

export const projectRoles = ["all", "Researcher", "ML Engineer", "Backend", "Frontend", "Biologist", "Data Analyst", "Mechanical"];
export const projectCommitments = ["all", "hackathon", "side_project", "startup"];
export const projectSortOptions = ["recent", "popular"];

export function getMockProjectById(id) {
  return mockProjects.find((p) => p.id === id) || null;
}
