import Link from "next/link";
import AsvabResourceLayout from "@/components/asvab/AsvabResourceLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Military ASVAB Test Prep | ASVAB Tutoring",
  description: "Understand the military ASVAB test, identify your study priorities, and explore practice questions, online classes, and personalized tutoring.",
  path: "/military-asvab-test",
});

export default function Page() {
  return (
    <AsvabResourceLayout
      title="Military ASVAB Test Prep for Your Next Step"
      label="Military ASVAB Test"
      intro={<><p>{"Preparing to enlist starts with understanding the test and the skills you need to strengthen. ASVAB Tutoring helps you connect your practice results with a focused preparation plan."}</p>
        <p>{"Begin with our "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{", review the areas that need work, and choose the level of support that fits your schedule."}</p></>}
      action={{ href: "/courses/asvab/free-practice-test", label: "Take a Free ASVAB Practice Test" }}
      contents={[{"id": "understand-what-your-scores-mean", "label": "Understand what your scores mean"}, {"id": "build-a-preparation-plan-around-your-needs", "label": "Build a preparation plan around your needs"}, {"id": "prepare-beyond-the-four-afqt-subjects", "label": "Prepare beyond the four AFQT subjects"}, {"id": "choose-your-next-step", "label": "Choose your next step"}, {"id": "frequently-asked-questions", "label": "Frequently asked questions"}]}
      secondaryAction={{ href: "/courses/asvab", label: "Explore ASVAB Prep Options" }}
      closing={<>{"Find your starting point. Take the free ASVAB practice test and use your results to choose what to study next."}</>}
    >
        <h2 id="understand-what-your-scores-mean">{"Understand what your scores mean"}</h2>
        <p>{"The Armed Services Vocational Aptitude Battery measures abilities across several subject areas. Military services use its results as part of enlistment and job qualification decisions."}</p>
        <p>{"The AFQT is a score calculated from Arithmetic Reasoning, Mathematics Knowledge, Word Knowledge, and Paragraph Comprehension. It is reported as a percentile from 1 to 99—not the percentage of questions you answered correctly."}</p>
        <p>{"Military job qualification also uses combinations of subtest scores. Ask your recruiter which requirements apply to your intended branch and career field before choosing your study priorities."}</p>
        <h2 id="build-a-preparation-plan-around-your-needs">{"Build a preparation plan around your needs"}</h2>
        <p>{"If fractions slow you down, begin with fractions before moving into multistep word problems. If you understand individual words but struggle with passages, practice identifying the main point and locating supporting evidence."}</p>
        <p>{"Use this sequence to organize your preparation:"}</p>
        <ol><li>{"Take a baseline practice test without outside help."}</li><li>{"Separate unfamiliar concepts from calculation or reading mistakes."}</li><li>{"Review one weak skill at a time."}</li><li>{"Solve new questions that use the same skill."}</li><li>{"Return to mixed practice to check whether you can choose the right method independently."}</li></ol>
        <h2 id="prepare-beyond-the-four-afqt-subjects">{"Prepare beyond the four AFQT subjects"}</h2>
        <p>{"Your preparation may also need to cover science, electronics, auto and shop knowledge, mechanical principles, and spatial reasoning. Choose additional review based on your practice results and the score requirements relevant to your goals."}</p>
        <p>{"Explore our "}<Link href={"/courses/asvab"}>{"ASVAB course"}</Link>{" for available subject coverage and learning options."}</p>
        <p>{"Read "}<Link href={"/how-it-works"}>{"how our assessment and study-plan process works"}</Link>{" to understand how we organize guided preparation."}</p>
        <h2 id="choose-your-next-step">{"Choose your next step"}</h2>
        <p>{"Start with the free test if you need a clearer picture of your current skills. Use our "}<Link href={"/asvab-study-guide"}>{"ASVAB study guide"}</Link>{" if you want a routine to follow. Explore "}<Link href={"/asvab-tutor"}>{"individual ASVAB tutoring"}</Link>{" if you keep making the same mistakes or need help deciding what to study first."}</p>
        <p>{"If you want independent preparation, explore our "}<Link href={"/services/self-study"}>{"self-study resources"}</Link>{". For guided support, review our "}<Link href={"/services/1-on-1-tutoring"}>{"one-on-one tutoring service"}</Link>{" and learn about the team in our "}<Link href={"/our-tutors"}>{"tutor directory"}</Link>{"."}</p>
        <h3 id="check-your-progress-after-studying">{"Check your progress after studying"}</h3>
        <p>{"Our "}<Link href={"/courses/asvab/free-prediction-test"}>{"free ASVAB/AFQT prediction test"}</Link>{" offers another way to review your preparation. Its result is a practice estimate, not an official score or eligibility decision."}</p>
        <p>{"If you are unsure which preparation option fits, "}<Link href={"/contact-us"}>{"contact ASVAB Tutoring"}</Link>{" with your test date and current study needs."}</p>
        <h2 id="frequently-asked-questions">{"Frequently asked questions"}</h2>
        <h3 id="is-the-afqt-a-separate-exam">{"Is the AFQT a separate exam?"}</h3>
        <p>{"No. It is calculated from four ASVAB subtests."}</p>
        <h3 id="what-score-should-i-aim-for">{"What score should I aim for?"}</h3>
        <p>{"Confirm the current requirements for your circumstances and intended job with your recruiter. Then use those requirements to guide your preparation."}</p>
        <h3 id="will-a-practice-test-tell-me-my-official-score">{"Will a practice test tell me my official score?"}</h3>
        <p>{"No. Practice results help identify study needs. They are not an official score report or a determination of eligibility."}</p>
    </AsvabResourceLayout>
  );
}
