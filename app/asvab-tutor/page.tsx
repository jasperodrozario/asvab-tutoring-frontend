import Link from "next/link";
import AsvabResourceLayout from "@/components/asvab/AsvabResourceLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Online ASVAB Tutor | Personalized ASVAB Tutoring",
  description: "Get individual help with ASVAB preparation. Explore online tutoring, assessment-based study plans, and guided practice for your weak areas.",
  path: "/asvab-tutor",
});

export default function Page() {
  return (
    <AsvabResourceLayout
      title="Work With an Online ASVAB Tutor"
      label="Online ASVAB Tutor"
      intro={<><p>{"If you understand an explanation while reading it but struggle to solve the next problem, individual instruction can help you identify where the process breaks down."}</p>
        <p>{"ASVAB Tutoring offers online one-on-one support for learners who want a clearer plan and help working through difficult material."}</p>
        <p>{"See our "}<Link href={"/courses/asvab"}>{"ASVAB course"}</Link>{" for the wider curriculum and preparation options."}</p></>}
      action={{ href: "/contact-us", label: "Request an ASVAB Tutor" }}
      contents={[{"id": "begin-with-your-current-skills", "label": "Begin with your current skills"}, {"id": "how-online-tutoring-works", "label": "How online tutoring works"}, {"id": "use-tutoring-to-understand-your-reasoning", "label": "Use tutoring to understand your reasoning"}, {"id": "is-private-tutoring-a-good-fit", "label": "Is private tutoring a good fit?"}, {"id": "meet-the-team-behind-your-preparation", "label": "Meet the team behind your preparation"}, {"id": "choose-the-subject-coverage-you-need", "label": "Choose the subject coverage you need"}, {"id": "prepare-for-your-first-conversation", "label": "Prepare for your first conversation"}, {"id": "frequently-asked-questions", "label": "Frequently asked questions"}]}
      secondaryAction={{ href: "/package-details/1-on-1-tutoring/asvab", label: "View ASVAB Private Tutoring Packages" }}
      closing={<>{"Tell us your test date, the subjects you find difficult, and what you have tried so far. "}<Link href={"/contact-us"}>{"Contact our team about a focused preparation plan"}</Link>{"."}</>}
    >
        <h2 id="begin-with-your-current-skills">{"Begin with your current skills"}</h2>
        <p>{"Our "}<Link href={"/services/1-on-1-tutoring"}>{"one-on-one tutoring service"}</Link>{" begins with a Math and English assessment. Tutors use the results to develop a personalized learning plan."}</p>
        <p>{"Bring any recent practice results and describe where you get stuck. Specific examples—such as choosing the wrong operation in word problems or struggling to identify a passage’s main idea—give the conversation a useful starting point."}</p>
        <p>{"You can bring results from our "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{" to help explain where you need support. Read "}<Link href={"/how-it-works"}>{"how our assessment and learning-plan process works"}</Link>{" before your first conversation."}</p>
        <h2 id="how-online-tutoring-works">{"How online tutoring works"}</h2>
        <p>{"Sessions take place through Microsoft Teams and last two hours. The platform provides homework, practice tests, recorded video lessons, prediction tests, and progress reports."}</p>
        <p>{"Between sessions, use assigned practice to identify questions for your next meeting. Tell your tutor which step you attempted, where you became uncertain, and whether the same mistake appears in other problems."}</p>
        <h2 id="use-tutoring-to-understand-your-reasoning">{"Use tutoring to understand your reasoning"}</h2>
        <p>{"An answer alone does not show why a problem was difficult. You might recognize the concept but choose the wrong formula. You might calculate correctly but answer a different question from the one asked."}</p>
        <p>{"When you explain your work step by step, your tutor can help locate that gap. Your goal is to apply a method to unfamiliar questions and explain why it works."}</p>
        <h2 id="is-private-tutoring-a-good-fit">{"Is private tutoring a good fit?"}</h2>
        <p>{"Consider individual support if you need help rebuilding foundational skills, want detailed feedback on recurring errors, or find it difficult to organize independent study."}</p>
        <p>{"If you prefer shared instruction, explore our "}<Link href={"/asvab-prep-classes"}>{"ASVAB classes guide"}</Link>{" and ask about suitable group arrangements. If you prefer setting your own pace, explore "}<Link href={"/services/self-study"}>{"self-study"}</Link>{"."}</p>
        <h2 id="meet-the-team-behind-your-preparation">{"Meet the team behind your preparation"}</h2>
        <p>{"Visit our "}<Link href={"/our-tutors"}>{"tutor directory"}</Link>{" to learn about the people behind ASVAB Tutoring. When you contact us, describe your study needs and ask about instructor availability and a suitable match."}</p>
        <h2 id="choose-the-subject-coverage-you-need">{"Choose the subject coverage you need"}</h2>
        <p>{"Our private tutoring options include preparation focused on the four AFQT subjects as well as broader ASVAB preparation. Review the "}<Link href={"/package-details/1-on-1-tutoring/asvab"}>{"ASVAB private tutoring packages"}</Link>{" and discuss the subjects you need before enrolling."}</p>
        <h2 id="prepare-for-your-first-conversation">{"Prepare for your first conversation"}</h2>
        <p>{"Have your intended test date, available study times, practice results, and main questions ready. If you have a target military job, ask your recruiter which score requirements apply and bring that information too."}</p>
        <h2 id="frequently-asked-questions">{"Frequently asked questions"}</h2>
        <h3 id="can-i-study-from-home">{"Can I study from home?"}</h3>
        <p>{"Yes. The one-on-one service is online. You need a computer or laptop and a stable internet connection."}</p>
        <h3 id="can-i-ask-about-help-with-a-specific-subject">{"Can I ask about help with a specific subject?"}</h3>
        <p>{"Yes. Describe the subject and your difficulties when requesting tutoring so the team can discuss suitable support."}</p>
        <h3 id="what-if-i-have-already-studied-on-my-own">{"What if I have already studied on my own?"}</h3>
        <p>{"Bring your practice work. It can help identify concepts that need explanation and skills that need more independent practice."}</p>
        <h3 id="does-tutoring-guarantee-enlistment-or-a-particular-job">{"Does tutoring guarantee enlistment or a particular job?"}</h3>
        <p>{"Preparation supports skill development. Military eligibility and job placement also depend on requirements and decisions outside a tutoring program."}</p>
    </AsvabResourceLayout>
  );
}
