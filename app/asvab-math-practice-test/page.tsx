import Link from "next/link";
import AsvabResourceLayout from "@/components/asvab/AsvabResourceLayout";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "ASVAB Math Practice Test With Answers | ASVAB Tutoring",
  description: "Practice ASVAB Arithmetic Reasoning and Mathematics Knowledge with original questions, worked answers, and a clear plan for reviewing mistakes.",
  path: "/asvab-math-practice-test",
});

export default function Page() {
  return (
    <AsvabResourceLayout
      faqs={[
        {
          id: "can-i-use-a-calculator-on-the-asvab",
          question: "Can I use a calculator on the ASVAB?",
          answers: "No. Build your practice routine around hand calculations."
        },
        {
          id: "does-studying-math-cover-everything-i-need",
          question: "Does studying math cover everything I need?",
          answers: "No. Include vocabulary, reading, and any additional subjects relevant to your preparation goals."
        }
      ]}
      title="ASVAB Math Practice Test With Worked Answers"
      intro={<><p>{"Try these eight original practice questions to check your math foundations. Work without a calculator, write down your steps, and review the explanations after you finish."}</p>
        <p>{"This short learning exercise covers both ASVAB math areas. It is not an official test, an adaptive simulation, or an AFQT score predictor."}</p></>}
      action={{ href: "/courses/asvab/free-practice-test", label: "Continue to Free ASVAB Practice" }}
      contents={[{"id": "arithmetic-reasoning-and-mathematics-knowledge", "label": "Arithmetic Reasoning and Mathematics Knowledge"}, {"id": "practice-questions", "label": "Practice questions"}, {"id": "answers-and-explanations", "label": "Answers and explanations"}, {"id": "turn-your-results-into-a-study-plan", "label": "Turn your results into a study plan"}, {"id": "continue-practicing", "label": "Continue practicing"}, {"id": "faqs", "label": "Frequently asked questions"}]}
    >
        <h2 id="arithmetic-reasoning-and-mathematics-knowledge">{"Arithmetic Reasoning and Mathematics Knowledge"}</h2>
        <p>{"Arithmetic Reasoning asks you to apply math to word problems. Mathematics Knowledge checks your understanding of mathematical principles. Practice both: knowing how to solve an equation is useful, but you also need to recognize when a word problem requires one."}</p>
        <h2 id="practice-questions">{"Practice questions"}</h2>
        <h3 id="1-arithmetic-reasoning-percentages">{"1. Arithmetic Reasoning: Percentages"}</h3>
        <p>{"A backpack costs $80 before a 15% discount. What is its sale price before tax?"}</p>
        <ol type="A"><li>{"$12"}</li><li>{"$65"}</li><li>{"$68"}</li><li>{"$72"}</li></ol>
        <h3 id="2-arithmetic-reasoning-ratios">{"2. Arithmetic Reasoning: Ratios"}</h3>
        <p>{"A mixture uses 3 cups of concentrate for every 5 cups of water. How much water is needed with 12 cups of concentrate?"}</p>
        <ol type="A"><li>{"15 cups"}</li><li>{"20 cups"}</li><li>{"24 cups"}</li><li>{"60 cups"}</li></ol>
        <h3 id="3-arithmetic-reasoning-unit-rates">{"3. Arithmetic Reasoning: Unit rates"}</h3>
        <p>{"A vehicle travels 144 miles in 3 hours at a constant speed. How far does it travel in 5 hours?"}</p>
        <ol type="A"><li>{"48 miles"}</li><li>{"192 miles"}</li><li>{"216 miles"}</li><li>{"240 miles"}</li></ol>
        <h3 id="4-arithmetic-reasoning-fractions">{"4. Arithmetic Reasoning: Fractions"}</h3>
        <p>{"A tank is three-fourths full. After 10 gallons are used, it is one-half full. What is its capacity?"}</p>
        <ol type="A"><li>{"20 gallons"}</li><li>{"30 gallons"}</li><li>{"40 gallons"}</li><li>{"50 gallons"}</li></ol>
        <h3 id="5-mathematics-knowledge-equations">{"5. Mathematics Knowledge: Equations"}</h3>
        <p>{"Solve: 4(2x − 3) = 28."}</p>
        <ol type="A"><li>{"2"}</li><li>{"5"}</li><li>{"8"}</li><li>{"10"}</li></ol>
        <h3 id="6-mathematics-knowledge-exponents">{"6. Mathematics Knowledge: Exponents"}</h3>
        <p>{"Simplify: a⁷ ÷ a³, where a ≠ 0."}</p>
        <ol type="A"><li>{"a⁴"}</li><li>{"a¹⁰"}</li><li>{"a²¹"}</li><li>{"4a"}</li></ol>
        <h3 id="7-mathematics-knowledge-geometry">{"7. Mathematics Knowledge: Geometry"}</h3>
        <p>{"A right triangle has legs measuring 6 inches and 8 inches. What is its area?"}</p>
        <ol type="A"><li>{"14 square inches"}</li><li>{"24 square inches"}</li><li>{"28 square inches"}</li><li>{"48 square inches"}</li></ol>
        <h3 id="8-mathematics-knowledge-factoring">{"8. Mathematics Knowledge: Factoring"}</h3>
        <p>{"Factor: x² + 7x + 12."}</p>
        <ol type="A"><li>{"(x + 2)(x + 6)"}</li><li>{"(x − 3)(x − 4)"}</li><li>{"(x + 3)(x + 4)"}</li><li>{"(x + 1)(x + 12)"}</li></ol>
        <h2 id="answers-and-explanations">{"Answers and explanations"}</h2>
        <p><strong>{"1. C — $68."}</strong>{" The discount is 0.15 × $80 = $12. Subtract the discount from the original price: $80 − $12 = $68. The question asks for the final price, not the amount saved."}</p>
        <p><strong>{"2. B — 20 cups."}</strong>{" Concentrate increases from 3 cups to 12 cups, a factor of 4. Multiply the water by the same factor: 5 × 4 = 20 cups."}</p>
        <p><strong>{"3. D — 240 miles."}</strong>{" Divide distance by time to find the speed: 144 ÷ 3 = 48 miles per hour. Multiply by 5 hours: 48 × 5 = 240 miles."}</p>
        <p><strong>{"4. C — 40 gallons."}</strong>{" The change from three-fourths to one-half is one-fourth of the tank. If one-fourth holds 10 gallons, the full tank holds 4 × 10 = 40 gallons."}</p>
        <p><strong>{"5. B — 5."}</strong>{" Divide both sides by 4 to get 2x − 3 = 7. Add 3, giving 2x = 10. Divide by 2, giving x = 5. Substitution confirms 4(10 − 3) = 28."}</p>
        <p><strong>{"6. A — a⁴."}</strong>{" When dividing powers with the same nonzero base, subtract the denominator’s exponent from the numerator’s: a⁷⁻³ = a⁴."}</p>
        <p><strong>{"7. B — 24 square inches."}</strong>{" The perpendicular legs serve as base and height. Area = ½ × 6 × 8 = 24 square inches. Multiplying 6 × 8 alone would give twice the triangle’s area."}</p>
        <p><strong>{"8. C — (x + 3)(x + 4)."}</strong>{" Find two numbers whose product is 12 and whose sum is 7. Those numbers are 3 and 4. Expanding the factors gives x² + 4x + 3x + 12."}</p>
        <h2 id="turn-your-results-into-a-study-plan">{"Turn your results into a study plan"}</h2>
        <p>{"Count one point for each correct answer. Your total is a result out of eight; it cannot be converted into an official ASVAB score."}</p>
        <p>{"Review missed questions by skill. A mistake on Question 4 suggests reviewing fractions and whole-part relationships. A mistake on Question 7 suggests reviewing area formulas and identifying perpendicular dimensions. Correct answers reached by guessing also deserve review."}</p>
        <p>{"After reviewing a skill, solve a fresh problem with different values. This checks whether you understand the method rather than remember the answer. Use our "}<Link href={"/asvab-study-guide"}>{"ASVAB study guide"}</Link>{" to organize your next review sessions."}</p>
        <h2 id="continue-practicing">{"Continue practicing"}</h2>
        <p>{"Open our "}<Link href={"/courses/asvab/free-practice-test"}>{"free ASVAB practice test"}</Link>{" and choose Arithmetic Reasoning or Math Knowledge. If you need guided review, explore the "}<Link href={"/courses/asvab"}>{"ASVAB course"}</Link>{"."}</p>
        <p>{"If you can follow the explanations but struggle with fresh problems, consider our "}<Link href={"/services/1-on-1-tutoring"}>{"one-on-one tutoring service"}</Link>{" for guided review. See the "}<Link href={"/package-details/1-on-1-tutoring/asvab"}>{"ASVAB private tutoring packages"}</Link>{" for preparation options."}</p>
        <p>{"If you prefer independent practice, explore the "}<Link href={"/services/self-study"}>{"self-study learning materials"}</Link>{", then review the "}<Link href={"/package-details/self-study/asvab"}>{"ASVAB self-study package"}</Link>{" for subscription details. If you need help choosing, "}<Link href={"/contact-us"}>{"ask our team about your math preparation"}</Link>{"."}</p>
    </AsvabResourceLayout>
  );
}
