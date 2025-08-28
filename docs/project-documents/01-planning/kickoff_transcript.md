# Transcript — Project Kickoff
**Date:** August 7, 2025
**Time:** 2:00 PM
**Transcription started by:** Lansard, Martin

## Attendees (speakers referenced)
- Lansard, Martin
- Vincent
- Matthieu Mazzega
- aaron
- Enrique, Pablo (referred to as Pablo)
- Huff, Ray (referred to as Ray)
- Greg (mentioned)
- Mahdi (mentioned)
- Arpita (mentioned)
- Andres (mentioned as PO)

---

## Summary / Context
This meeting covered project kickoff topics for the "on-demand market intelligence platform" MVP. Discussion included: contracts and legal review, team introductions, prototype feedback, the dataset (spreadsheet) structure and contents, MVP scope and timeline (end of August target), approaches for data ingestion and platform architecture, and follow-up logistics (next meetings, sharing of the spreadsheet, invoicing/DocuSign).

---

## Full Transcript (structured by timestamp)

0:03 — Lansard, Martin: How are you?
0:06 — Vincent: Wait, where are you? Uh, where's my tab? I'm lost to my tab.
0:07 — Lansard, Martin: Yep. Yep. Cool. All right.
0:09 — Vincent: Yeah, I'm good. How are you?
0:12 — Lansard, Martin: Doing well, doing well. Very happy that we can finally put this project on proper tracks. So let's wait for everyone to join. Maybe before other people join on the legal contract front. Thanks for sending all the documents so.
0:20 — Vincent: Yep.
0:30 — Lansard, Martin: Our colleague Greg has reviewed and put like a number of annotations. I've read through them, replied to some of the questions. Mahdi, our manager, wants to review also the document. He was out of the office, but today he's supposed to do that. So just to let you know then the process, I think based on his feedback, Greg will take a final look and send that back to you so you can agree or do the final correction and then we can sign it. But it's good that we can meet today.
1:02 — Vincent: OK.
1:05 — Lansard, Martin: Because as you know, next week I'm not going to be there. So the idea would be really get this ball rolling so we're not missing any deadline. And on our sides of Pablo and Ray, my colleagues have just joined. Pablo oversees all data, so data collection, transformation and so on for Waters. Yeah, he was at the meeting before, so good that you remember. And specifically we've been working closely, the three of us together. Ray is more working on the editorial content.
1:25 — Vincent: We met.
1:40 — Lansard, Martin: As you know, everything is data-centric in what we do and we've all been working together to prepare subsets of data that we think are interesting to build in the MVP.
1:58 — Vincent: Yep.
1:59 — Matthieu Mazzega: Hello everyone.
2:01 — Vincent: Hey, Matt.
2:03 — Lansard, Martin: Hi Matt, nice to meet you.
2:06 — Matthieu Mazzega: Nice to meet you. I am my accent. Yeah, I think so. I'm based in Grenoble in the South of Grenoble.
2:08 — Lansard, Martin: You're French. OK, cool. Yeah, I'm French as well, so I think we can recognize each other. Where are you based?
2:23 — Matthieu Mazzega: Yeah, but uh, right now I mean on the other side, I mean uh.
2:23 — Lansard, Martin: Yes, OK, great. All right. I'm going there in a couple of days, vacation in Todo next week. So yeah, that's good. Hi, Aaron.
2:30 — Matthieu Mazzega: OK. OK. Oh, great. Great.
2:35 — aaron: Hi, I'm Aaron. Yeah, nice to meet you guys. Sorry I'm a little bit late. It's always, uh, hopping on to Teams.
2:40 — Lansard, Martin: Very good. Yeah. Well, thanks. Using our Teams allows me to do meeting transcription and then automatic AI notes, which I like. So I will share that with you guys afterwards.
2:45 — aaron: Yeah.
2:55 — Matthieu Mazzega: Mm.
2:59 — Lansard, Martin: Are we waiting for anyone else? Are we good?
3:02 — Vincent: I have on the desk the PO, but he's traveling so I'm not sure he's able to make it. So we can just start. Is it on your end? Are we waiting for someone?
3:04 — Matthieu Mazzega: OK. Yeah.
3:14 — Lansard, Martin: Our colleague Arpita recently joined the data team with Pablo. She has another meeting. I invited her more for her to get up to speed, so she might join through the conversation and we'll catch up with her afterwards. But I think we can get started. So hi everyone. As I was telling Vincent, thanks so much for being available on short notice. I'm not sure to what extent you guys have discussed the project on your side.
3:34 — Matthieu Mazzega: Yeah.
3:45 — Lansard, Martin: Maybe who did the prototype?
3:45 — Vincent: Got it.
3:46 — Matthieu Mazzega: We did it, yeah. I did it, I did it and I just a data run on it. That would be certainly the lead dev on the MVP, but yeah, I did that.
3:55 — Lansard, Martin: OK. It's very nice. I really like it and I think it's a very, very good foundation actually for the MVP, so we can get started on that. What I wanted to use this meeting for is really give you a quick overview of the project, the overall project.
4:04 — Matthieu Mazzega: Nice. Nice.
4:18 — Lansard, Martin: And then since you guys I think are kind of up to speed, we can deep dive a little bit more on the MVP that we are actually starting today, deadlines, requirements, data that we have prepared. So you can see what you guys can work with. I think that on your side you might already have questions or maybe you have a process that you know you want to ask us so we can then discuss. I think we should have plenty of time, but if needed, I'm available also later today, tomorrow, next week I'm out, but the priority is really to keep this project going.
4:40 — Matthieu Mazzega: Mm-hmm.
4:55 — Lansard, Martin: I'm still available. I'll be in the order in Matt, so if we need to touch base. No, I'm just joking. Hopefully not. But yeah, the idea would be more. It's a short project. It's the first phase. So we can maybe already get a sense on, you know, milestones, touch points and so on.
5:15 — Matthieu Mazzega: Yep.
5:19 — Vincent: Yeah, I think what's good to know is that ideally we wanted to run the MVP a bit with a smaller team, but Matt will be out next week, so he won't be able to create the MVP based off the demo. So that's why he did hand over to Aaron, who will in any case.
5:29 — Matthieu Mazzega: Yep.
5:37 — Vincent: I mean he was, he is the designated lead dev for the project if that moves into reality. And then there's Andres who is our US based PO and he will basically manage the project on the product side and work with you guys together to spec out the other projects. So we really see this as OK, the first MVP. We wanted to kind of get that done relatively quickly, but now that Matt's gonna be out, we do a handover, so we bring a little bit more firepower to the team in order to get that across the finish line pretty quickly because the week after next week I will be out. So when you're back, Martin, I will be out. So it's a little messy with the annual leave going on, but we'll try and make that.
6:19 — Lansard, Martin: Yeah. Yeah, that's August. So I mean, I can make myself available if we need to touch base like next week, Friday or whatever. Like let's prioritize this before you leave, Vince. Like really.
6:38 — Vincent: Yeah, so yeah, but just so you know that you're aware and who everyone is in the team. So just one other thing that I would asked on the call and maybe you have a few minutes to just explain that or in regards to the criteria for selecting the vendor. Is there anything we should know in regards to what to look for, what that looks like?
6:59 — Lansard, Martin: Yeah. Yeah. So maybe let me share quickly like the overall our internal project timeline, the one that I shared with you, Vince, my e-mail, because I think, you know, you understand that we like to be super transparent here. So we validated our product internally with...
7:19 — Lansard, Martin: We're going to build this on-demand market intelligence platform. The approach we've chosen is to start by a very tiny MVP. We see that it's essentially like the core of the platform. Think the prototype you build, but a bit fresh out, but with nothing that is more complex to implement, like no need to connect user accounts and emails and all this stuff, right? That would be what you see here as we want. So we want by the end of August to have those MVPs. We've preselected 2 agencies, so Tinkso and Spaulding Ridge.
7:56 — Lansard, Martin: We tried to have two quite different approaches here. Spaulding Ridge approach is much more—it's based on Snowflake—super scalable, robust data foundation. The other approach I could qualify as more pragmatic, probably more nimble, more similar to our small Waters associate teams operate. The goal and the criteria are product first (UX/UI, ease of use) and also how the collaboration will work—partner flexibility, proactiveness, understanding of our needs.
9:02 — Lansard, Martin: After the MVP we'll move to V1 (an externally releasable product for a soft launch at our main event in Vegas, early October). Then V1.1 to fix bugs, then V2 which could include larger features like the full digital Waters report, an AI chatbot for the 500-page guide, etc. The end goal is to have a decent product for a bigger release and start charging an annual membership fee by the mid-February release next year.
12:19 — Matthieu Mazzega: Yeah. OK.
12:37 — Lansard, Martin: I'll be crystalized down the road. You guys already built a prototype. It was very nice. I remember providing a subset of data; we've expanded it. We have an Excel spreadsheet that I can show you to give a sense of the data we shared for the prototype. We expanded it from US only to global reach. We added other tabs; let's go through them to make sure data is clear.
13:39 — Matthieu Mazzega: Maybe a quick scan, Martin. That would be nice. A quick explanation.
13:43 — Lansard, Martin: OK. I would say we have two big data types: company data (directory — one row = one company, many fields) and survey data (market-size breakdowns and forecasts). Company data includes print services (companies providing 3D printing as a service) and AM systems manufacturers (industrial 3D printer manufacturers). We have fields like process, material format, material type, country, etc. The prototype's tab visualization was great: table, map, statistics.
15:17 — Matthieu Mazzega: Yeah.
15:28 — Lansard, Martin: For the MVP this dataset may be enough. Pablo completed this data (subset included about 200–300 entries; full list ~800–900). The schema (columns) is stable so adding records later shouldn't break stuff. For V1, providing very clean data across all tabs might be helpful but we can decide what's needed.
16:37 — Matthieu Mazzega: One quick question to you and Pablo: when you say subset of data, we just talk about number of records, right? Regarding columns, did you reduce some fields in this subset?
16:40 — Lansard, Martin: No.
16:52 — Enrique, Pablo: No, column is the same here. I put in around 200 or 300 entries. I think the full list is around 800–900.
17:03 — Lansard, Martin: That's the company data for the MVP. Then we have survey data (forecast, revenue by industry, material, region). On the right of the spreadsheet we put guidance or visualization ideas: e.g., users could filter by region and by material. We want to consolidate total Additive Manufacturing market size and break down by segment (print services, printer sales, health, materials, software). The idea: stacked bars with filters by company segment.
19:51 — Lansard, Martin: Another tab is 2024 overall market revenue by country and segments; could be a pie chart with filters. There is other data collected by Pablo that I see more as a tool rather than a static graph: a benchmark of print services providers (quotes across many providers, countries, materials) — useful to estimate cost and lead time comparisons. For example, China seems cheaper and faster than US providers for the same part in many cases.
22:49 — Lansard, Martin: Quantity: sometimes we asked quotes for 1 unit and at 1000 units — cost per part differs. There are 3,000+ rows for quotes. That's significant data for the MVP.
23:48 — Lansard, Martin: My view: MVP could be the prototype plus this data. Aim: have something by end of August that behaves like a paid premium user experience. After that, review and iterate.
24:21 — Lansard, Martin: Additional ideas: showcase VC investments, startups, funding and M&A (investments tab). These are similar table structures (acquiring company, acquired company, deal size). These tabs can be filtered, map view, etc.
25:31 — Enrique, Pablo: The M&A tab was changed to "investment."
26:12 — Matthieu Mazzega: Makes sense. Question: are tabs meant to be sections of the paper guide, or separate custom reports?
27:00 — Lansard, Martin: The Global Waters report has many sections; these tabs pull from various sections. When we release next edition, we'd like the content (text, links, static reports) to live on the platform (HTML). This interactive subset is a starting point. Another high-level goal: move from Excel files to a central consolidated cloud database for both platform front-end access and internal access (consulting teams, etc.).
29:39 — Lansard, Martin: Pablo, can you elaborate on database choices? (Pablo recommended Supabase in the stack discussion but they're evaluating options.)
30:03 — Enrique, Pablo: We definitely do want to move away from Excel to a cloud system but hesitate to do that before the platforms are developed. We're open to the suggested options and would prefer doing the transfer once rather than moving multiple times.
30:47 — aaron: That makes sense. I have a question: what's the most common use case? What's the workflow? What do users do more often than not?
31:18 — Huff, Ray: Use cases: people want interactive charts they can filter (region, alloy, technology) to extract a graph and put into a PowerPoint for grants, investor decks, business cases, or to justify R&D. Another big use case is marketing lists: e.g., a filament vendor can filter companies by country and system compatibility to find qualified customers — very valuable.
33:12 — Lansard, Martin: The target users are decision-makers in the Additive Manufacturing industry who need up-to-date, conveniently accessible, reliable information. Internally we also want better processes but that's not part of the MVP; it's part of V1+. We also want to think about community features, expert content, and different access levels later.
35:29 — Huff, Ray: Directories and the ability for companies to claim or edit listings might be a future feature. Currently maintaining the directory is a mix of self-serve listings and manual work plus automated scraping. Pablo's team collects data constantly.
36:17 — aaron: Follow-up: how often do you need to clean it up?
37:27 — Lansard, Martin: It depends on the data; frequency varies. For the MVP we will dogfood internally but it should reflect real-life customer journeys. Some things like user settings and accounts can wait for V1.
38:41 — aaron: For the MVP, will we port real data into the prototype so you can navigate it? And how will users configure/tweak data views — via a report builder, templates, or static pre-built reports?
39:56 — aaron: Ideally we port the real data into the prototype so you guys can navigate it. Will users be able to tweak a report after creating a data view? What does that configuration process look like?
44:04 — Lansard, Martin: Account settings, team access, gating behind paywalls — these are V1 considerations. The initial approach: dogfood internally and keep the same interfaces for internal and external in the short term. A report builder or templates is a future goal. For MVP, focus on core user flows and product features to get adoption quickly.
46:15 — Matthieu Mazzega: We should think early about a consistent structure/language for reports so future report builder/templates are easier to implement.
47:02 — Lansard, Martin: The long-term plan is a platform that can expand beyond Additive Manufacturing into other verticals. Short-term: prove with Additive. We can also build tools (ROI estimators, sentiment dashboards, AI assistant for the report text) later.
50:52 — Vincent: Logistics and timelines — the spreadsheet is the scope for MVP data. Target start next week; end of August to have MVP ready (soft launch week of October 6th). The platform should be externally ready the week before the soft launch (hosting on subdomain, linking with WordPress, etc.). For initial launches we can use a manual upgrade flow (e.g., "upgrade" sends an email) instead of full payment integration.
51:36 — Lansard, Martin: Tight timeline — roughly 4 weeks to build the MVP into something externally ready after vendor selection.
53:12 — Matthieu Mazzega: First step is sharing the data so devs can understand how to link tables/company references and create an index of companies to join records across tabs.
54:00 — Lansard, Martin: We can do some normalization (country names, company naming) before sharing; but it's OK to drop it as-is and let you handle normalization if needed. We'll share the file after an internal meeting.
56:29 — Vincent: Also admin/invoicing details to sort out separately. DocuSign should arrive soon so you can invoice.
57:11 — Vincent: Normally we'd create a scope document but given time constraints we may skip or keep it lightweight and iterate quickly. Feedback on the prototype is welcome.
58:18 — Lansard, Martin: We'll try to get updates before vacations; schedule follow-ups in mid-August when attendees are available. He requested a version of the MVP to demo internally once available.
1:00:31 — Ray / Matthieu / Vincent: General agreement and encouragement; provide list of acronyms if needed.
1:00:55 — aaron: OK.
1:00:59 — Lansard, Martin: I'll share the spreadsheet and AI notes/raw transcript and keep you posted on contracts. Thanks for kicking things off. Have a great vacation if we don't speak before then.
1:01:33 — Vincent: Can you share the transcript? The full transcript is useful for scoping and action items — AI notes may skip things.
1:01:38 — Lansard, Martin: I'll share the raw transcript and AI notes.
1:02:09 — aaron: Thanks, nice meeting you.
1:02:12 — Matthieu Mazzega: Bye everyone.
(Transcription stopped by Lansard, Martin)

---

## Action Items (explicit / implied)
- Lansard / team: Finalize contract (DocuSign) and share the finalized spreadsheet (MVP data subset) after internal review.
- Vendor / Dev team: Start ingesting the shared spreadsheet, evaluate schema, and plan data normalization and join strategy (company index).
- Dev team: Produce an early build of the prototype populated with real dataset to demo internally before end of August.
- Product / Dev: Agree on MVP scope for end-of-August target (exclude full auth/payments; use manual upgrade flow initially).
- Team: Schedule a follow-up sync (mid-August) to review early build and gather feedback.
- Ray: Provide acronyms list to aid onboarding and data understanding (if requested).

---

## Notes / Recommendations (technical & process)
- Prioritize a single canonical identifier for companies (company index) to join records across tabs (companies, print services, manufacturers, investments, quotes).
- Keep the initial MVP simple: prebuilt visualizations and filters, plus a few interactive tools (quote benchmark viewer). Defer user account complexity and payments to V1.
- Normalize country names and key categorical fields (e.g., "United Kingdom" vs "UK", "print service" vs "print services") as a pre-ingestion step or via an ETL normalization layer.
- For data storage, Supabase was discussed as a recommended stack option; evaluate once schema and ingestion process are finalized.
- Provide a clear list of acceptance criteria and priority features for end-of-August MVP to avoid scope creep.

---

## Files referenced in meeting
- Dataset spreadsheet (to be shared by Lansard after internal review) — located in project documents / shared drive (not attached here).

---

End of reformatted transcript.
