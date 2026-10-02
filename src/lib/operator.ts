export const operator = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME || "kalu don",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  grievance: process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
};
