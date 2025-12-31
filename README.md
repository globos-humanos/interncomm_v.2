🏥 Medical Intern Support App (MISApp)
A lightweight, role-aware communication and task management system designed specifically for hospital ward workflows.
Built to reduce miscommunication, missed tasks, and cognitive overload for interns and postgraduates — without disrupting how wards already function.

🚩 The Problem
Hospital wards are chaotic by design:


Multiple patients with similar names


Rapid task handovers


Overworked PGs supervising multiple interns


Critical information scattered across WhatsApp, notes, and memory


Most existing tools are either:


Too complex (full HIS systems)


Too informal (messaging apps)


Or not built for medical hierarchy


This app fills that gap.

🎯 What This App Does
At its core, the app provides three tightly integrated workflows:
1. Patient-Centric Chat


Each patient has a dedicated chat thread


All unit members can communicate in one place


Messages show sender name and role


Reduces ambiguity during rounds and handovers



2. Worklist & Task Management


Tasks are assigned per patient


Tasks have priorities: 🟢 Routine, 🟡 Urgent, 🔴 Stat


Interns can mark tasks as completed


Completion time and user are recorded


Tasks are automatically ordered by priority



3. Soft Approval & Oversight


Interns can add patients, bed numbers, and working diagnoses


PGs approve or confirm changes when convenient


No hard blocks that disrupt workflow


Clear visual indicators for pending approvals



👥 Roles & Permissions
The system is role-aware, not role-restrictive.
Intern


Add patients


Send messages


Complete assigned tasks


Propose bed number & diagnosis updates


PG / SR


Approve patients and metadata


Add and prioritise tasks


Discharge patients


Maintain unit-level oversight


Permissions are enforced quietly using database-level rules (RLS).

🔁 Patient Lifecycle


Intern adds patient


Patient is visible immediately to the unit


PG approval happens asynchronously


Tasks and chats continue regardless


PG discharges patient when care is complete


Patient is archived (removed from active views)


This mirrors real ward behavior.

🧠 Design Philosophy


Low friction > strict enforcement


Soft confirmations > hard blocks


Visibility > control


Real workflow > ideal workflow


If a feature slowed doctors down, it was removed.

🛠️ Tech Stack


Frontend: React


Backend: Supabase (PostgreSQL + Auth + RLS)


Realtime: Supabase subscriptions


Auth: Email/password (Supabase Auth)


No unnecessary dependencies. No vendor lock-in logic.

🔐 Security & Data Safety


Role-based access using Row Level Security


Unit-level data isolation


Ownership-based updates


No cross-unit visibility


No sensitive automation without approval trails


Designed for trust, not paranoia.

📦 Current Status
Version 1 complete
Implemented:


Patient chat


Worklist with priority tasks


Soft approval system


Bed number & diagnosis metadata


Discharge & archival


Deferred intentionally:


Access revocation UI


Notifications


Analytics


Offline-first support



🚀 Roadmap (Version 2)


Access revocation & reassignment


Archived patient search


Sorting by bed number & admission date


Lightweight notifications


Audit logs


Only after real-world usage feedback.

📌 Who This Is For


Medical interns


Postgraduate residents


Small to mid-sized hospital units


Teaching hospitals


Clinical teams tired of ad-hoc tools


📄 License
This project is currently private / internal-use only.
Licensing and distribution decisions are pending real-world validation.

📝 Final Note
This app was built from inside the system, not from the outside.
It exists because real problems were felt first —
and solved carefully, one decision at a time.
