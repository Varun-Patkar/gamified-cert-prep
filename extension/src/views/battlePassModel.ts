/** Pure view-model for the battle pass tab. No fs, no vscode, so it stays unit-testable. */

import { evaluateBadges } from "../gamification/badges";
import { buildBattlePass, newlyUnlocked } from "../gamification/battlePass";
import type { BadgeAward, BattlePassRewardKind, ExamMeta, Plan, Progress, QuestionBank } from "../model/types";

export type TierCardState = "claimed" | "unlocked" | "current" | "locked";

export interface TierCard {
	tier: number;
	label: string;
	state: TierCardState;
	requiredDays: number;
	day: number;
	date?: string;
	rewardKind: BattlePassRewardKind;
	rewardName: string;
	rewardIcon: string;
	rewardDescription: string;
	domainId?: string;
	final: boolean;
}

export interface BattlePassViewModel {
	examId: string;
	code: string;
	title: string;
	vendor: string;
	enabled: boolean;
	headline: string;
	subhead: string;
	totalTiers: number;
	currentTier: number;
	completedDays: number;
	totalDays: number;
	fractionToNext: number;
	nextRewardName?: string;
	daysToNextTier: number;
	examDate?: string;
	examDayLabel: string;
	tiers: TierCard[];
	/** Tier numbers to burst confetti over exactly once. */
	celebrate: number[];
	badges: BadgeAward[];
	disabledMessage?: string;
}

export interface BattlePassInput {
	meta: ExamMeta;
	plan?: Plan;
	progress: Progress;
	questions?: QuestionBank;
	enabled: boolean;
}

export function buildBattlePassModel(input: BattlePassInput): BattlePassViewModel {
	const { meta, plan, progress } = input;
	const pass = buildBattlePass(plan, progress);
	const bankTitles = new Map(
		(input.questions?.domains ?? []).map((domain) => [String(domain.domainId), domain.domainName])
	);

	const tiers: TierCard[] = pass.tiers.map((tier) => {
		const card: TierCard = {
			tier: tier.tier,
			label: tier.label,
			state: tier.unlocked ? (tier.claimed ? "claimed" : "unlocked") : tier.tier === pass.currentTier + 1 ? "current" : "locked",
			requiredDays: tier.requiredDays,
			day: tier.day,
			rewardKind: tier.reward.kind,
			rewardName:
				tier.reward.domainId && bankTitles.has(tier.reward.domainId)
					? `${bankTitles.get(tier.reward.domainId)} certificate`
					: tier.reward.name,
			rewardIcon: tier.reward.icon,
			rewardDescription: tier.reward.description,
			final: tier.final,
		};
		if (tier.date) {
			card.date = tier.date;
		}
		if (tier.reward.domainId) {
			card.domainId = tier.reward.domainId;
		}
		return card;
	});

	const claimed = progress.unlockedTiers ?? [];
	const unlocked = pass.tiers.filter((tier) => tier.unlocked).map((tier) => tier.tier);

	const model: BattlePassViewModel = {
		examId: meta.id,
		code: meta.code,
		title: meta.title,
		vendor: meta.vendor,
		enabled: input.enabled,
		headline: headlineFor(pass.currentTier, pass.totalTiers, input.enabled),
		subhead: subheadFor(pass.currentTier, pass.totalTiers, pass.nextTier?.reward.name),
		totalTiers: pass.totalTiers,
		currentTier: pass.currentTier,
		completedDays: pass.completedDays,
		totalDays: pass.totalDays,
		fractionToNext: pass.fractionToNext,
		daysToNextTier: pass.nextTier ? Math.max(0, pass.nextTier.requiredDays - pass.completedDays) : 0,
		examDayLabel: meta.examDate ? `Exam day · ${meta.examDate}` : "Exam day",
		tiers,
		celebrate: input.enabled ? newlyUnlocked(claimed, unlocked) : [],
		badges: input.enabled ? evaluateBadges(progress) : [],
	};

	if (pass.nextTier) {
		model.nextRewardName = pass.nextTier.reward.name;
	}
	if (meta.examDate) {
		model.examDate = meta.examDate;
	}
	if (!input.enabled) {
		model.disabledMessage =
			"Gamification is turned off, so the battle pass is sitting this one out. Flip certPrep.gamification.enabled back on whenever you want the track back.";
	}
	return model;
}

function headlineFor(currentTier: number, totalTiers: number, enabled: boolean): string {
	if (!enabled) {
		return "Battle pass paused";
	}
	if (totalTiers === 0) {
		return "No track yet";
	}
	if (currentTier >= totalTiers) {
		return "Track complete";
	}
	return currentTier === 0 ? "Tier 1 is one session away" : `Tier ${currentTier} of ${totalTiers}`;
}

function subheadFor(currentTier: number, totalTiers: number, nextReward?: string): string {
	if (totalTiers === 0) {
		return "Lay out a plan and the track builds itself around your exam date.";
	}
	if (currentTier >= totalTiers) {
		return "Every tier is yours. All that is left is the exam itself.";
	}
	return nextReward ? `Next up: ${nextReward}.` : "Keep clearing days and the track keeps opening.";
}
