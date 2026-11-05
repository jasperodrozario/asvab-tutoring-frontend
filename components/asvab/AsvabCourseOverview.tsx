import Link from "next/link";

// Source: officialasvab.com/applicants/cat-asvab/, reviewed November 5, 2026.
const CAT_SUBTESTS = [
  ["General Science (GS)", 15, 12, 25],
  ["Arithmetic Reasoning (AR)", 15, 55, 113],
  ["Word Knowledge (WK)", 15, 9, 18],
  ["Paragraph Comprehension (PC)", 10, 27, 75],
  ["Mathematics Knowledge (MK)", 15, 31, 65],
  ["Electronics Information (EI)", 15, 10, 21],
  ["Auto Information (AI)", 10, 7, 18],
  ["Shop Information (SI)", 10, 6, 17],
  ["Mechanical Comprehension (MC)", 15, 22, 42],
  ["Assembling Objects (AO)", 15, 18, 38],
] as const;

export default function AsvabCourseOverview() {
  return (
    <div>
      <h2 className="h4">What is the ASVAB?</h2>
      <p>
        The Armed Services Vocational Aptitude Battery measures abilities used
        in military enlistment and job qualification decisions. Our{" "}
        <Link href="/military-asvab-test">military ASVAB test guide</Link>{" "}
        explains how to connect those goals with your preparation.
      </p>

      <h2 className="h4 mt-4">How does ASVAB Tutoring help you?</h2>
      <p>
        Our preparation combines topic review, homework, practice tests, and
        learning materials. Choose individual tutoring, organized group
        instruction, or independent study, with guided preparation focused on
        the skills you need to strengthen.
      </p>
      <ul>
        <li>Review concepts and practice applying them to unfamiliar questions.</li>
        <li>Use practice results to identify your weaker areas.</li>
        <li>Build a study routine and review your progress.</li>
      </ul>

      <h2 className="h4 mt-4">ASVAB test structure</h2>
      <p>
        The computer-adaptive ASVAB (CAT-ASVAB) has ten subtests. Auto Information
        and Shop Information are administered separately. A course may group
        those topics into one study area; that is different from the official
        test structure.
      </p>
      <div
        className="table-responsive"
        role="region"
        aria-label="CAT-ASVAB question counts and time limits"
        tabIndex={0}
      >
        <table className="table table-bordered align-middle">
          <caption>
            CAT-ASVAB scored questions and time limits in minutes. Each subtest
            may include 15 additional tryout questions; the time allowed depends
            on whether tryout questions are included.
          </caption>
          <thead>
            <tr>
              <th scope="col">Subtest</th>
              <th scope="col">Scored questions</th>
              <th scope="col">Minutes without tryouts</th>
              <th scope="col">Minutes with tryouts</th>
            </tr>
          </thead>
          <tbody>
            {CAT_SUBTESTS.map(([name, questions, minutes, minutesWithTryouts]) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>{questions}</td>
                <td>{minutes}</td>
                <td>{minutesWithTryouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small">
        Source: <a href="https://www.officialasvab.com/applicants/cat-asvab/">
          Official CAT-ASVAB test lengths and time limits
        </a>. Reviewed November 5, 2026. For paper-and-pencil testing, Auto and
        Shop are combined and Assembling Objects is not administered; see the{" "}
        <a href="https://www.officialasvab.com/counselors-educators/subtests/">
          official ASVAB subtest descriptions
        </a> for format differences.
      </p>

      <h2 className="h4 mt-4">Understand your AFQT score</h2>
      <p>
        Arithmetic Reasoning, Mathematics Knowledge, Word Knowledge, and
        Paragraph Comprehension contribute to the AFQT. It is reported as a
        percentile from 1 to 99, rather than a percentage of correct answers.
        Branch and job requirements depend on your circumstances. Confirm
        current requirements with your recruiter and use them to guide your
        study priorities.
      </p>
      <p>
        See the <a href="https://www.officialasvab.com/applicants/scores/">
          official explanation of ASVAB scores
        </a>, then use our <Link href="/asvab-study-guide">ASVAB study guide</Link>{" "}
        to organize your preparation.
      </p>
    </div>
  );
}
