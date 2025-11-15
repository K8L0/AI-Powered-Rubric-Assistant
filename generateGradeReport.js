// generateGradeReport.js
// Build a class-wide "Grade Confidence Report" using jsPDF + autoTable,
// based on the rubric text you generated for each student.

(function () {
  // Ensure jsPDF is loaded
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error("jsPDF not found. Make sure jspdf.umd.min.js is loaded before generateGradeReport.js");
    return;
  }

  const { jsPDF } = window.jspdf;

  // Ensure global namespace
  window.TAbot = window.TAbot || {};
  // Each entry will be: { student: string, categories: [ { category, grade, feedback, confidence } ] }
  window.TAbot.gradeSummaries = window.TAbot.gradeSummaries || [];

  /**
   * Parse a single rubric line like:
   *   Analysis: (5) excellent; """Feedback text..."""; very confident
   */
  function parseRubricLine(line) {
    if (!line || !line.trim()) return null;

    const parts = line.split(";").map(p => p.trim());
    if (!parts[0]) return null;

    const categoryAndGrade = parts[0];
    const feedbackRaw = parts[1] || "";
    const confidenceLabel = parts[2] || "";

    const colonIdx = categoryAndGrade.indexOf(":");
    if (colonIdx === -1) return null;

    const category = categoryAndGrade.slice(0, colonIdx).trim();         // e.g. "Analysis"
    const grade = categoryAndGrade.slice(colonIdx + 1).trim();           // e.g. "(5) excellent"
    const feedback = feedbackRaw.replace(/"""/g, "");                    // strip """ quotes

    return {
      category,
      grade,
      feedback,
      confidence: confidenceLabel          // e.g. "very confident"
    };
  }

  /**
   * Turn a whole rubric text for ONE student into structured data.
   * rubricText: multi-line string, 1 line per rubric category.
   */
  function parseRubricText(rubricText) {
    const lines = rubricText.split("\n").map(l => l.trim()).filter(Boolean);
    const categories = [];

    lines.forEach(line => {
      const parsed = parseRubricLine(line);
      if (parsed) categories.push(parsed);
    });

    return categories;
  }

  /**
   * Map a confidence label into "confident" / "not confident".
   * Uses your Confidence Spectrum:
   *   - Very confident / Pretty confident => confident
   *   - Somewhat unsure / Unsure => not confident
   */
  function confidenceFlag(label) {
    if (!label) return "not confident";
    const low = label.toLowerCase();

    if (low.startsWith("very confident") || low.startsWith("pretty confident")) {
      return "confident";
    }
    // "somewhat unsure", "unsure", anything else
    return "not confident";
  }

  /**
   * Called from gradeAssignments.js for each student after you have
   * the rubric text for that student.
   *
   * studentName: string (e.g., filename or student ID)
   * rubricText:  string (lines with Analysis/Evidence/Citations, etc.)
   */
  window.registerGradeResult = function (studentName, rubricText) {
    const categories = parseRubricText(rubricText);

    window.TAbot.gradeSummaries.push({
      student: studentName,
      categories
    });
  };

  /**
   * Generate a "Grade Confidence Report" PDF for the whole class.
   * Columns:
   *   Student | Category | Grade | Confidence label | Confident?
   */
  window.generateGradeReportPDF = function () {
    const summaries = window.TAbot.gradeSummaries || [];
    if (!summaries.length) {
      alert("No grade data available yet. Grade some submissions first.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Grade Confidence Report", 14, 20);

    const head = [["Student", "Category", "Grade", "Confidence label", "Confident?"]];
    const body = [];

    summaries.forEach(entry => {
      const student = entry.student;
      (entry.categories || []).forEach(cat => {
        const gradeText = cat.grade || "";
        const confLabel = cat.confidence || "";
        const flag = confidenceFlag(confLabel);

        body.push([
          student,
          cat.category || "",
          gradeText,
          confLabel,
          flag
        ]);
      });
    });

    doc.autoTable({
      startY: 26,
      head,
      body,
      styles: { fontSize: 10, halign: "center", valign: "middle" },
      headStyles: { fillColor: [3, 102, 214], textColor: 255, fontStyle: "bold" },
    });

    doc.save("grade_confidence_report.pdf");
  };
})();
