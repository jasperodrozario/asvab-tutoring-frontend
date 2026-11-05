import Link from "next/link";
import AsvabResourceLayout from "@/components/asvab/AsvabResourceLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Online ASVAB Prep Classes | ASVAB Tutoring",
  description: "Explore online ASVAB group classes for schools and recruiting stations. Compare live instruction, private tutoring, and self-study options.",
  path: "/asvab-prep-classes",
});

export default function Page() {
  return (
    <AsvabResourceLayout
      faqs={[
        {
          id: "are-the-classes-online",
          question: "Are the classes online?",
          answers: "Yes. Live group instruction is conducted through Microsoft Teams."
        },
        {
          id: "what-equipment-do-i-need",
          question: "What equipment do I need?",
          answers: "A computer or laptop and a stable internet connection are listed requirements for the group service."
        },
        {
          id: "can-i-join-a-group-as-an-individual",
          question: "Can I join a group as an individual?",
          answers: "Contact us to ask about availability. The published ASVAB group package is designed for recruiting stations and schools; individual placement depends on the arrangements available."
        },
        {
          id: "how-long-will-preparation-take",
          question: "How long will preparation take?",
          answers: "That depends on your starting skills, goals, and study time. Ask about the current class schedule and whether it fits your needs before enrolling."
        },
        {
          id: "should-i-choose-a-class-or-a-private-tutor",
          question: "Should I choose a class or a private tutor?",
          answers: "A class may suit you if you want shared instruction and a regular routine. Private tutoring may be more suitable when you need extended help with particular concepts or a different pace."
        }
      ]}
      title="Online ASVAB Prep Classes With a Clear Study Routine"
      intro={<><p>{"ASVAB Tutoring offers live online group instruction for organized groups, including recruiting stations and schools. Combine guided lessons with practice between sessions, or explore private tutoring if you are preparing individually."}</p>
        <p>{"For the wider curriculum and available preparation formats, visit our "}<Link href={"/courses/asvab"}>{"ASVAB course"}</Link>{"."}</p></>}
      action={{ href: "/contact-us", label: "Ask About ASVAB Group Classes" }}
      contents={[{"id": "choose-how-you-want-to-learn", "label": "Choose how you want to learn"}, {"id": "what-group-classes-include", "label": "What group classes include"}, {"id": "organizing-preparation-for-a-group", "label": "Organizing preparation for a group"}, {"id": "make-time-for-practice-between-classes", "label": "Make time for practice between classes"}, {"id": "questions-to-ask-before-enrolling", "label": "Questions to ask before enrolling"}, {"id": "faqs", "label": "Frequently asked questions"}]}
      secondaryAction={{ href: "/package-details/group-tutoring/asvab", label: "View ASVAB Group Package Details" }}
      closing={<>{"Tell us about your group, planned test dates, and subjects that need work. Ask about an ASVAB preparation arrangement that fits your learners."}</>}
    >
        <h2 id="choose-how-you-want-to-learn">{"Choose how you want to learn"}</h2>
        <div className="table-responsive" role="region" aria-label="Preparation options" tabIndex={0}><table><caption className="visually-hidden">{"Preparation options"}</caption><thead><tr><th scope="col">{"Format"}</th><th scope="col">{"Consider it if…"}</th><th scope="col">{"Learn more"}</th></tr></thead><tbody><tr><td>{"Group classes"}</td><td>{"You represent a recruiting station, school, or organized group seeking shared instruction"}</td><td><Link href={"/package-details/group-tutoring/asvab"}>{"ASVAB group package"}</Link></td></tr><tr><td>{"One-on-one tutoring"}</td><td>{"You need individual attention or help with specific gaps"}</td><td><Link href={"/asvab-tutor"}>{"Individual ASVAB tutoring"}</Link></td></tr><tr><td>{"Self-study"}</td><td>{"You prefer to organize your own learning time"}</td><td><Link href={"/services/self-study"}>{"Self-study course"}</Link></td></tr></tbody></table></div>
        <p>{"The right choice depends on your current skills, available study time, and need for feedback. If you are unsure, "}<Link href={"/contact-us"}>{"contact our team about preparation options"}</Link>{" and share your test date and practice results."}</p>
        <h2 id="what-group-classes-include">{"What group classes include"}</h2>
        <p>{"Our "}<Link href={"/services/group-tutoring"}>{"group tutoring service"}</Link>{" uses live online Microsoft Teams sessions. Students complete a Math and English assessment before placement. Sessions last two hours, with learning materials provided through the online platform."}</p>
        <p>{"The service includes homework, practice tests, recorded class lessons, prediction tests, and progress tracking. Our ASVAB group package is designed for recruiting stations and schools. Contact us about your group’s needs and available arrangements. If you are an individual learner, ask whether a suitable group is available, or compare private tutoring and self-study."}</p>
        <h2 id="organizing-preparation-for-a-group">{"Organizing preparation for a group"}</h2>
        <p>{"Tell us your organization, expected number of learners, test dates, and preferred meeting times. Ask how the assessment will guide placement and which subjects the proposed sessions will cover. Confirm the arrangement before committing to a start date. Review "}<Link href={"/how-it-works"}>{"how our assessment and learning plans work"}</Link>{" before discussing your group’s needs."}</p>
        <p>{"Individual learners can review the "}<Link href={"/package-details/1-on-1-tutoring/asvab"}>{"ASVAB private tutoring packages"}</Link>{". For independent preparation, see the "}<Link href={"/package-details/self-study/asvab"}>{"ASVAB self-study package"}</Link>{"."}</p>
        <h2 id="make-time-for-practice-between-classes">{"Make time for practice between classes"}</h2>
        <p>{"Class time gives you a chance to ask questions and work through methods. Independent practice shows whether you can use those methods on your own."}</p>
        <p>{"After a lesson, review your notes, complete the assigned work, and record the questions you cannot explain. Bring those questions to your next session. Use the "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{" to identify subject areas you want to discuss. Include mistakes you corrected only after looking at an answer: they can reveal a step that still needs practice."}</p>
        <h2 id="questions-to-ask-before-enrolling">{"Questions to ask before enrolling"}</h2>
        <ul><li>{"Which subjects does this class cover?"}</li><li>{"How does the schedule fit my official test date?"}</li><li>{"What work should I complete between sessions?"}</li><li>{"What is the current total price, and what does it include?"}</li><li>{"How will my progress be reviewed?"}</li></ul>
    </AsvabResourceLayout>
  );
}
