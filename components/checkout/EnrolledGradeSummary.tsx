import type { CourseVariantOption } from "@/lib/course-types";

export default function EnrolledGradeSummary({
  grade,
}: {
  grade: CourseVariantOption;
}) {
  return (
    <div className="mb-3">
      <div className="form-label fw-semibold text-muted mb-1">Grade</div>
      <div
        className="p-3 rounded"
        style={{
          background: "rgba(0,35,65,0.05)",
          border: "1px solid rgba(0,35,65,0.12)",
        }}
      >
        <div className="fw-semibold" style={{ color: "#002341" }}>
          {grade.course_name || `Course ${grade.main_course_id}`}
        </div>
        <div className="small text-muted mt-1">
          Your account is registered for this grade.
        </div>
      </div>
    </div>
  );
}
