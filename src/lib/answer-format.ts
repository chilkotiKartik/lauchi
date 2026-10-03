/** Answer-format checks shared by the quiz screens. Kept apart from quiz-core so client code never pulls in the
 * question generator (which holds the answers). */
export const isNumberAnswer = (t: string) => /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t.trim().replace("−", "-"));
