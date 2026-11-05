import Link from "next/link";
import AsvabResourceLayout from "@/components/asvab/AsvabResourceLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "ASVAB Study Guide and Study Plan | ASVAB Tutoring",
  description: "Organize your ASVAB study with a subject roadmap, a flexible four-week plan, and practical ways to learn from missed practice questions.",
  path: "/asvab-study-guide",
});

export default function Page() {
  return (
    <AsvabResourceLayout
      faqs={[
        {
          id: "should-i-study-every-subject-for-the-same-amount-of-time",
          question: "Should I study every subject for the same amount of time?",
          answers: "Use your results and goals to allocate time. Give more attention to weak skills while periodically checking stronger areas."
        },
        {
          id: "should-i-keep-repeating-the-same-practice-test",
          question: "Should I keep repeating the same practice test?",
          answers: "Reviewing mistakes is useful, but remembering answers can hide gaps. Include unfamiliar questions when checking progress."
        },
        {
          id: "when-should-i-ask-for-help",
          question: "When should I ask for help?",
          answers: "Consider tutoring when you repeatedly miss the same concept, cannot follow an explanation, or need help deciding what to study next."
        }
      ]}
      title="ASVAB Study Guide: Decide What to Study Next"
      intro={<><p>{"A useful study plan tells you more than how many questions to answer. It helps you identify a gap, learn the missing skill, and check whether you can use it independently."}</p>
        <p>{"Start with your results from the "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{", then build a routine you can follow consistently."}</p>
        <p>{"Explore the "}<Link href={"/courses/asvab"}>{"ASVAB course"}</Link>{" for our curriculum and preparation options, then use this guide to organize your work."}</p></>}
      action={{ href: "/courses/asvab/free-practice-test", label: "Check Your Starting Point" }}
      contents={[{"id": "step-1-make-a-subject-checklist", "label": "Step 1: Make a subject checklist"}, {"id": "step-2-record-why-you-miss-questions", "label": "Step 2: Record why you miss questions"}, {"id": "step-3-adapt-this-four-week-study-plan", "label": "Step 3: Adapt this four-week study plan"}, {"id": "step-4-give-each-study-session-a-purpose", "label": "Step 4: Give each study session a purpose"}, {"id": "step-5-choose-materials-that-support-your-routine", "label": "Step 5: Choose materials that support your routine"}, {"id": "faqs", "label": "Frequently asked questions"}]}
      closing={<>{"Turn your next practice result into a plan. Choose one weak topic, review it, and check it again with new questions."}</>}
    >
        <h2 id="step-1-make-a-subject-checklist">{"Step 1: Make a subject checklist"}</h2>
        <p>{"Use the following as a preparation roadmap. Topics are examples for review, not an exhaustive official test blueprint."}</p>
        <div className="table-responsive" role="region" aria-label="ASVAB study roadmap" tabIndex={0}><table><caption className="visually-hidden">{"ASVAB study roadmap"}</caption><thead><tr><th scope="col">{"Study area"}</th><th scope="col">{"Example review topics"}</th></tr></thead><tbody><tr><td>{"Arithmetic Reasoning"}</td><td>{"Fractions, percentages, ratios, rates, and translating word problems into calculations"}</td></tr><tr><td>{"Mathematics Knowledge"}</td><td>{"Equations, exponents, factoring, geometry, and number properties"}</td></tr><tr><td>{"Word Knowledge"}</td><td>{"Meanings, synonyms, and vocabulary in context"}</td></tr><tr><td>{"Paragraph Comprehension"}</td><td>{"Main ideas, details, and conclusions supported by a passage"}</td></tr><tr><td>{"General Science"}</td><td>{"Basic biology, chemistry, physics, and earth science"}</td></tr><tr><td>{"Electronics Information"}</td><td>{"Electrical quantities, circuits, and components"}</td></tr><tr><td>{"Auto and Shop Information"}</td><td>{"Vehicle systems, tools, and workshop practices"}</td></tr><tr><td>{"Mechanical Comprehension"}</td><td>{"Forces, motion, simple machines, and fluid principles"}</td></tr><tr><td>{"Assembling Objects"}</td><td>{"Visualizing how separate parts fit together"}</td></tr></tbody></table></div>
        <p>{"This roadmap groups Auto and Shop into one study area. The CAT-ASVAB administers them separately and includes Assembling Objects. The paper-and-pencil version described by the official source combines Auto and Shop and omits Assembling Objects. Confirm which format you will take when planning your preparation."}</p>
        <p>{"Begin with our "}<Link href={"/asvab-math-practice-test"}>{"ASVAB math practice questions"}</Link>{" if your results show gaps in Arithmetic Reasoning or Mathematics Knowledge. Use the course for the other study areas."}</p>
        <h2 id="step-2-record-why-you-miss-questions">{"Step 2: Record why you miss questions"}</h2>
        <p>{"Use a simple error log with four entries: topic, what went wrong, correct method, and next review date."}</p>
        <p>{"For example: “Percent decrease — divided by the new price — divide the change by the original price — review Friday.” This gives you a specific action for your next session."}</p>
        <p>{"Separate knowledge gaps from rushed work. An unfamiliar formula requires instruction; a copied number requires a checking habit."}</p>
        <h2 id="step-3-adapt-this-four-week-study-plan">{"Step 3: Adapt this four-week study plan"}</h2>
        <p>{"This is a suggested routine, not a promise that four weeks will be enough for every learner."}</p>
        <div className="table-responsive" role="region" aria-label="Suggested four-week study plan" tabIndex={0}><table><caption className="visually-hidden">{"Suggested four-week study plan"}</caption><thead><tr><th scope="col">{"Week"}</th><th scope="col">{"Main task"}</th><th scope="col">{"Check before moving on"}</th></tr></thead><tbody><tr><td>{"1"}</td><td>{"Take a baseline test and review foundational weaknesses"}</td><td>{"Can you explain the steps for the skills you reviewed?"}</td></tr><tr><td>{"2"}</td><td>{"Practice weak topics and revisit earlier material"}</td><td>{"Can you solve new versions without notes?"}</td></tr><tr><td>{"3"}</td><td>{"Mix subjects and add practice under time limits"}</td><td>{"Are you choosing methods accurately when topics are mixed?"}</td></tr><tr><td>{"4"}</td><td>{"Review remaining gaps and complete broader practice"}</td><td>{"Which mistakes still recur, and what should you review next?"}</td></tr></tbody></table></div>
        <p>{"After a period of review, you can use our "}<Link href={"/courses/asvab/free-prediction-test"}>{"free ASVAB/AFQT prediction test"}</Link>{" as another practice checkpoint. Treat its result as a preparation estimate, not an official score."}</p>
        <p>{"If foundational skills remain difficult, extend the early stages. If you have less time, prioritize using your current results and confirmed score requirements."}</p>
        <h2 id="step-4-give-each-study-session-a-purpose">{"Step 4: Give each study session a purpose"}</h2>
        <p>{"Try a 45-minute session: spend 10 minutes reviewing an earlier skill, 20 minutes learning and practicing your main topic, and 15 minutes checking answers and updating your error log."}</p>
        <p>{"When reviewing an explanation, cover it and solve the problem again. Later, try a different problem that uses the same principle. This helps reveal whether you can work independently."}</p>
        <h2 id="step-5-choose-materials-that-support-your-routine">{"Step 5: Choose materials that support your routine"}</h2>
        <p>{"ASVAB Tutoring’s self-study service includes lesson videos, homework with explanations, lesson tests, a final practice test, prediction tests, flashcards, and progress reports."}</p>
        <p>{"Explore the "}<Link href={"/services/self-study"}>{"self-study service"}</Link>{", or use the "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{" to identify a starting point."}</p>
        <p>{"For access and subscription details, review the "}<Link href={"/package-details/self-study/asvab"}>{"ASVAB self-study package"}</Link>{". If you need guided feedback, compare our "}<Link href={"/services/1-on-1-tutoring"}>{"one-on-one tutoring service"}</Link>{"."}</p>
        <p>{"Read "}<Link href={"/how-it-works"}>{"how we assess skills and organize preparation"}</Link>{" if you want help adapting a routine. You can also "}<Link href={"/contact-us"}>{"contact our team about your study priorities"}</Link>{"."}</p>
    </AsvabResourceLayout>
  );
}
