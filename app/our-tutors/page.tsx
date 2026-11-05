import OurTutorsContent from "./OurTutorsContent";
import { fetchTutorList } from "@/lib/php-api";
import AsvabResourceLinks from "@/components/asvab/AsvabResourceLinks";

export const revalidate = 3600;

export default async function TutorsListPage() {
  const tutors = await fetchTutorList();
  return (
    <>
      <OurTutorsContent tutors={tutors} />
      <div className="container">
        <AsvabResourceLinks
          paths={["/asvab-tutor"]}
          title="Preparing for the ASVAB?"
        />
      </div>
    </>
  );
}
