import { jsPDF } from "jspdf";
import type { Student } from "@workspace/api-client-react";

function photoSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return `/api/storage${path}`;
}

async function loadImageAsDataUrl(
  url: string,
): Promise<{ data: string; format: "JPEG" | "PNG" } | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: "JPEG" | "PNG" =
      blob.type === "image/png" ? "PNG" : "JPEG";
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { data: dataUrl, format };
  } catch {
    return null;
  }
}

export async function generateStudentCard(student: Student) {
  // A6 Landscape size: 148 x 105 mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a6",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(30, 58, 138); // Deep Navy
  doc.rect(0, 0, width, height, "F");

  // Header bar
  doc.setFillColor(217, 119, 6); // Amber
  doc.rect(0, 0, width, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("RUDHRA LIBRARY", width / 2, 16, { align: "center" });

  // Student photo
  const photoSize = 35;
  const photoX = 15;
  const photoY = 35;

  // White frame around the photo
  doc.setFillColor(255, 255, 255);
  doc.rect(photoX - 1, photoY - 1, photoSize + 2, photoSize + 2, "F");

  let drewPhoto = false;
  const src = photoSrc(student.photoUrl);
  if (src) {
    const loaded = await loadImageAsDataUrl(src);
    if (loaded) {
      try {
        doc.addImage(
          loaded.data,
          loaded.format,
          photoX,
          photoY,
          photoSize,
          photoSize,
        );
        drewPhoto = true;
      } catch {
        drewPhoto = false;
      }
    }
  }

  if (!drewPhoto) {
    // Fallback: white box with student initial
    doc.setFillColor(241, 245, 249);
    doc.rect(photoX, photoY, photoSize, photoSize, "F");
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const initial = student.name ? student.name.charAt(0).toUpperCase() : "?";
    doc.text(initial, photoX + photoSize / 2, photoY + photoSize / 2 + 7, {
      align: "center",
    });
  }

  // Card ID under photo
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(student.cardId, photoX + photoSize / 2, photoY + photoSize + 7, {
    align: "center",
  });

  // Student details
  const detailsX = 60;
  let currentY = 40;
  const lineHeight = 7;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(student.name, detailsX, currentY);
  currentY += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (student.fatherName) {
    doc.text(`D/S of: ${student.fatherName}`, detailsX, currentY);
    currentY += lineHeight;
  }

  doc.text(`Shift: ${student.shift}`, detailsX, currentY);
  currentY += lineHeight;

  if (student.seatNumber) {
    doc.text(`Seat No: ${student.seatNumber}`, detailsX, currentY);
    currentY += lineHeight;
  }

  doc.text(
    `Valid Until: ${new Date(student.validUntil).toLocaleDateString()}`,
    detailsX,
    currentY,
  );
  currentY += lineHeight;

  // Fees summary on the card
  const totalFees = Number(student.feesAmount) || 0;
  const paidFees = Number(student.feesPaid) || 0;
  const pendingFees = Math.max(0, totalFees - paidFees);

  doc.text(
    `Fees: Rs. ${totalFees}  |  Paid: Rs. ${paidFees}`,
    detailsX,
    currentY,
  );
  currentY += lineHeight;

  if (pendingFees > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(254, 215, 170);
    doc.text(`Pending: Rs. ${pendingFees}`, detailsX, currentY);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(187, 247, 208);
    doc.text("Fees: Fully Paid", detailsX, currentY);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
  }

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, height - 15, width, 15, "F");

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text("Owner: Ankit Kumar", 10, height - 6);
  doc.text(
    "Phone: +91 9528335124, +91 7900799154",
    width - 10,
    height - 6,
    { align: "right" },
  );

  doc.save(`${student.cardId}-${student.name.replace(/\s+/g, "_")}.pdf`);
}
