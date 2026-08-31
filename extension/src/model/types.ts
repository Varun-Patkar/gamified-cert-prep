/** Everything the UI needs to render an exam without parsing prose. */

export type ExamStatus = "planning" | "in-progress" | "completed" | "abandoned";

export interface ExamMeta {
	schemaVersion: 1;
	id: string;
	vendor: string;
	code: string;
	title: string;
	status: ExamStatus;
	/** Earned before this extension existed: shown in the trophy case, excluded from XP. */
	legacy: boolean;
	gamified: boolean;
	folder: string;
	createdAt: string;
	examDate?: string;
	completedAt?: string;
	result?: ExamResult;
	planConfig?: PlanConfig;
}

export interface ExamResult {
	passed: boolean;
	score?: number;
	maxScore?: number;
	passingScore?: number;
	credentialUrl?: string;
	scoreReportFile?: string;
}

export type DayPolicy = "weekdays" | "weekends" | "all" | "custom";

export interface PlanConfig {
	startDate: string;
	examDate: string;
	hoursPerDay: number;
	dayPolicy: DayPolicy;
	/** Only meaningful when dayPolicy is "custom": 0=Sunday .. 6=Saturday. */
	customDays?: number[];
	questionsPerDay: number;
	includeReviewDays: boolean;
	includeFinalMock: boolean;
}

export type DayKind = "study" | "review" | "buffer" | "mock" | "exam";

export interface PlanDay {
	day: number;
	date: string;
	kind: DayKind;
	title: string;
	domainId?: string;
	topicIds: string[];
	questionCount: number;
	sessionFile: string;
}

export interface Plan {
	schemaVersion: 1;
	examId: string;
	generatedAt: string;
	config: PlanConfig;
	days: PlanDay[];
}

export interface Domain {
	id: string;
	title: string;
	/** Percentage of the exam, 0-100. */
	weight: number;
	topicIds: string[];
}

export interface DayResult {
	day: number;
	attempt: number;
	completedAt: string;
	questionsAnswered: number;
	correct: number;
	accuracy: number;
	weakTopicIds: string[];
	xpAwarded: number;
}

export interface Progress {
	schemaVersion: 1;
	examId: string;
	completedDays: number[];
	results: DayResult[];
	xp: number;
	streak: StreakState;
	badges: string[];
	unlockedTiers: number[];
	domainCertificates: string[];
}

export interface StreakState {
	current: number;
	longest: number;
	lastStudyDate?: string;
	freezeTokens: number;
}

/** Lifetime, cross-exam. Battle passes are per-exam; XP is not. */
export interface UserProfile {
	schemaVersion: 1;
	displayName?: string;
	lifetimeXp: number;
	badges: string[];
	createdAt: string;
}

/** Mirrors the on-disk `questions.json` written by the quiz runner; unknown extra keys are preserved. */
export interface Question {
	id: string;
	question: string;
	options: string[];
	correctAnswer: string | string[];
	explanation?: string;
	topic?: string;
	difficulty?: string;
	type?: string;
	ungraded?: boolean;
	[key: string]: unknown;
}

export interface QuestionDomain {
	domainId: string;
	domainName: string;
	questions: Question[];
}

export interface QuestionBank {
	examCode: string;
	examName?: string;
	totalQuestions?: number;
	sources?: string[];
	domains: QuestionDomain[];
}

export interface SourceRef {
	id: string;
	title: string;
	url?: string;
	file?: string;
	kind: "official-objectives" | "official-docs" | "official-practice" | "community" | "user-supplied";
	/** User-supplied and official sources are used verbatim; community content is only paraphrased. */
	trusted: boolean;
	approvedAt?: string;
}
