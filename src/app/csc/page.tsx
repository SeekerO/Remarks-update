"use client"

import { useState } from "react";

type Difficulty = "Easy" | "Average" | "Hard";
type Category =
    | "PHIL CONST"
    | "RA 6713"
    | "HUMAN RIGHTS"
    | "ENVIRONMENT"
    | "VERBAL-EN"
    | "VERBAL-FIL"
    | "NUMERICAL";

interface Question {
    id: number;
    category: Category;
    icon: string;
    difficulty: Difficulty;
    subcategory?: string;
    question: string;
    choices: string[];
    answer: number;
    explanation: string;
}

interface AnsweredQuestion {
    id: number;
    correct: boolean;
}

const questions: Question[] = [
    // ===== PHILIPPINE CONSTITUTION (25) =====
    { id: 1, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The 1987 Philippine Constitution was ratified on what date?", choices: ["January 17, 1973", "February 2, 1987", "February 11, 1987", "March 25, 1986"], answer: 1, explanation: "The 1987 Constitution was ratified through a plebiscite held on February 2, 1987, replacing the 1973 Marcos Constitution." },
    { id: 2, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "How many articles does the 1987 Philippine Constitution contain?", choices: ["16", "18", "20", "22"], answer: 1, explanation: "The 1987 Philippine Constitution is composed of 18 articles covering the full framework of government." },
    { id: 3, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "Under the 1987 Constitution, who has the power to declare martial law?", choices: ["The Congress", "The Supreme Court", "The President", "The Senate President"], answer: 2, explanation: "Under Article VII, Section 18, the President may place the Philippines or any part thereof under martial law for a period not exceeding 60 days." },
    { id: 4, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "The Bill of Rights in the 1987 Constitution is found in which article?", choices: ["Article II", "Article III", "Article IV", "Article V"], answer: 1, explanation: "Article III of the 1987 Philippine Constitution contains the Bill of Rights, enumerating the fundamental rights of Filipino citizens." },
    { id: 5, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "What is the term of office of a Senator in the Philippines?", choices: ["3 years", "4 years", "6 years", "9 years"], answer: 2, explanation: "Under Article VI, Section 4, senators serve a term of six (6) years, with no senator serving more than two consecutive terms." },
    { id: 6, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "Under the 1987 Constitution, how many days does Congress have to revoke a proclamation of martial law?", choices: ["24 hours", "48 hours", "30 days", "60 days"], answer: 0, explanation: "Congress, voting jointly, may revoke the martial law proclamation within 24 hours after proclamation or suspension." },
    { id: 7, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The Philippine national territory is defined in which article of the 1987 Constitution?", choices: ["Article I", "Article II", "Article III", "Article IV"], answer: 0, explanation: "Article I defines the national territory of the Philippines, including its archipelagic waters and airspace." },
    { id: 8, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "The minimum age requirement for a candidate for President of the Philippines is:", choices: ["30 years old", "35 years old", "40 years old", "45 years old"], answer: 2, explanation: "Under Article VII, Section 2, a presidential candidate must be at least 40 years of age on the day of election." },
    { id: 9, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "Under the 1987 Constitution, who exercises the power of eminent domain?", choices: ["The Supreme Court exclusively", "The State, including its political subdivisions", "Only the National Government", "The President alone"], answer: 1, explanation: "Article III, Section 9 provides that private property shall not be taken for public use without just compensation. Eminent domain may be exercised by the State including LGUs." },
    { id: 10, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "Which constitutional body is responsible for auditing government accounts?", choices: ["Commission on Elections", "Civil Service Commission", "Commission on Audit", "Office of the Ombudsman"], answer: 2, explanation: "The Commission on Audit (COA), under Article IX-D, is the constitutional body responsible for auditing all government revenues and expenditures." },
    { id: 11, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The freedom of religion in the Philippines is guaranteed under which article?", choices: ["Article I", "Article II", "Article III", "Article VI"], answer: 2, explanation: "Freedom of religion is guaranteed under Article III (Bill of Rights), Section 5 of the 1987 Constitution." },
    { id: 12, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "How may the Constitution be amended through a People's Initiative?", choices: ["At least 5% of total registered voters in every district", "At least 10% of all registered voters with at least 3% per district", "At least 12% of all registered voters with at least 3% per district", "At least 15% of all registered voters"], answer: 2, explanation: "Article XVII, Section 2 provides that amendments may be proposed through People's Initiative upon a petition of at least 12% of the total registered voters, with each legislative district representing at least 3%." },
    { id: 13, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "The writ of habeas corpus may be suspended by the President in cases of:", choices: ["Natural disaster", "Invasion or rebellion when public safety requires", "Impeachment proceedings", "Economic emergency"], answer: 1, explanation: "Under Article VII, Section 18, the President may suspend the privilege of the writ of habeas corpus only in cases of invasion or rebellion, when the public safety requires it." },
    { id: 14, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The State policy on social justice is enshrined in which article of the 1987 Constitution?", choices: ["Article I", "Article II", "Article III", "Article XIII"], answer: 3, explanation: "Article XIII of the 1987 Constitution deals with Social Justice and Human Rights, mandating the State to give priority to social justice measures." },
    { id: 15, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "Which provision originally abolished the death penalty upon ratification?", choices: ["Article III, Section 10", "Article III, Section 19", "Article XIII, Section 1", "Article VII, Section 15"], answer: 1, explanation: "Article III, Section 19 originally prohibited the imposition of the death penalty unless Congress, for compelling reasons, provides for it." },
    { id: 16, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "A constitutional convention may be called by a vote of:", choices: ["Majority of all members of Congress", "Two-thirds of all members of Congress", "Three-fourths of all members of Congress", "Unanimous vote of Congress"], answer: 1, explanation: "Article XVII, Section 3 provides that Congress may call a constitutional convention by a vote of two-thirds of all its members." },
    { id: 17, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The official languages of the Philippines under the 1987 Constitution are:", choices: ["English only", "Filipino only", "Filipino and English", "Tagalog and English"], answer: 2, explanation: "Under Article XIV, Section 7, the official languages of the Philippines are Filipino and English." },
    { id: 18, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "How many members compose the Commission on Elections (COMELEC)?", choices: ["5 members", "7 members", "9 members", "11 members"], answer: 1, explanation: "Under Article IX-C, COMELEC is composed of a Chairman and six (6) Commissioners, for a total of 7 members." },
    { id: 19, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "What is the citizenship requirement for the President of the Philippines?", choices: ["Natural-born Filipino", "Filipino citizen for 10 years", "Filipino citizen by naturalization", "Filipino citizen since birth or naturalization"], answer: 0, explanation: "Article VII, Section 2 requires the President to be a natural-born citizen of the Philippines." },
    { id: 20, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "Under Article XI, which officer is NOT subject to impeachment?", choices: ["President", "Members of the Supreme Court", "Ombudsman", "Senators"], answer: 3, explanation: "Article XI, Section 2 lists impeachable officers: President, VP, members of Constitutional Commissions, and the Ombudsman. Senators are NOT subject to impeachment." },
    { id: 21, category: "PHIL CONST", icon: "⚖️", difficulty: "Easy", question: "The Philippines' form of government under the 1987 Constitution is:", choices: ["Parliamentary", "Federal", "Democratic Republican", "Constitutional Monarchy"], answer: 2, explanation: "Article II, Section 1 declares the Philippines a democratic and republican State." },
    { id: 22, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "What vote is required by the House of Representatives to bring an impeachment case to the Senate?", choices: ["Simple majority", "One-third of all members", "Two-thirds of all members", "Three-fourths of all members"], answer: 1, explanation: "Article XI, Section 3(3): a vote of at least one-third of all members is needed to bring the case to Senate trial." },
    { id: 23, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "Under the 1987 Constitution, expropriation requires:", choices: ["Payment before taking", "Just compensation", "Approval of Congress", "Consent of the owner"], answer: 1, explanation: "Article III, Section 9 provides that private property shall not be taken for public use without just compensation." },
    { id: 24, category: "PHIL CONST", icon: "⚖️", difficulty: "Average", question: "The term of office of the President of the Philippines is:", choices: ["4 years, eligible for one re-election", "6 years, not eligible for re-election", "6 years, eligible for one re-election", "4 years, no re-election"], answer: 1, explanation: "Under Article VII, Section 4, the President serves a term of six (6) years and is NOT eligible for any re-election." },
    { id: 25, category: "PHIL CONST", icon: "⚖️", difficulty: "Hard", question: "The doctrine of 'separation of powers' primarily prevents:", choices: ["Overlapping functions between LGUs and national government", "Concentration of powers in one branch", "Foreign interference in domestic affairs", "Division of government assets"], answer: 1, explanation: "Separation of powers distributes governmental authority among legislative, executive, and judicial branches to prevent tyranny." },

    // ===== RA 6713 (20) =====
    { id: 26, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "R.A. 6713 is known as the:", choices: ["Anti-Graft and Corrupt Practices Act", "Code of Conduct and Ethical Standards for Public Officials and Employees", "Government Service Insurance Act", "Civil Service Law"], answer: 1, explanation: "R.A. 6713 is the 'Code of Conduct and Ethical Standards for Public Officials and Employees,' enacted on February 20, 1989." },
    { id: 27, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "Under R.A. 6713, the SALN must be filed:", choices: ["Every 3 years", "Annually on or before April 30", "Every 5 years", "Only upon appointment"], answer: 1, explanation: "Section 8 of R.A. 6713 requires public officials and employees to file their SALN annually on or before April 30 of every year." },
    { id: 28, category: "RA 6713", icon: "📜", difficulty: "Average", question: "The norms of conduct under R.A. 6713 include all EXCEPT:", choices: ["Commitment to public interest", "Professionalism", "Nepotism", "Justness and sincerity"], answer: 2, explanation: "Section 4 lists norms of conduct but nepotism is prohibited, not a norm." },
    { id: 29, category: "RA 6713", icon: "📜", difficulty: "Average", question: "Under R.A. 6713, what is the rule on acceptance of gifts?", choices: ["May accept gifts up to P5,000", "Shall not accept gifts of any value in connection with official duties", "May accept gifts from immediate family only", "May accept gifts during the holidays only"], answer: 1, explanation: "Section 7(d) prohibits public officials from soliciting or accepting gifts in connection with their official duties." },
    { id: 30, category: "RA 6713", icon: "📜", difficulty: "Average", question: "The prohibition against private practice after leaving government service lasts:", choices: ["6 months", "1 year", "2 years", "5 years"], answer: 1, explanation: "Section 7(b) prohibits practicing their profession in connection with any office or agency they regulated within one (1) year after separation from office." },
    { id: 31, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "Which constitutes a 'conflict of interest' under R.A. 6713?", choices: ["Accepting overtime work", "Having financial interest in a transaction requiring approval of one's office", "Attending official functions after office hours", "Filing leave of absence"], answer: 1, explanation: "Section 7(a) prohibits public officials from having financial or material interest in any transaction requiring official approval." },
    { id: 32, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "The implementation of R.A. 6713 is primarily overseen by:", choices: ["Commission on Audit", "Office of the Ombudsman", "Civil Service Commission", "Department of Justice"], answer: 2, explanation: "The Civil Service Commission (CSC) is the central personnel agency overseeing the implementation of R.A. 6713." },
    { id: 33, category: "RA 6713", icon: "📜", difficulty: "Average", question: "Under R.A. 6713, 'simple living' means:", choices: ["Living in a rural area", "Leading modest lives appropriate to one's position and income", "Not owning a personal vehicle", "Avoiding social gatherings"], answer: 1, explanation: "Section 4(h) requires public officials to lead modest lives appropriate to their positions, not displaying extravagance." },
    { id: 34, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "Which principle requires public officials to respond to letters within 15 working days?", choices: ["Commitment to public interest", "Professionalism", "Responsiveness to the public", "Justness and sincerity"], answer: 2, explanation: "Section 4(e) — Responsiveness to the Public — requires prompt attention to public requests." },
    { id: 35, category: "RA 6713", icon: "📜", difficulty: "Average", question: "The SALN must disclose:", choices: ["Only cash and bank deposits", "Assets, liabilities, and net worth including spouse and unmarried children", "Only real property holdings", "Only government-issued property"], answer: 1, explanation: "Section 8 requires declaration of assets, liabilities, and net worth of the public official, their spouse, and unmarried children under 18." },
    { id: 36, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "Violation of R.A. 6713 is punishable by:", choices: ["Fine only", "Imprisonment of 1 month to 5 years, or fine not exceeding P5,000, or both", "Dismissal from service only", "Civil liability only"], answer: 1, explanation: "Section 11 provides imprisonment of not less than one (1) month nor more than five (5) years, a fine not exceeding P5,000, or both, plus dismissal." },
    { id: 37, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "Political neutrality under R.A. 6713 means:", choices: ["Not voting in elections", "Providing service regardless of political affiliation", "Avoiding all political discourse", "Joining no political party"], answer: 1, explanation: "Section 4(d) requires public officials to provide service to everyone without discrimination as to party affiliation." },
    { id: 38, category: "RA 6713", icon: "📜", difficulty: "Average", question: "Government resources must NOT be used for:", choices: ["Official travel", "Personal use or for the benefit of a political candidate", "Disaster response operations", "Emergency situations"], answer: 1, explanation: "Section 7(c) prohibits the use of government property, resources, and time for personal use or promoting a political candidate." },
    { id: 39, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "Government records are open to the public EXCEPT for:", choices: ["Audit reports", "Information classified as confidential under existing laws", "Employee performance ratings", "Agency budget allocations"], answer: 1, explanation: "Section 7 allows public access except for information classified as confidential under existing rules, such as national security matters." },
    { id: 40, category: "RA 6713", icon: "📜", difficulty: "Average", question: "Which is a 'prohibited act' under R.A. 6713?", choices: ["Attending official seminars", "Engaging in nepotism in recruitment", "Reporting anomalies to superiors", "Submitting performance evaluations on time"], answer: 1, explanation: "Section 9 of R.A. 6713 prohibits nepotism — appointing relatives within the third degree of consanguinity or affinity." },
    { id: 41, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "Justness and sincerity under R.A. 6713 requires public officials to:", choices: ["Always agree with their superiors", "Not harbor discrimination and act with courtesy in all dealings", "Maintain silence on sensitive matters", "Prioritize personal interests"], answer: 1, explanation: "Section 4(c) requires public officials to be honest and upright, not harbor discrimination, and conduct themselves with courtesy." },
    { id: 42, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "The post-employment restriction on engaging in private business covers:", choices: ["6 months", "1 year", "2 years", "3 years"], answer: 1, explanation: "Section 7(b) generally covers one (1) year for engaging in private practice before offices or agencies they regulated." },
    { id: 43, category: "RA 6713", icon: "📜", difficulty: "Average", question: "'Commitment to Democracy' requires public officials to:", choices: ["Vote in every election", "Uphold the Constitution and democratic institutions", "Join democratic political parties only", "Hold public consultations before any decision"], answer: 1, explanation: "Section 4(g) requires public officials to commit to the democratic way of life and values and uphold the Constitution." },
    { id: 44, category: "RA 6713", icon: "📜", difficulty: "Easy", question: "Which body has authority to investigate violations of R.A. 6713?", choices: ["Department of Justice", "Civil Service Commission and Ombudsman", "National Bureau of Investigation", "Presidential Anti-Graft Commission"], answer: 1, explanation: "Both the Civil Service Commission and the Office of the Ombudsman have jurisdiction over violations of R.A. 6713." },
    { id: 45, category: "RA 6713", icon: "📜", difficulty: "Hard", question: "The prohibition on accepting gifts includes gifts from:", choices: ["Immediate family members", "Any person who may benefit from one's official actions", "Colleagues of the same rank", "Retired government employees"], answer: 1, explanation: "Section 7(d) prohibits accepting anything of monetary value from any person who stands to benefit directly or indirectly from the official's actions." },

    // ===== HUMAN RIGHTS (15) =====
    { id: 46, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Easy", question: "The Universal Declaration of Human Rights was adopted by the UN on:", choices: ["October 24, 1945", "December 10, 1948", "June 26, 1945", "January 1, 1942"], answer: 1, explanation: "The UDHR was adopted by the UN General Assembly on December 10, 1948, now commemorated as Human Rights Day." },
    { id: 47, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Easy", question: "Which Philippine body is mandated to protect and promote human rights?", choices: ["Department of Justice", "Commission on Human Rights", "Office of the Ombudsman", "Supreme Court"], answer: 1, explanation: "The Commission on Human Rights (CHR) is the independent constitutional body mandated under Article XIII, Section 17." },
    { id: 48, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "Which best describes 'civil rights'?", choices: ["Rights of citizens to participate in government", "Rights that protect individuals from arbitrary government action", "Economic and social rights guaranteed by the state", "Rights associated with military service"], answer: 1, explanation: "Civil rights protect individuals from infringement by governments and organizations, ensuring equal treatment under the law." },
    { id: 49, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "The Philippines ratified the International Covenant on Civil and Political Rights (ICCPR) in:", choices: ["1966", "1976", "1986", "1996"], answer: 2, explanation: "The Philippines ratified the ICCPR on October 23, 1986." },
    { id: 50, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "The concept of 'due process' primarily ensures:", choices: ["Swift punishment for criminals", "Fair legal procedures before rights are deprived", "Right to free legal services", "Automatic bail for all offenses"], answer: 1, explanation: "Due process ensures the government cannot deprive a person of life, liberty, or property without fair legal procedures." },
    { id: 51, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Hard", question: "Which of the following is NOT a 'non-derogable right'?", choices: ["Right to life", "Freedom from torture", "Freedom of movement", "Freedom from slavery"], answer: 2, explanation: "Freedom of movement is a derogable right that may be restricted during emergencies, unlike right to life, freedom from torture, and freedom from slavery." },
    { id: 52, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Easy", question: "The 'right to self-determination' refers to:", choices: ["The right to choose one's career", "The right of peoples to freely determine their political status", "The right to choose one's religion", "The right to own property"], answer: 1, explanation: "The right to self-determination is the right of peoples to freely determine their political status and pursue their development." },
    { id: 53, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "R.A. 9851 is known as the:", choices: ["Anti-Terrorism Act", "Philippine Act on Crimes Against International Humanitarian Law, Genocide, and Other Crimes Against Humanity", "Human Security Act", "Witness Protection Act"], answer: 1, explanation: "R.A. 9851, signed in 2009, implements International Humanitarian Law in the Philippines." },
    { id: 54, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "The principle of 'non-refoulement' means:", choices: ["Returning refugees to their home country", "Prohibition against returning refugees to places where they face serious threats", "Accepting all refugees without conditions", "Providing financial aid to refugees"], answer: 1, explanation: "Non-refoulement prohibits states from returning asylum seekers to countries where they face persecution or serious rights violations." },
    { id: 55, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Hard", question: "Which Philippine laws protect women and children from violence and abuse?", choices: ["R.A. 7610 only", "R.A. 9262 only", "Both R.A. 7610 and R.A. 9262", "R.A. 8353"], answer: 2, explanation: "R.A. 7610 protects children from abuse, while R.A. 9262 is the Anti-Violence Against Women and Their Children Act of 2004." },
    { id: 56, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "The Comprehensive Agreement on the Bangsamoro (CAB) signed in 2014 was between the Philippine government and:", choices: ["Abu Sayyaf Group", "Moro Islamic Liberation Front (MILF)", "Communist Party of the Philippines", "Moro National Liberation Front (MNLF)"], answer: 1, explanation: "The CAB was signed in March 2014 between the Government of the Philippines and the MILF." },
    { id: 57, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Easy", question: "'Restorative justice' focuses on:", choices: ["Maximizing punishment for offenders", "Repairing harm and restoring relationships between offenders, victims, and the community", "Deterrence through harsh sentences", "Incarceration as the primary remedy"], answer: 1, explanation: "Restorative justice emphasizes rehabilitation and reconciliation with victims and the community over punishment." },
    { id: 58, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Hard", question: "International Humanitarian Law (IHL) primarily governs:", choices: ["Human rights during peacetime", "The conduct of armed conflict and protection of war victims", "International trade relations", "Environmental law during disasters"], answer: 1, explanation: "IHL (laws of war) regulates the conduct of armed conflict and seeks to limit its effects by protecting war victims." },
    { id: 59, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Average", question: "The Philippine government's peace process with CPP/NPA/NDF is formally known as:", choices: ["Comprehensive Local Integration Program", "GRP-NDFP Peace Negotiations", "Peace and Development Program", "Internal Peace and Security Plan"], answer: 1, explanation: "The formal peace process involves negotiations between the Government of the Republic of the Philippines (GRP) and the National Democratic Front of the Philippines (NDFP)." },
    { id: 60, category: "HUMAN RIGHTS", icon: "🕊️", difficulty: "Hard", question: "The 'right to a clean and healthful environment' falls under which generation of human rights?", choices: ["First generation (civil and political)", "Second generation (economic, social, cultural)", "Third generation (solidarity/collective)", "Fourth generation (digital)"], answer: 2, explanation: "Third generation rights include the right to development, right to peace, and right to a clean environment — collective rights held by groups." },

    // ===== ENVIRONMENT (15) =====
    { id: 61, category: "ENVIRONMENT", icon: "🌿", difficulty: "Easy", question: "The Philippine Clean Air Act is:", choices: ["R.A. 8749", "R.A. 9003", "R.A. 9275", "R.A. 7586"], answer: 0, explanation: "R.A. 8749, the Philippine Clean Air Act of 1999, provides for a comprehensive air pollution control policy." },
    { id: 62, category: "ENVIRONMENT", icon: "🌿", difficulty: "Easy", question: "The law governing solid waste management in the Philippines is:", choices: ["R.A. 8749", "R.A. 9003", "R.A. 9275", "R.A. 6969"], answer: 1, explanation: "R.A. 9003, the Ecological Solid Waste Management Act of 2000, establishes the solid waste management framework." },
    { id: 63, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "DENR stands for:", choices: ["Department of Energy and Natural Resources", "Department of Environment and Natural Resources", "Division of Ecology and Nature Reserves", "Department of Environmental and Nature Regulation"], answer: 1, explanation: "DENR stands for the Department of Environment and Natural Resources." },
    { id: 64, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "The Philippine Clean Water Act of 2004 is:", choices: ["R.A. 8749", "R.A. 9003", "R.A. 9275", "R.A. 9729"], answer: 2, explanation: "R.A. 9275, the Philippine Clean Water Act of 2004, protects water bodies from land-based pollution sources." },
    { id: 65, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "The 'polluter pays principle' means:", choices: ["The government pays for all environmental damage", "Those who cause pollution bear the costs of remediation and damage", "Companies pay a fixed pollution tax", "Only industrial polluters are liable"], answer: 1, explanation: "The polluter pays principle holds that those who produce pollution should bear the costs of managing it to prevent damage." },
    { id: 66, category: "ENVIRONMENT", icon: "🌿", difficulty: "Hard", question: "Which law established the National Integrated Protected Areas System (NIPAS)?", choices: ["R.A. 7160", "R.A. 7586", "R.A. 8550", "R.A. 9003"], answer: 1, explanation: "R.A. 7586, the NIPAS Act of 1992, established the system to maintain and protect essential biodiversity processes." },
    { id: 67, category: "ENVIRONMENT", icon: "🌿", difficulty: "Easy", question: "The Paris Agreement is an international treaty focused on:", choices: ["Biodiversity conservation", "Combating climate change and reducing greenhouse gas emissions", "Managing ocean resources", "Nuclear disarmament"], answer: 1, explanation: "The Paris Agreement, adopted December 2015, aims to limit global warming to well below 2°C above pre-industrial levels." },
    { id: 68, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "The Environmental Impact Assessment (EIA) system was established under:", choices: ["Presidential Decree 1151", "Presidential Decree 1586", "R.A. 8749", "R.A. 9003"], answer: 1, explanation: "Presidential Decree 1586 established the Philippine Environmental Impact Statement System." },
    { id: 69, category: "ENVIRONMENT", icon: "🌿", difficulty: "Hard", question: "Which is classified as a 'greenhouse gas'?", choices: ["Oxygen (O2)", "Nitrogen (N2)", "Carbon Dioxide (CO2)", "Argon (Ar)"], answer: 2, explanation: "CO2 is a primary greenhouse gas responsible for trapping heat in the Earth's atmosphere." },
    { id: 70, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "The Brundtland Report defined 'sustainable development' as:", choices: ["Development that prioritizes economic growth over environment", "Development that meets present needs without compromising future generations", "Development focused on industrial advancement", "Development that excludes indigenous communities"], answer: 1, explanation: "The 1987 Brundtland Commission Report defined sustainable development as meeting present needs without compromising future generations." },
    { id: 71, category: "ENVIRONMENT", icon: "🌿", difficulty: "Hard", question: "The Laguna Lake Development Authority (LLDA) has jurisdiction over:", choices: ["Taal Lake", "Laguna de Bay", "Lanao Lake", "Naujan Lake"], answer: 1, explanation: "LLDA was established under R.A. 4850 to manage and regulate the resources of Laguna de Bay." },
    { id: 72, category: "ENVIRONMENT", icon: "🌿", difficulty: "Easy", question: "Which law regulates toxic and hazardous substances in the Philippines?", choices: ["R.A. 6969", "R.A. 8749", "R.A. 9003", "R.A. 9275"], answer: 0, explanation: "R.A. 6969, the Toxic Substances and Hazardous and Nuclear Wastes Control Act, regulates hazardous chemicals." },
    { id: 73, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "'Biodiversity' refers to:", choices: ["The variety of life forms and ecosystems in a given area", "Only the number of plant species in a region", "The range of climatic conditions in an area", "Only endangered species in an ecosystem"], answer: 0, explanation: "Biodiversity refers to the variety and variability of life on Earth, including genetic, species, and ecosystem diversity." },
    { id: 74, category: "ENVIRONMENT", icon: "🌿", difficulty: "Hard", question: "The primary implementing agency of the Philippine Clean Air Act is:", choices: ["Department of Health", "Department of Environment and Natural Resources", "Department of Science and Technology", "Local Government Units"], answer: 1, explanation: "The DENR through the Environmental Management Bureau (EMB) is the primary implementing agency of R.A. 8749." },
    { id: 75, category: "ENVIRONMENT", icon: "🌿", difficulty: "Average", question: "The '3Rs' in waste management stand for:", choices: ["Repair, Reuse, Recoup", "Reduce, Reuse, Recycle", "Remove, Replace, Rethink", "Refuse, Respond, Recover"], answer: 1, explanation: "The 3Rs — Reduce, Reuse, Recycle — are core principles of R.A. 9003 for minimizing waste generation." },

    // ===== VERBAL ENGLISH (30) =====
    { id: 76, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Word Meaning", question: "What is the meaning of the word 'BENEVOLENT'?", choices: ["Hostile and aggressive", "Well-meaning and kind", "Indifferent and cold", "Stubborn and unyielding"], answer: 1, explanation: "'Benevolent' means well-meaning, kind, and generous in spirit." },
    { id: 77, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Word Meaning", question: "The word 'PERFIDIOUS' most nearly means:", choices: ["Perfect and flawless", "Deceitful and treacherous", "Very proud and arrogant", "Extremely careful"], answer: 1, explanation: "'Perfidious' means deceitful and untrustworthy, characterized by deliberate breach of faith." },
    { id: 78, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Word Meaning", question: "EPHEMERAL most nearly means:", choices: ["Long-lasting and permanent", "Lasting for only a short time", "Related to the atmosphere", "Of great importance"], answer: 1, explanation: "'Ephemeral' means lasting for a very short time, transitory. From Greek 'ephemeros' (lasting only a day)." },
    { id: 79, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Word Meaning", question: "The word 'SYCOPHANT' means:", choices: ["A type of musical instrument", "A person who uses flattery to gain advantage", "An ancient Greek philosopher", "A government official"], answer: 1, explanation: "A sycophant is a person who uses flattery and servile behavior to gain favor from influential people." },
    { id: 80, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Word Meaning", question: "AMBIGUOUS most nearly means:", choices: ["Clear and definitive", "Open to more than one interpretation", "Ambitious and driven", "Shy and reserved"], answer: 1, explanation: "'Ambiguous' means open to more than one interpretation; having a double or unclear meaning." },
    { id: 81, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Word Meaning", question: "The word 'EQUIVOCATE' means:", choices: ["To treat equally", "To use ambiguous language to conceal the truth", "To make equal in value", "To balance two arguments"], answer: 1, explanation: "'Equivocate' means to use ambiguous language to avoid committing to a position or to conceal the truth." },
    { id: 82, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Sentence Completion", question: "The scientist was _____ by the unexpected results that contradicted her hypothesis.", choices: ["delighted", "baffled", "confirmed", "satisfied"], answer: 1, explanation: "The context ('contradicted') implies surprise and confusion. 'Baffled' best fits." },
    { id: 83, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Sentence Completion", question: "Despite his _____ demeanor in public, his colleagues knew he had a warm, compassionate heart.", choices: ["affable", "reserved", "austere", "jovial"], answer: 2, explanation: "'Austere' (stern, severe) contrasts with 'warm, compassionate,' showing the public/private contrast." },
    { id: 84, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Sentence Completion", question: "The government's _____ response to the crisis led many citizens to question its competence.", choices: ["decisive", "robust", "lackadaisical", "exemplary"], answer: 2, explanation: "'Lackadaisical' (lacking enthusiasm) fits the negative context implied by 'question its competence.'" },
    { id: 85, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Sentence Completion", question: "The philosopher argued that morality is not _____ but varies across cultures and time periods.", choices: ["relative", "universal", "subjective", "arbitrary"], answer: 1, explanation: "The sentence argues against universal morality. 'Universal' is what the philosopher denies." },
    { id: 86, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Sentence Completion", question: "The mayor's _____ speech inspired citizens to participate in the cleanup drive.", choices: ["monotonous", "stirring", "confusing", "brief"], answer: 1, explanation: "'Stirring' (causing strong feelings of excitement) best fits an inspiring speech." },
    { id: 87, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Error Recognition", question: "Identify the error: 'Neither the manager (A) nor the employees (B) was (C) present during the inspection (D).'", choices: ["A", "B", "C", "D"], answer: 2, explanation: "With 'neither...nor,' the verb agrees with the nearest subject. 'Employees' is plural, so it should be 'were,' not 'was.'" },
    { id: 88, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Error Recognition", question: "Which sentence contains a grammatical error?", choices: ["She has been working here since 2010.", "Each of the students have submitted their papers.", "The committee has made its decision.", "Neither option is acceptable."], answer: 1, explanation: "'Each' is singular and requires a singular verb: 'Each of the students has submitted his/her papers.'" },
    { id: 89, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Error Recognition", question: "Identify the error: 'The data shows (A) that the number of applicants (B) have increased (C) significantly this year (D).'", choices: ["A", "B", "C", "D"], answer: 2, explanation: "'The number of applicants' is singular (subject is 'number'), so it requires 'has increased,' not 'have increased.'" },
    { id: 90, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Error Recognition", question: "Which sentence is grammatically correct?", choices: ["Whom shall I say is calling?", "Who shall I say is calling?", "Whoever called must identify themselves.", "Whomever finishes first wins."], answer: 1, explanation: "'Who shall I say is calling?' is correct. 'Who' is the subject of 'is calling.'" },
    { id: 91, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Error Recognition", question: "Identify the error: 'He is one of those officials who (A) always follows (B) proper procedures (C) in all transactions (D).'", choices: ["A", "B", "C", "D"], answer: 1, explanation: "The antecedent of 'who' is 'officials' (plural), so the verb should be 'follow,' not 'follows.'" },
    { id: 92, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Sentence Structure", question: "Which is a compound sentence?", choices: ["Although it rained, the event continued.", "The employee worked hard, and she received a promotion.", "The inspector found many violations in the facility.", "Working overtime, she finished the report."], answer: 1, explanation: "A compound sentence contains two independent clauses joined by a coordinating conjunction." },
    { id: 93, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Sentence Structure", question: "Which sentence demonstrates correct parallel structure?", choices: ["She likes singing, to dance, and running.", "She likes singing, dancing, and running.", "She likes to sing, dancing, and to run.", "She likes to sing, dance, and running."], answer: 1, explanation: "Parallel structure requires the same grammatical form. 'Singing, dancing, and running' correctly uses gerunds throughout." },
    { id: 94, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Sentence Structure", question: "Identify the sentence with a dangling modifier:", choices: ["Walking to the office, she noticed the broken pavement.", "While reviewing the documents, errors were found by the auditor.", "Having finished the project, the team celebrated.", "Running late, he called the office to inform them."], answer: 1, explanation: "'While reviewing the documents, errors were found' has a dangling modifier — the subject of 'reviewing' is unclear." },
    { id: 95, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Sentence Structure", question: "Which sentence uses the subjunctive mood correctly?", choices: ["If I was the director, I would change the policy.", "If I were the director, I would change the policy.", "If I am the director, I would change the policy.", "If I will be the director, I would change the policy."], answer: 1, explanation: "The subjunctive mood uses 'were' for hypothetical statements. 'If I were the director' is grammatically correct." },
    { id: 96, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Sentence Structure", question: "Which sentence correctly uses the past perfect tense?", choices: ["By the time the auditor arrived, the files were shredded.", "By the time the auditor arrived, the files had been shredded.", "By the time the auditor arrived, the files have been shredded.", "By the time the auditor arrives, the files had been shredded."], answer: 1, explanation: "Past perfect (had + past participle) expresses an action completed before another past event." },
    { id: 97, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Paragraph Organization", question: "Which would be the BEST topic sentence for a paragraph about workplace productivity?", choices: ["Some employees prefer working from home.", "Effective time management is crucial for maximizing workplace productivity.", "Coffee breaks can improve concentration.", "Office furniture affects employee comfort."], answer: 1, explanation: "A topic sentence introduces the main idea. Option B is the broadest and most central claim." },
    { id: 98, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Paragraph Organization", question: "Arrange logically: 1-These fires release massive CO2. 2-Deforestation causes climate change. 3-Scientists urge stricter forest protection. 4-When forests are cleared, trees are burned.", choices: ["2, 4, 1, 3", "1, 2, 3, 4", "3, 1, 4, 2", "4, 3, 2, 1"], answer: 0, explanation: "Logical sequence: introduce claim (2), explain mechanism (4), show consequence (1), present solution (3)." },
    { id: 99, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Paragraph Organization", question: "Which transition best completes: 'The project was underfunded. _____, the team delivered impressive results.'", choices: ["Therefore", "Nevertheless", "Furthermore", "Consequently"], answer: 1, explanation: "'Nevertheless' (despite that; however) signals contrast between the obstacle and the outcome." },
    { id: 100, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Paragraph Organization", question: "Which sentence does NOT belong in a paragraph about public transportation benefits?", choices: ["Public transit reduces traffic congestion.", "Taking the bus costs less than a private vehicle.", "Electric cars produce fewer emissions than conventional vehicles.", "Mass transit systems lower a city's carbon footprint."], answer: 2, explanation: "Sentence C is about private electric vehicles, not public transportation — it shifts the topic." },
    { id: 101, category: "VERBAL-EN", icon: "📘", difficulty: "Easy", subcategory: "Reading Comprehension", question: "Read: 'The barangay captain implemented a zero-waste policy requiring waste segregation. Non-compliant households face a P500 fine.' What is the PRIMARY purpose?", choices: ["To criticize the barangay captain's policy", "To inform residents about the policy and consequences", "To compare different waste management approaches", "To explain biodegradable waste disposal"], answer: 1, explanation: "The passage is informational, describing the policy and its enforcement mechanism." },
    { id: 102, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Reading Comprehension", question: "Read: 'Bureaucratic red tape is a significant obstacle. Entrepreneurs must navigate a labyrinth of permits before launching.' What does 'labyrinth' suggest?", choices: ["A physical location", "A complex and confusing system of requirements", "An ancient puzzle", "A simple process"], answer: 1, explanation: "'Labyrinth' is used metaphorically to suggest a complex and confusing system." },
    { id: 103, category: "VERBAL-EN", icon: "📘", difficulty: "Average", subcategory: "Reading Comprehension", question: "Read: 'Subsidiarity holds that decisions should be made at the lowest competent level of government.' Which inference is MOST valid?", choices: ["The national government is unnecessary", "Local governments are always more competent", "Decision-making should be devolved to the appropriate level based on scope", "Subsidiarity is an obsolete concept"], answer: 2, explanation: "The passage defines subsidiarity as decentralizing decisions to the lowest competent level." },
    { id: 104, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Reading Comprehension", question: "Read: 'Transparency is not merely a bureaucratic ideal but a democratic necessity. Without information access, citizens cannot hold officials accountable.' What is the main argument?", choices: ["Bureaucracy is ineffective", "Transparency is optional for good governance", "Citizen accountability depends on government transparency", "All government information should be freely available"], answer: 2, explanation: "The passage argues transparency enables citizens to hold officials accountable — its central claim." },
    { id: 105, category: "VERBAL-EN", icon: "📘", difficulty: "Hard", subcategory: "Reading Comprehension", question: "Read: 'The civil service has undergone reforms prioritizing merit over patronage. However, challenges persist in fully eradicating patronage politics.' What does this IMPLY?", choices: ["The civil service is perfect", "Reforms have eliminated patronage completely", "Some progress has been made but patronage remains a challenge", "Political patronage is no longer an issue"], answer: 2, explanation: "The passage acknowledges both progress and ongoing challenges, implying partial success." },

    // ===== VERBAL FILIPINO (25) =====
    { id: 106, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Kahulugan ng Salita", question: "Ano ang kahulugan ng salitang 'MAUNAWAIN'?", choices: ["Mapagmataas at mayabang", "Nagpapakita ng pag-unawa at habag sa iba", "Mahirap maintindihan", "Walang pakiramdam"], answer: 1, explanation: "'Maunawain' ay nagmula sa salitang 'unawa' na nangangahulugang may kakayahang umintindi at may simpatya sa kalagayan ng iba." },
    { id: 107, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Kahulugan ng Salita", question: "Ang salitang 'KATUMPAKAN' ay nangangahulugang:", choices: ["Pagkakamali", "Kawastuhan at pagiging tama", "Kakulangan", "Pagkabigo"], answer: 1, explanation: "'Katumpakan' ay nagmula sa salitang 'tumpak' — ang kahulugan nito ay kawastuhan, tamang pagkilos, o pagiging eksakto." },
    { id: 108, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Kahulugan ng Salita", question: "Ang salitang 'MAPAGPANGGAP' ay pinakamalapit sa kahulugan ng:", choices: ["Tapat at bukas-loob", "Nagkukunwari at hindi tunay ang pagpapakita", "Palaging masaya", "Mahilig mag-isip"], answer: 1, explanation: "'Mapagpanggap' ay nagpapahiwatig ng pagkukunwari — pagpapakita ng maling larawan ng sarili upang linlangin ang iba." },
    { id: 109, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Kahulugan ng Salita", question: "Piliin ang salitang KABALIGTARAN ng 'MAKATARUNGAN':", choices: ["Makatotohanan", "Mapagbigay", "Di-makatarungan", "Mabuti"], answer: 2, explanation: "Ang kabaligtaran ng 'makatarungan' (patas, tama) ay 'di-makatarungan.'" },
    { id: 110, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Kahulugan ng Salita", question: "Ang 'PAGBABAGO' sa konteksto ng lipunan ay nangangahulugang:", choices: ["Pagpapanatili ng lumang gawi", "Transisyon mula sa isang estado patungo sa isa pa", "Pagbabalik sa nakaraan", "Pagtanggi sa modernisasyon"], answer: 1, explanation: "'Pagbabago' sa kontekstong sosyal ay tumutukoy sa proseso ng transisyon o reporma." },
    { id: 111, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Pagpuno ng Pangungusap", question: "Punan ang patlang: 'Ang bawat empleyado ng gobyerno ay may _____ na maglingkod nang buong husay at katapatan.'", choices: ["karapatang", "tungkulin at responsibilidad", "pagkakataon", "kagustuhang"], answer: 1, explanation: "Sa konteksto ng serbisyong publiko, 'tungkulin at responsibilidad' ang pinakaangkop." },
    { id: 112, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Pagpuno ng Pangungusap", question: "Piliin ang tamang salita: 'Ang pamahalaan ay _____ na lutasin ang suliranin ng kahirapan sa ating bansa.'", choices: ["nagnanais", "nagpupunyagi", "nagtatangkilik", "naghihintay"], answer: 1, explanation: "'Nagpupunyagi' (determinado at aktibong nagsisikap) ang pinakaangkop." },
    { id: 113, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Pagpuno ng Pangungusap", question: "Punan: 'Hindi lamang kaalaman kundi pati na rin ang _____ ang kailangan ng isang mahusay na lider.'", choices: ["salapi at kayamanan", "karunungan at pagpapahalaga sa tao", "kapangyarihan at impluwensya", "kagandahan at talino"], answer: 1, explanation: "'Karunungan at pagpapahalaga sa tao' ang pinakamalapit sa mga katangian ng isang mahusay na lider." },
    { id: 114, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Pagpuno ng Pangungusap", question: "Punan ng tamang panlapi: 'Ang mga dokumentong ito ay _____ sa lalong madaling panahon.'", choices: ["ibibigay", "binibigay", "binigay", "nagbigay"], answer: 0, explanation: "'Ibibigay' ay ang tamang anyo na may panghinaharap na aspekto." },
    { id: 115, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Pagpuno ng Pangungusap", question: "Pumili ng angkop na pangatnig: 'Nais niyang mag-aral ng abogasiya _____ hindi sapat ang kanyang badyet.'", choices: ["at", "ngunit", "sapagkat", "kaya"], answer: 1, explanation: "'Ngunit' ay ang tamang pangatnig na nagpapahiwatig ng pagkakasalungat." },
    { id: 116, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Pagkilala ng Mali", question: "Alin ang may gramatikang pagkakamali?\nA) Kumain siya ng mangga.\nB) Pumunta kami sa palengke kahapon.\nC) Nagtrabaho ang mga empleyado ng mahusay.\nD) Siya ay pumunta sa opisina kanina.", choices: ["A", "B", "C", "D"], answer: 2, explanation: "Ang tamang anyo ay 'nang mahusay' hindi 'ng mahusay.' Ang 'nang' ay ginagamit bilang pang-abay." },
    { id: 117, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Pagkilala ng Mali", question: "Tukuyin ang pangungusap na may pagkakamali sa bantas:", choices: ["Oo, darating siya bukas.", "Saan ka pupunta, Juan?", "Anong oras na ba; tapos na ba ang pulong?", "Hindi ko alam kung sasali siya."], answer: 2, explanation: "Ang tuldok-kuwit (;) ay mali rito. Ang tamang anyo: 'Anong oras na ba? Tapos na ba ang pulong?'" },
    { id: 118, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Pagkilala ng Mali", question: "Alin sa sumusunod ang TAMANG pangungusap?", choices: ["Pumunta si Juan sa Maynila kahapon.", "Pumunta ang Juan sa Maynila kahapon.", "Si Juan ay pumunta sa Maynila kahapon.", "Pumunta ng Juan sa Maynila kahapon."], answer: 0, explanation: "'Pumunta si Juan sa Maynila kahapon' — ang 'si' ay ang tamang pantukoy para sa pangngalang pantao." },
    { id: 119, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Estruktura ng Pangungusap", question: "Paano pinakamaikling pagsamahin: 'Napagod siya.' at 'Nagpatuloy pa rin siya sa trabaho.'?", choices: ["Nagpatuloy pa rin siya sa trabaho kahit napagod siya.", "Napagod siya at nagpatuloy sa trabaho.", "Napagod siya ngunit nagpatuloy pa rin siya sa trabaho.", "Nagpatuloy siya sa trabaho kahit napagod."], answer: 2, explanation: "'Napagod siya ngunit nagpatuloy pa rin' ay pinakamaikling nagpapakita ng kontrasto." },
    { id: 120, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Estruktura ng Pangungusap", question: "Alin ang pangungusap na may tamang anyo ng pandiwa?", choices: ["Kumain na siya ng kanin kahapon.", "Kakain siya ng kanin kahapon.", "Kumakain siya ng kanin bukas.", "Kumain siya ng kanin bukas."], answer: 0, explanation: "'Kumain na siya ng kanin kahapon' — ginagamit ang naganap na aspekto (Kumain) kasama ang 'kahapon.'" },
    { id: 121, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Kahulugan ng Salita", question: "Ano ang kahulugan ng salitang 'MAPAGKUMKUM'?", choices: ["Mapagbigay at bukas-palad", "Maramot at hindi nagbibigay ng sapat", "Masipag at masigasig", "Maingat at mainggitin"], answer: 1, explanation: "'Mapagkumkum' ay isang katutubong salitang Tagalog na nangangahulugang maramot." },
    { id: 122, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Kahulugan ng Salita", question: "Ang salitang 'MAIMPLUWENSYA' ay nagmula sa salitang:", choices: ["Ingles na 'influence'", "Kastila na 'influencia'", "Wikang Malay na 'pengaruh'", "Wikang Intsik"], answer: 1, explanation: "'Maimpluwensya' ay nagmula sa Kastilang 'influencia.'" },
    { id: 123, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Pagkilala ng Mali", question: "'Ang bawat mamamayan ay may karapatang makatanggap ng serbisyo galing sa pamahalaan.' Ano ang mali?", choices: ["Walang mali", "'galing' dapat ay 'mula sa'", "'serbisyo' dapat ay 'pangangailangan'", "'karapatang' dapat ay 'obligasyon'"], answer: 1, explanation: "Ang 'galing' ay kolokyal at hindi pormal. Ang wastong gamit sa opisyal na Filipino ay 'mula sa.'" },
    { id: 124, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Pagpuno ng Pangungusap", question: "Punan: 'Si Rizal ay itinuturing na _____ bayani ng Pilipinas.'", choices: ["isang", "pambansang", "pinakamagaling na", "huwarang"], answer: 1, explanation: "'Pambansang bayani' — si Rizal ay opisyal na kinikilala bilang pambansang bayani ng Pilipinas." },
    { id: 125, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Estruktura ng Pangungusap", question: "Alin ang tamang pagkakasunod? (1)laro (2)masaya (3)ang (4)mga bata (5)ng", choices: ["3-4-2-5-1", "2-3-4-5-1", "3-2-4-5-1", "4-3-2-5-1"], answer: 0, explanation: "Ang tamang pagkakasunod: 'Ang mga bata masaya ng laro' — sumusunod sa pangunahing estruktura ng Filipino." },
    { id: 126, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Kahulugan ng Salita", question: "Ang 'PAGPAPAHALAGA' sa konteksto ng edukasyon ay nangangahulugang:", choices: ["Pagbibigay ng mataas na grado", "Pagkilala sa kahalagahan ng kaalaman at tao", "Pagsusulit at pagtataya ng grado", "Pagbibigay ng regalo sa guro"], answer: 1, explanation: "'Pagpapahalaga' sa edukasyon ay tumutukoy sa pagkilala at mataas na pagtingin sa kaalaman, tao, at kalikasan." },
    { id: 127, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Kahulugan ng Salita", question: "Ang SAWIKAIN na 'aanhin pa ang damo kung patay na ang kabayo' ay nangangahulugang:", choices: ["Huwag mag-aksaya ng pagkain ng hayop", "Walang saysay ang isang bagay kung wala na ang taong nangangailangan nito", "Mahalaga ang kabayo kaysa damo", "Mahilig sa kabayo ang mga magsasaka"], answer: 1, explanation: "Ang sawikain ay nagpapahiwatig na walang silbi ang tulong na dumating na huli." },
    { id: 128, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Easy", subcategory: "Pagkilala ng Mali", question: "Alin ang tamang bantas? 'Nagtanong si Maria _____ kung kailan darating si Pedro.'", choices: ["?", ",", ".", "!"], answer: 2, explanation: "Hindi direktang tanong ang pangungusap — pahayag ito tungkol sa pagtatanong ni Maria, kaya ang tuldok (.) ang tamang bantas." },
    { id: 129, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Hard", subcategory: "Estruktura ng Pangungusap", question: "Alin ang wastong gamit ng panlaping 'MAKA-'?", choices: ["Makabayan — nagmamahal sa bayan", "Makabayan — nasa ibayo ng bayan", "Makabayan — may mga bayan", "Makabayan — gawa sa bayan"], answer: 0, explanation: "Ang panlaping 'maka-' ay nangangahulugang 'nagmamahal sa' o 'pabor sa.' Kaya ang 'makabayan' ay patriyotiko." },
    { id: 130, category: "VERBAL-FIL", icon: "🇵🇭", difficulty: "Average", subcategory: "Pagpuno ng Pangungusap", question: "Pumili ng tamang salita: 'Ang aming opisina ay _____ na sa lahat ng uri ng serbisyo.'", choices: ["nakabukas", "bukas", "binuksan", "nagbubukas"], answer: 1, explanation: "'Bukas' bilang pang-uri (adjective) ay angkop rito upang ilarawan ang katayuan ng opisina." },

    // ===== NUMERICAL (20) =====
    { id: 131, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Basic Operations", question: "What is 35% of 240?", choices: ["72", "84", "96", "108"], answer: 1, explanation: "35% of 240 = 0.35 × 240 = 84." },
    { id: 132, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Basic Operations", question: "If 3/4 of a number is 72, what is 5/8 of the same number?", choices: ["54", "60", "66", "78"], answer: 1, explanation: "3/4 of n = 72 → n = 96. Then 5/8 × 96 = 60." },
    { id: 133, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Basic Operations", question: "Simplify: (12 + 8) × 3 ÷ (2² + 1)", choices: ["10", "12", "15", "20"], answer: 1, explanation: "(12+8)=20; 2²+1=5; 20×3=60; 60÷5=12." },
    { id: 134, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Basic Operations", question: "What is: 2⁵ + 3³ - 4² × 2?", choices: ["21", "25", "27", "29"], answer: 2, explanation: "4²=16; 16×2=32; 2⁵=32; 3³=27; 32+27-32=27." },
    { id: 135, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Basic Operations", question: "What is 125 ÷ 0.05?", choices: ["250", "625", "2,500", "25"], answer: 2, explanation: "125 ÷ 0.05 = 125 × 20 = 2,500." },
    { id: 136, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Number Sequence", question: "Next number: 2, 5, 10, 17, 26, ___", choices: ["35", "37", "38", "40"], answer: 1, explanation: "Differences: +3,+5,+7,+9,+11. Next: 26+11=37." },
    { id: 137, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Number Sequence", question: "Complete: 3, 6, 12, 24, ___", choices: ["36", "42", "48", "54"], answer: 2, explanation: "Geometric sequence ×2 each time: 24×2=48." },
    { id: 138, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Number Sequence", question: "Missing number: 1, 1, 2, 3, 5, 8, ___, 21", choices: ["11", "12", "13", "14"], answer: 2, explanation: "Fibonacci sequence: each term is sum of two preceding. 5+8=13." },
    { id: 139, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Number Sequence", question: "Next term: 2, 3, 5, 7, 11, 13, ___", choices: ["14", "15", "17", "19"], answer: 2, explanation: "Sequence of prime numbers: the next prime after 13 is 17." },
    { id: 140, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Number Sequence", question: "Complete: 100, 95, 85, 70, 50, ___", choices: ["20", "25", "30", "35"], answer: 1, explanation: "Differences: -5,-10,-15,-20,-25. So: 50-25=25." },
    { id: 141, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Number Sequence", question: "Missing number: 4, 9, 16, 25, 36, ___", choices: ["42", "45", "49", "54"], answer: 2, explanation: "Perfect squares: 2²,3²,4²,5²,6². Next: 7²=49." },
    { id: 142, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Number Sequence", question: "Next number: 1, 4, 9, 16, 25, ___", choices: ["30", "34", "36", "49"], answer: 2, explanation: "Perfect squares: n². Next is 6²=36." },
    { id: 143, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Word Problems", question: "A civil servant earns P28,500/month and receives a 12% increase. What is her new monthly salary?", choices: ["P31,920", "P32,340", "P31,500", "P30,500"], answer: 0, explanation: "12% of P28,500=P3,420. New salary=P28,500+P3,420=P31,920." },
    { id: 144, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Word Problems", question: "12 workers complete a project in 20 days. How many workers are needed to finish in 15 days?", choices: ["14", "15", "16", "18"], answer: 2, explanation: "Inverse proportion: 12×20=n×15 → n=240÷15=16 workers." },
    { id: 145, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Word Problems", question: "Supplies worth P12,500 with 12% VAT. Total amount paid?", choices: ["P13,900", "P14,000", "P14,500", "P13,500"], answer: 1, explanation: "VAT=12%×P12,500=P1,500. Total=P12,500+P1,500=P14,000." },
    { id: 146, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Word Problems", question: "Train A leaves at 8AM at 80km/h. Train B leaves at 9AM at 100km/h same direction. When does Train B overtake Train A?", choices: ["1:00 PM", "12:00 PM", "2:00 PM", "11:00 AM"], answer: 0, explanation: "Train A has 80km head start. Train B gains 20km/h. Time: 80÷20=4 hours from 9AM=1:00PM." },
    { id: 147, category: "NUMERICAL", icon: "🔢", difficulty: "Easy", subcategory: "Word Problems", question: "An office has 45 employees and 60% are female. How many are male?", choices: ["15", "18", "20", "27"], answer: 1, explanation: "60%×45=27 females. Males=45-27=18." },
    { id: 148, category: "NUMERICAL", icon: "🔢", difficulty: "Average", subcategory: "Word Problems", question: "A laptop's price was reduced by 20% to P24,000. What was the original price?", choices: ["P28,000", "P29,000", "P30,000", "P32,000"], answer: 2, explanation: "80% of original=P24,000. Original=P24,000÷0.80=P30,000." },
    { id: 149, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Word Problems", question: "A candidate received 2,400 votes (48% of total). The runner-up received 35%. How many MORE votes did the candidate get?", choices: ["600", "650", "700", "750"], answer: 1, explanation: "Total=2400÷0.48=5000. Runner-up: 35%×5000=1750. Difference: 2400-1750=650." },
    { id: 150, category: "NUMERICAL", icon: "🔢", difficulty: "Hard", subcategory: "Word Problems", question: "A P500,000 fund is divided in ratio 2:3:5. How much does the largest share get?", choices: ["P200,000", "P225,000", "P250,000", "P275,000"], answer: 2, explanation: "Total parts=10. Largest (5 parts)=(5/10)×P500,000=P250,000." },
];

// --- Style Maps ---
const catBadge: Record<Category, string> = {
    "PHIL CONST": "bg-blue-500/10 text-blue-300 border-blue-500/30",
    "RA 6713": "bg-violet-500/10 text-violet-300 border-violet-500/30",
    "HUMAN RIGHTS": "bg-pink-500/10 text-pink-300 border-pink-500/30",
    "ENVIRONMENT": "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    "VERBAL-EN": "bg-amber-500/10 text-amber-300 border-amber-500/30",
    "VERBAL-FIL": "bg-rose-500/10 text-rose-300 border-rose-500/30",
    "NUMERICAL": "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
};

const diffBadge: Record<Difficulty, string> = {
    Easy: "text-emerald-400",
    Average: "text-amber-400",
    Hard: "text-rose-400",
};

const diffDot: Record<Difficulty, string> = {
    Easy: "bg-emerald-400",
    Average: "bg-amber-400",
    Hard: "bg-rose-400",
};

const ALL_CATS: string[] = ["ALL", "PHIL CONST", "RA 6713", "HUMAN RIGHTS", "ENVIRONMENT", "VERBAL-EN", "VERBAL-FIL", "NUMERICAL"];

export default function CSEQuizApp() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
    const [quizComplete, setQuizComplete] = useState<boolean>(false);
    const [filter, setFilter] = useState<string>("ALL");

    const filtered: Question[] = filter === "ALL" ? questions : questions.filter((q) => q.category === filter);
    const current: Question = filtered[currentIndex];
    const progress: number = ((currentIndex + (showResult ? 1 : 0)) / filtered.length) * 100;
    const pct: number = answered.length > 0 ? Math.round((score / answered.length) * 100) : 0;

    const reset = (): void => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
        setAnswered([]);
        setQuizComplete(false);
    };

    const handleFilter = (cat: string): void => { setFilter(cat); reset(); };

    const handleSelect = (idx: number): void => {
        if (showResult) return;
        setSelectedAnswer(idx);
        setShowResult(true);
        const correct = idx === current.answer;
        if (correct) setScore((s) => s + 1);
        setAnswered((a) => [...a, { id: current.id, correct }]);
    };

    const handleNext = (): void => {
        if (currentIndex < filtered.length - 1) {
            setCurrentIndex((i) => i + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setQuizComplete(true);
        }
    };

    const choiceBg = (idx: number): string => {
        // Shared transition and cursor styles
        const base = "transition-all duration-150 border ";

        if (!showResult) {
            return base + "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 cursor-pointer";
        }

        if (idx === current?.answer) {
            return base + "bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-100 cursor-default";
        }

        if (idx === selectedAnswer) {
            return base + "bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-700 dark:text-rose-100 cursor-default";
        }

        return base + "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-default";
    };

    const choiceLabel = (idx: number): string => {
        const base = "min-w-[1.75rem] h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 font-mono transition-colors";

        if (!showResult) {
            return `${base} bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400`;
        }
        if (idx === current?.answer) {
            return `${base} bg-emerald-500 text-white`;
        }
        if (idx === selectedAnswer) {
            return `${base} bg-rose-500 text-white`;
        }
        return `${base} bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600`;
    };
    const resultMsg = (): string => {
        const r = score / filtered.length;
        if (r >= 0.8) return "🌟 Excellent! You're ready for the CSE!";
        if (r >= 0.6) return "👍 Good effort! Keep reviewing.";
        return "📚 Keep studying! Practice makes perfect.";
    };

    return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center  text-slate-100 bg-gray-50 dark:bg-[#0f0e17]">
            {/* Rainbow top bar */}
            <div className="fixed top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 z-50" />

            <div className="max-w-2xl mx-auto px-4 pt-10 pb-16">

                {/* ── Header ── */}
                <header className="text-center mb-8">
                    <span className="text-[11px] tracking-[0.25em] text-black dark:text-slate-200 uppercase font-mono block mb-2">
                        Philippine Civil Service Exam · Reviewer
                    </span>
                    <h1 className="text-3xl font-black tracking-tight text-black dark:text-slate-200">
                        CSE Quiz{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
                            150 Items
                        </span>
                    </h1>
                    {/* Live stats */}
                    <div className="flex justify-center gap-5 mt-3 text-sm font-mono">
                        <span className="text-black dark:text-slate-200">📋 {filtered.length}</span>
                        <span className="text-black dark:text-slate-200">✅ {score}/{answered.length}</span>
                        <span className={pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-slate-200"}>
                            {pct}%
                        </span>
                    </div>
                </header>

                {/* ── Category Filter ── */}
                <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                    {ALL_CATS.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleFilter(cat)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-mono font-semibold tracking-wide border transition-all ${filter === cat
                                ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-900/50"
                                : "bg-slate-200 dark:bg-slate-800 border-slate-700 text-black dark:text-slate-200 hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* ── Progress Bar ── */}
                <div className="h-1 bg-slate-300 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* ── RESULTS SCREEN ── */}
                {quizComplete ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-3">🏆</div>
                        <h2 className="text-xl font-black text-white mb-1">Quiz Complete!</h2>
                        <p className="text-slate-500 text-xs font-mono mb-6">{filter === "ALL" ? "All Topics" : filter}</p>

                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 mb-2">
                            {score}/{filtered.length}
                        </div>
                        <p className="text-slate-400 text-sm mb-8">{resultMsg()}</p>

                        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-8">
                            {(
                                [
                                    ["Correct", String(score), "text-emerald-400 border-emerald-800/60"],
                                    ["Wrong", String(filtered.length - score), "text-rose-400 border-rose-800/60"],
                                    ["Score", Math.round((score / filtered.length) * 100) + "%", "text-violet-400 border-violet-800/60"],
                                ] as [string, string, string][]
                            ).map(([lbl, val, cls]) => (
                                <div key={lbl} className={`bg-slate-800 rounded-xl p-3 border ${cls.split(" ").slice(1).join(" ")}`}>
                                    <div className={`text-2xl font-black ${cls.split(" ")[0]}`}>{val}</div>
                                    <div className="text-[10px] text-slate-300 mt-0.5 font-mono uppercase tracking-widest">{lbl}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={reset}
                            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
                        >
                            🔄 Restart
                        </button>
                    </div>
                ) : !current ? (
                    <p className="text-center text-slate-500 py-20 font-mono text-sm">No questions for this category.</p>
                ) : (
                    /* ── QUESTION CARD ── */
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Card Top Bar */}
                        <div className="px-5 pt-5 pb-4 border-b border-slate-800/80">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {/* Category badge */}
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold font-mono ${catBadge[current.category]}`}>
                                    {current.icon} {current.category}
                                </span>

                                {/* Difficulty badge */}
                                <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-medium ${diffBadge[current.difficulty]}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${diffDot[current.difficulty]}`} />
                                    {current.difficulty}
                                </span>

                                {current.subcategory && (
                                    <span className="text-[11px] text-slate-300 font-mono">[{current.subcategory}]</span>
                                )}

                                <span className="ml-auto text-[11px] text-slate-200 font-mono tabular-nums">
                                    {currentIndex + 1} / {filtered.length}
                                </span>
                            </div>

                            {/* Question text */}
                            <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                                {current.question}
                            </p>
                        </div>

                        {/* Choices */}
                        <div className="p-5 flex flex-col gap-2">
                            {current.choices.map((choice: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    disabled={showResult}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${choiceBg(idx)}`}
                                >
                                    <span className={choiceLabel(idx)}>
                                        {["A", "B", "C", "D"][idx]}
                                    </span>
                                    <span className="text-[13px] leading-relaxed flex-1">{choice}</span>
                                    {showResult && idx === current.answer && (
                                        <span className="text-emerald-400 text-sm shrink-0 mt-0.5">✓</span>
                                    )}
                                    {showResult && idx === selectedAnswer && idx !== current.answer && (
                                        <span className="text-rose-400 text-sm shrink-0 mt-0.5">✗</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Explanation */}
                        {showResult && (
                            <div className="px-5 pb-5 space-y-3">
                                <div className="bg-slate-200 dark:bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                                    <p className="text-[10px] font-mono text-violet-400 uppercase tracking-[0.15em] mb-1.5">
                                        💡 Explanation
                                    </p>
                                    <p className="text-[13px] text-black dark:text-slate-300 leading-relaxed">{current.explanation}</p>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleNext}
                                        className="px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-950/50"
                                    >
                                        {currentIndex < filtered.length - 1 ? "Next →" : "See Results →"}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                <p className="text-center text-[11px] text-slate-200 mt-8 font-mono">
                    CSE Reviewer · Professional &amp; Subprofessional Level · PH
                </p>
            </div>
        </div>
    );
}